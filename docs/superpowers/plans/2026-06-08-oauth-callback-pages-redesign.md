# OAuth Callback Pages Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all OAuth callback pages with the robot mascot, theme/locale support, auto-close, and proper styling.

**Architecture:** Add a `settingsProvider` option to `createOAuthCallbackServer` so the HTML is rendered with the user's theme (dark/light) and locale at request time. The robot image is served as a static file from the callback server. Locale strings are read from the existing web locale JSON files.

**Tech Stack:** Node.js HTTP (desktop main process), Electron, i18next locale JSON files

---

### Task 1: Add callback locale strings

**Files:**
- Modify: `apps/web/locales/en/common.json`
- Modify: `apps/web/locales/fr/common.json`
- Modify: `apps/web/locales/ru/common.json`
- Modify: `apps/web/locales/zh-CN/common.json`

- [ ] **Step 1: Add callback section to English locale**

Add to `apps/web/locales/en/common.json` (inside the root JSON object):

```json
  "callback": {
    "successTitle": "Authentication successful",
    "successMessage": "You can close this tab",
    "errorTitle": "Authentication failed",
    "errorMessage": "Missing code or state parameter"
  }
```

- [ ] **Step 2: Add callback section to French locale**

Add to `apps/web/locales/fr/common.json`:

```json
  "callback": {
    "successTitle": "Authentification réussie",
    "successMessage": "Vous pouvez fermer cet onglet",
    "errorTitle": "Authentification échouée",
    "errorMessage": "Code ou paramètre d'état manquant"
  }
```

- [ ] **Step 3: Add callback section to Russian locale**

Add to `apps/web/locales/ru/common.json`:

```json
  "callback": {
    "successTitle": "Аутентификация успешна",
    "successMessage": "Вы можете закрыть эту вкладку",
    "errorTitle": "Ошибка аутентификации",
    "errorMessage": "Отсутствует код или параметр состояния"
  }
```

- [ ] **Step 4: Add callback section to Chinese locale**

Add to `apps/web/locales/zh-CN/common.json`:

```json
  "callback": {
    "successTitle": "身份验证成功",
    "successMessage": "您可以关闭此标签页",
    "errorTitle": "身份验证失败",
    "errorMessage": "缺少代码或状态参数"
  }
```

- [ ] **Step 5: Verify locale files are valid JSON**

```bash
pnpm -F @myboteam/web test
```

---

### Task 2: Refactor the callback server with themed HTML rendering

**Files:**
- Modify: `apps/desktop/src/main/oauth-callback-server.ts`

- [ ] **Step 1: Add locale reading helper**

Add a function that reads locale strings from the web locale files:

```typescript
import fs from 'node:fs';
import path from 'node:path';

interface LocaleStrings {
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorMessage: string;
}

const DEFAULT_LOCALE: LocaleStrings = {
  successTitle: 'Authentication successful',
  successMessage: 'You can close this tab',
  errorTitle: 'Authentication failed',
  errorMessage: 'Missing code or state parameter',
};

const LOCALE_CACHE = new Map<string, LocaleStrings>();

function readLocaleStrings(language: string): LocaleStrings {
  if (LOCALE_CACHE.has(language)) {
    return LOCALE_CACHE.get(language)!;
  }

  try {
    const baseDir = path.resolve(__dirname, '../../../../apps/web/locales');
    const filePath = path.join(baseDir, language, 'common.json');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const strings = content?.callback as LocaleStrings | undefined;
    if (strings?.successTitle && strings?.errorTitle) {
      LOCALE_CACHE.set(language, strings);
      return strings;
    }
  } catch {
    // fall through to default
  }

  return DEFAULT_LOCALE;
}
```

- [ ] **Step 2: Add theme/app settings types**

Add to `OAuthCallbackServerOptions`:

```typescript
export interface CallbackSettings {
  theme: 'light' | 'dark';
  themeColor: string;
  language: string;
}
```

Update `OAuthCallbackServerOptions`:

```typescript
export interface OAuthCallbackServerOptions {
  host?: string;
  port?: number;
  callbackPath?: string;
  timeoutMs?: number;
  settingsProvider?: () => Promise<CallbackSettings>;
}
```

- [ ] **Step 3: Add HTML template generation functions**

Add functions that generate the full HTML page with theme support, robot image, and locale strings:

```typescript
function buildHtml(params: {
  title: string;
  message: string;
  isError: boolean;
  isDark: boolean;
  themeColor: string;
  autoClose?: boolean;
}): string {
  const themeClass = params.isDark ? 'dark' : 'light';
  const colorClass = `theme-${params.themeColor}`;
  const bgColor = params.isDark ? '#1a1a2e' : '#ffffff';
  const textColor = params.isDark ? '#e0e0e0' : '#1a1a2e';
  const titleColor = params.isError ? '#ef4444' : textColor;

  const autoCloseScript = params.autoClose
    ? `<script>
setTimeout(() => {
  if (window.close) {
    try { window.close(); } catch {}
  }
  document.getElementById('fallback-message')?.classList.remove('hidden');
}, 7000);
</script>`
    : '';

  return `<!DOCTYPE html>
<html class="${themeClass} ${colorClass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${params.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "KMR Apparat", "Geist", ui-sans-serif, system-ui, sans-serif;
    background: ${bgColor};
    color: ${textColor};
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
  }
  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 40px;
    padding: 40px;
    max-width: 700px;
  }
  .robot img {
    width: 200px;
    height: auto;
  }
  .text { text-align: left; }
  .title {
    font-size: 28px;
    font-weight: 600;
    color: ${titleColor};
    margin-bottom: 12px;
  }
  .message {
    font-size: 16px;
    line-height: 1.5;
  }
  .hidden { display: none; }
  .fallback {
    margin-top: 16px;
    font-size: 14px;
    opacity: 0.7;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a2e; color: #e0e0e0; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="robot">
    <img src="/robot.png" alt="MyBoTeam Robot" />
  </div>
  <div class="text">
    <div class="title">${params.title}</div>
    <div class="message">${params.message}</div>
    <div id="fallback-message" class="fallback hidden">${params.autoClose ? params.message : ''}</div>
  </div>
</div>
${autoCloseScript}
</body>
</html>`;
}
```

- [ ] **Step 4: Add robot image serving and settings fetching to the HTTP handler**

Update the `http.createServer` callback to:

1. Handle `GET /robot.png` by serving the file from `apps/desktop/assets/robot-callback.png`
2. For callback requests, call `settingsProvider` if provided, then render themed HTML

```typescript
const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end();
    return;
  }

  // Serve robot image
  if (req.url === '/robot.png') {
    const imagePath = path.resolve(__dirname, '../../assets/robot-callback.png');
    try {
      const image = fs.readFileSync(imagePath);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' });
      res.end(image);
    } catch {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  if (!req.url.startsWith(callbackPath)) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Fetch settings from daemon (fire and wait)
  let settings: CallbackSettings = { theme: 'light', themeColor: 'neutral', language: 'en' };
  if (options.settingsProvider) {
    try {
      settings = await options.settingsProvider();
    } catch {
      // use defaults
    }
  }

  const isDark = settings.theme === 'dark';

  if (error) {
    const message = errorDescription ?? error;
    const html = buildHtml({
      title: readLocaleStrings(settings.language).errorTitle,
      message,
      isError: true,
      isDark,
      themeColor: settings.themeColor,
    });
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(html, () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        closeServer(server);
        rejectCallback(new Error(message));
      }
    });
    return;
  }

  if (!code || !state) {
    const html = buildHtml({
      title: readLocaleStrings(settings.language).errorTitle,
      message: readLocaleStrings(settings.language).errorMessage,
      isError: true,
      isDark,
      themeColor: settings.themeColor,
    });
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  const html = buildHtml({
    title: readLocaleStrings(settings.language).successTitle,
    message: readLocaleStrings(settings.language).successMessage,
    isError: false,
    isDark,
    themeColor: settings.themeColor,
    autoClose: true,
  });
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html, () => {
    if (!settled) {
      settled = true;
      clearTimeout(timeout);
      closeServer(server);
      resolveCallback({ code, state, redirectUri });
    }
  });
});
```

- [ ] **Step 5: Remove old inline HTML constants**

Delete the old `SUCCESS_HTML`, `ERROR_HTML`, and `renderErrorHtml` — they're replaced by the `buildHtml` function.

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

Expected: No type errors.

---

### Task 3: Update MCP OAuth strategies caller

**Files:**
- Modify: `apps/desktop/src/main/connectors/mcp-oauth-strategies.ts`

- [ ] **Step 1: Add settingsProvider to mcp-oauth-strategies.ts**

Import the daemon client and pass `settingsProvider` when calling `createOAuthCallbackServer`:

```typescript
import { getDaemonClient } from '../../daemon-client';

const callbackServer = await createOAuthCallbackServer({
  host: oauth.store.callback.host,
  port: oauth.store.callback.port,
  callbackPath: oauth.store.callback.path,
  settingsProvider: async () => {
    const snap = await getDaemonClient().call('settings.getAll');
    return {
      theme: snap.app.theme === 'dark' ? 'dark' : 'light',
      themeColor: snap.app.themeColor ?? 'neutral',
      language: snap.app.language ?? 'en',
    };
  },
});
```

Note: Verify `getDaemonClient` import path in the codebase — it may be `../ipc/handlers/settings-handlers` or `../daemon-client` depending on where the function is exposed.

---

### Task 4: Update MCP OAuth fixed client caller

**Files:**
- Modify: `apps/desktop/src/main/connectors/mcp-oauth-fixed-client.ts`

- [ ] **Step 1: Add settingsProvider to mcp-oauth-fixed-client.ts**

Same pattern as Task 3 — import `getDaemonClient` and pass `settingsProvider` option.

---

### Task 5: Update Slack auth caller

**Files:**
- Modify: `apps/desktop/src/main/opencode/slack-auth/index.ts`

- [ ] **Step 1: Add settingsProvider to Slack auth**

Same pattern — pass `settingsProvider` when creating the callback server.

---

### Task 6: Update unit tests

**Files:**
- Modify: `apps/desktop/__tests__/unit/main/oauth-callback-server.unit.test.ts`

- [ ] **Step 1: Update existing tests for new HTML output**

Update the existing tests to:
1. Verify the HTML contains the robot image reference (`/robot.png`)
2. Verify the HTML contains locale strings
3. Test that `settingsProvider` is called and affects the output
4. Test fallback to defaults when `settingsProvider` is not provided

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createOAuthCallbackServer } from '@main/oauth-callback-server';

describe('createOAuthCallbackServer', () => {
  it('should return 200 with themed HTML on successful callback', async () => {
    const settingsProvider = vi.fn().mockResolvedValue({
      theme: 'light',
      themeColor: 'mint',
      language: 'en',
    });
    const s = await createOAuthCallbackServer({ settingsProvider });

    const url = new URL(s.redirectUri);
    url.searchParams.set('code', 'authcode123');
    url.searchParams.set('state', 'state456');

    const res = await fetch(url.toString());
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('/robot.png');
    expect(html).toContain('Authentication successful');
    expect(html).toContain('light');
    expect(html).toContain('theme-mint');
    expect(html).toContain('7000'); // auto-close timeout

    await s.waitForCallback();
    expect(settingsProvider).toHaveBeenCalledTimes(1);
    s.shutdown();
  });

  it('should use default locale when settingsProvider returns unknown language', async () => {
    const settingsProvider = vi.fn().mockResolvedValue({
      theme: 'dark',
      themeColor: 'neutral',
      language: 'xx',
    });
    const s = await createOAuthCallbackServer({ settingsProvider });

    const url = new URL(s.redirectUri);
    url.searchParams.set('code', 'authcode123');
    url.searchParams.set('state', 'state456');

    const res = await fetch(url.toString());
    const html = await res.text();
    expect(html).toContain('Authentication successful'); // English default fallback

    await s.waitForCallback();
    s.shutdown();
  });

  it('should return 400 with error HTML when error param is present', async () => {
    const s = await createOAuthCallbackServer();

    const url = new URL(s.redirectUri);
    url.searchParams.set('error', 'access_denied');
    url.searchParams.set('error_description', 'User denied access');

    const res = await fetch(url.toString());
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain('/robot.png');
    expect(html).toContain('User denied access');
    s.shutdown();
  });

  it('should render error in red for error pages', async () => {
    const s = await createOAuthCallbackServer();

    const url = new URL(s.redirectUri);
    url.searchParams.set('error', 'access_denied');

    const res = await fetch(url.toString());
    const html = await res.text();
    expect(html).toContain('#ef4444'); // red color for errors
    expect(html).not.toContain('7000'); // no auto-close on error
    s.shutdown();
  });

  it('should use default theme when settingsProvider throws', async () => {
    const settingsProvider = vi.fn().mockRejectedValue(new Error('Daemon unreachable'));
    const s = await createOAuthCallbackServer({ settingsProvider });

    const url = new URL(s.redirectUri);
    url.searchParams.set('code', 'authcode123');
    url.searchParams.set('state', 'state456');

    const res = await fetch(url.toString());
    const html = await res.text();
    expect(html).toContain('light'); // default fallback theme
    expect(html).toContain('Authentication successful');

    await s.waitForCallback();
    s.shutdown();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm -F @myboteam/desktop test
```

Expected: All tests pass.

---

### Task 7: Ensure web app tests still pass

- [ ] **Step 1: Run web tests**

```bash
pnpm -F @myboteam/web test
```

Expected: No tests affected (we only added locale strings to JSON files — web i18n should pick them up automatically).

---

### Task 8: Final verification

- [ ] **Step 1: Run typecheck across all packages**

```bash
pnpm typecheck
```

Expected: No type errors.

- [ ] **Step 2: Run full check**

```bash
pnpm check
```

Expected: No lint or type errors.
