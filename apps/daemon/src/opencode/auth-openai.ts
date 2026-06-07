/**
 * Daemon-side OpenAI ChatGPT OAuth orchestration.
 *
 * Ports the SDK-based OAuth flow from commercial
 * `1a320029:apps/desktop/src/main/opencode/auth-browser.ts`. In commercial
 * the flow ran inside Electron main; in OSS it lives in the daemon because
 * the daemon owns `opencode serve` lifecycle (Phase 2 of the SDK cutover
 * port). Desktop keeps the Electron-only `shell.openExternal` step and
 * drives the two daemon RPCs.
 *
 * Phase 4a RPC protocol (registered in `daemon-routes.ts`):
 *   - `auth.openai.startLogin()` → `{ sessionId, authorizeUrl }`
 *   - `auth.openai.awaitCompletion({ sessionId, timeoutMs? })` → plan
 *   - `auth.openai.status()` → `{ connected, expires? }`
 *   - `auth.openai.getAccessToken()` → `string | null`
 *
 * The manager holds at most one in-flight session at a time (matches
 * commercial's `OAuthBrowserFlow` class). A second `startLogin` aborts the
 * first — typical when a user retries without explicitly cancelling.
 *
 * ---------------------------------------------------------------------------
 * OAuth flow — two-step contract with `opencode serve`
 * ---------------------------------------------------------------------------
 *
 * OpenCode's SDK exposes OAuth as TWO endpoints on the transient
 * `opencode serve`, and BOTH must be called:
 *
 *   1. `POST /provider/openai/oauth/authorize { method }`
 *      Server-side effect:
 *        - Binds an OAuth HTTP listener on `localhost:1455` (hardcoded in
 *          opencode, registered as the redirect URI with OpenAI's app).
 *        - Generates PKCE + state, stores a `pending[openai]` handle with
 *          a `callbackPromise` that resolves once `:1455/auth/callback`
 *          receives the browser redirect.
 *      Returns `{ url, method: "auto", instructions }`.
 *      Does NOT write `auth.json` yet.
 *
 *   2. Browser lands on `:1455/auth/callback?code=X`
 *        - opencode's handler fires `exchangeCodeForTokens(code)` async and
 *          RETURNS THE HTML SUCCESS PAGE IMMEDIATELY (user sees success).
 *        - Tokens sit in memory, awaiting a consumer.
 *      Still no `auth.json` write.
 *
 *   3. `POST /provider/openai/oauth/callback { method }`  ← THIS is what
 *      the prior implementation was missing. Until it is called, opencode
 *      holds the tokens unconsumed and `auth.json` is never updated.
 *      Server-side effect:
 *        - Awaits the pending `callbackPromise`.
 *        - Writes `auth.json` via `Auth.set('openai', { type: 'oauth',
 *          access, refresh, expires, accountId })`.
 *      Returns `true` on success.
 *
 * The pre-fix implementation called step 1 and then polled `auth.json`
 * mtime+hash for up to two minutes waiting for opencode to write it on its
 * own — which never happened. That produced the user-visible "browser
 * shows success, daemon hangs, at the end it fails" regression after the
 * PTY → SDK cutover.
 *
 * The current implementation invokes `client.provider.oauth.callback` and
 * lets opencode drive the completion. The 2-minute deadline is enforced on
 * our side to cap the wait (opencode's own internal `waitForOAuthCallback`
 * timer is 5 minutes).
 */

import { randomUUID } from 'node:crypto';
import {
  detectOpenAiOauthPlan,
  getOpenAiOauthAccessToken,
  getOpenAiOauthStatus,
  getOpenCodeAuthJsonPath,
  type OpenAiOauthPlan,
} from '@myboteam/agent-core';
import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import { log } from '../logger.js';
import {
  type ActiveSession,
  abortError,
  OAuthLoginError,
  OPENAI_AUTH_TIMEOUT_MS,
  OPENAI_PROVIDER_ID,
  pickOauthMethodIndex,
} from './auth-openai-utils.js';
import type { ServerManagerDeps } from './server-config.js';
import { createTransientOpencodeClient } from './server-transient.js';

export class OpenAiOauthManager {
  private active: ActiveSession | null = null;
  private disposed = false;

  constructor(private readonly deps: ServerManagerDeps) {}

  async startLogin(): Promise<{ sessionId: string; authorizeUrl: string }> {
    if (this.disposed) {
      throw new OAuthLoginError('OAuth manager is disposed.');
    }
    if (this.active) {
      log.info('[auth.openai] Aborting prior in-flight session before starting a new one');
      this.abortActive();
    }

    const sessionId = randomUUID();
    const abortController = new AbortController();
    const signal = abortController.signal;

    log.info(
      `[auth.openai] startLogin sessionId=${sessionId.slice(0, 8)} — spawning transient runtime`,
    );
    const runtime = await createTransientOpencodeClient(this.deps, signal);
    if (signal.aborted) {
      runtime.close();
      throw abortError('OpenAI authentication was cancelled.');
    }
    log.info('[auth.openai] Transient runtime ready, querying provider auth methods');

    const authResult = await runtime.client.provider.auth();
    const methods = (
      authResult.data as Record<string, Array<{ type: 'oauth' | 'api'; label: string }>> | undefined
    )?.[OPENAI_PROVIDER_ID];
    if (!methods || methods.length === 0) {
      runtime.close();
      throw new OAuthLoginError('OpenAI authentication is not available in this OpenCode runtime.');
    }
    log.info(
      `[auth.openai] Provider methods: ${methods.map((m) => `${m.type}:${m.label}`).join(', ')}`,
    );

    const methodIndex = pickOauthMethodIndex(methods);
    log.info(`[auth.openai] Calling oauth.authorize with method index ${methodIndex}`);
    const authorize = await runtime.client.provider.oauth.authorize({
      providerID: OPENAI_PROVIDER_ID,
      method: methodIndex,
    });

    const authorizeUrl = (authorize.data as { url?: string } | undefined)?.url;
    if (!authorizeUrl) {
      runtime.close();
      throw new OAuthLoginError('OpenAI authentication did not return an authorization URL.');
    }
    log.info(
      `[auth.openai] Authorize URL ready (${authorizeUrl.slice(0, 80)}...). ` +
        `Arming provider.oauth.callback and waiting for browser completion at localhost:1455.`,
    );

    const deadline = Date.now() + OPENAI_AUTH_TIMEOUT_MS;
    const completion: Promise<OpenAiOauthPlan> = (async () => {
      try {
        await Promise.race([
          runtime.client.provider.oauth.callback(
            { providerID: OPENAI_PROVIDER_ID, method: methodIndex },
            { throwOnError: true, signal } as unknown as Parameters<
              OpencodeClient['provider']['oauth']['callback']
            >[1],
          ),
          new Promise<never>((_resolve, reject) => {
            const remaining = Math.max(0, deadline - Date.now());
            const timer = setTimeout(
              () =>
                reject(new OAuthLoginError('OpenAI authentication timed out. Please try again.')),
              remaining,
            );
            const onAbort = (): void => {
              clearTimeout(timer);
              reject(abortError('OpenAI authentication was cancelled.'));
            };
            if (signal.aborted) {
              onAbort();
              return;
            }
            signal.addEventListener('abort', onAbort, { once: true });
          }),
        ]);
        log.info('[auth.openai] oauth.callback resolved — reading plan from auth.json');
        return await detectOpenAiOauthPlan({ authStatePath: getOpenCodeAuthJsonPath() });
      } finally {
        try {
          runtime.close();
        } catch {
          /* ignore */
        }
        if (this.active?.sessionId === sessionId) {
          this.active = null;
        }
      }
    })();
    completion.catch(() => {});

    this.active = {
      sessionId,
      abortController,
      authorizeUrl,
      completion,
      runtime,
    };

    return { sessionId, authorizeUrl };
  }

  async awaitCompletion(params: {
    sessionId: string;
    timeoutMs?: number;
  }): Promise<{ ok: true; plan: OpenAiOauthPlan } | { ok: false; error: string }> {
    const session = this.active;
    if (!session || session.sessionId !== params.sessionId) {
      return { ok: false, error: 'No matching in-flight OAuth session.' };
    }
    const timeoutMs = params.timeoutMs ?? OPENAI_AUTH_TIMEOUT_MS;
    try {
      const plan = await Promise.race([
        session.completion,
        new Promise<never>((_resolve, reject) => {
          setTimeout(
            () => reject(new OAuthLoginError('awaitCompletion RPC timed out.')),
            timeoutMs,
          );
        }),
      ]);
      return { ok: true, plan };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  status(): { connected: boolean; expires?: number } {
    return getOpenAiOauthStatus();
  }

  getAccessToken(): string | null {
    return getOpenAiOauthAccessToken();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abortActive();
  }

  private abortActive(): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    active.abortController.abort();
    try {
      active.runtime.close();
    } catch {
      /* ignore */
    }
  }
}
