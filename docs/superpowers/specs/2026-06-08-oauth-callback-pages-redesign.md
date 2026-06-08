# Redesign OAuth Callback Pages

**Date:** 2026-06-08
**Issue:** [MAO-122](https://linear.app/maor-innovations-ltd/issue/MAO-122/redesign-all-oauth-callback-pages-with-logos-and-auto-close)
**Status:** Approved ✓

## Motivation

OAuth callback pages are minimal inline HTML strings served by the desktop main process's raw HTTP server. They lack branding, theming, locale support, the robot mascot, and auto-close behavior, creating a jarring authentication experience.

## Current State

The callback server lives in `apps/desktop/src/main/oauth-callback-server.ts` and serves two hardcoded HTML strings:

- **Success:** `<h1>Authentication successful</h1><p>You can close this tab.</p>` — plain system-ui font, no branding
- **Error:** `<h1>Authentication failed</h1><p>Missing code or state parameter.</p>` — same minimal styling

Callers: `mcp-oauth-strategies.ts`, `mcp-oauth-fixed-client.ts`, `slack-auth/index.ts`.

## Approach

### Architecture

The `createOAuthCallbackServer` function accepts a new optional `settingsProvider` option:

```typescript
interface OAuthCallbackServerOptions {
  host?: string;
  port?: number;
  callbackPath?: string;
  timeoutMs?: number;
  settingsProvider?: () => Promise<AppSettings>;
}
```

Each caller injects `settingsProvider` pointing to `getDaemonClient().call('settings.getAll')`. When a callback request arrives:

1. The handler calls `settingsProvider()` to fetch theme + language settings
2. Applies `dark`/`light` class and color theme class to `<html>`
3. Reads the appropriate locale file from disk using the stored language
4. Renders the full HTML page (success or error)
5. Falls back to light theme + English if the fetch fails

### Locale Strings

Add a `callback` section to `apps/web/locales/*/common.json` for each locale (en, fr, ru, zh-CN):

```json
{
  "callback": {
    "successTitle": "Authentication successful",
    "successMessage": "You can close this tab",
    "errorTitle": "Authentication failed",
    "errorMessage": "Missing code or state parameter"
  }
}
```

The server reads the locale JSON file directly from disk, resolves the correct language file based on the stored `language` setting, and falls back to `en`.

### Robot Image

- Static PNG placed at `apps/desktop/assets/robot-callback.png`
- Served by the callback server on a dedicated route (e.g., `GET /robot.png`)
- Referenced in HTML as `<img src="/robot.png">` since the callback server owns the route
- Appears on both success and error pages

### HTML Layout

Full viewport (`100vh`), content centered both axes:

```
┌──────────────────────────────────┐
│                                  │
│       ┌──────┐  ┌─────────┐      │
│       │      │  │  Title   │      │
│       │ Robot│  │  Message │      │
│       │      │  │          │      │
│       └──────┘  └─────────┘      │
│                                  │
└──────────────────────────────────┘
```

- Flex row container, `align-items: center`, `justify-content: center`
- Robot image on the left, text block on the right
- Title font: `"KMR Apparat", "Geist", ui-sans-serif, system-ui, sans-serif`
- Error pages: title and message text in red

### Theme Application

CSS classes applied to `<html>` element based on daemon settings:

- **Theme:** `dark` or `light` class
- **Color theme:** `theme-mint`, `theme-blue`, `theme-lemon`, `theme-peach`, `theme-lavender`, or `theme-neutral`
- Inline CSS variables for background colors so dark mode shows a dark background and light mode shows a light background
- Error text is always red regardless of theme

### Auto-Close (Success Only)

- Page displays success message
- After **7 seconds**, calls `window.close()`
- If `window.close()` is blocked by the browser, a fallback message appears: "You can close this tab"
- No auto-close on error pages — user reads the error and dismisses manually

### Files Modified

| File | Change |
|---|---|
| `apps/desktop/src/main/oauth-callback-server.ts` | Accept `settingsProvider` option; render themed HTML with robot image and locale strings; auto-close logic; serve robot asset |
| `apps/desktop/src/main/connectors/mcp-oauth-strategies.ts` | Pass `settingsProvider` fetching from daemon |
| `apps/desktop/src/main/connectors/mcp-oauth-fixed-client.ts` | Pass `settingsProvider` fetching from daemon |
| `apps/desktop/src/main/opencode/slack-auth/index.ts` | Pass `settingsProvider` fetching from daemon |
| `apps/web/locales/en/common.json` | Add `callback` section |
| `apps/web/locales/fr/common.json` | Add `callback` section |
| `apps/web/locales/ru/common.json` | Add `callback` section |
| `apps/web/locales/zh-CN/common.json` | Add `callback` section |

### Files Added

| File | Purpose |
|---|---|
| `apps/desktop/assets/robot-callback.png` | Static robot image for callback pages |

### Testing

- Unit tests for `oauth-callback-server.ts` already exist; update them to cover:
  - Settings provider is called and affects rendered HTML
  - Theme/locale classes applied correctly
  - Error rendering with custom messages
  - Auto-close script presence
  - Fallback behavior when settings provider fails
- Manual verification: run an OAuth flow end-to-end and confirm:
  - Robot image appears
  - Page respects current theme (light/dark)
  - Locale strings match app's language setting
  - Auto-close fires after 7 seconds (or fallback shows)
