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
        } catch {}
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
    } catch {}
  }
}
