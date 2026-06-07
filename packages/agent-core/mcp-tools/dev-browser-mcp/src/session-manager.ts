import type { Page } from 'playwright';
import { detectAuthPage } from './auth-detection.js';
import { backgroundPageWindow, focusPageWindow, getFullPageName } from './connection.js';
import type { ToolDebug } from './session-manager-types.js';

let toolDebug: ToolDebug | null = null;

export function getToolDebug(): ToolDebug | null {
  return toolDebug;
}

export async function loadToolDebug(): Promise<void> {
  const debugPath = process.env.MYBOTEAM_TOOL_DEBUG_PATH;
  if (debugPath) {
    console.error(`[dev-browser-mcp] Loading tool debug from: ${debugPath}`);
    try {
      toolDebug = await import(debugPath);
      console.error('[dev-browser-mcp] Tool debug loaded successfully');
    } catch (err) {
      console.error('[dev-browser-mcp] Failed to load tool debug:', err);
    }
  } else {
    console.error('[dev-browser-mcp] MYBOTEAM_TOOL_DEBUG_PATH not set, tool debug disabled');
  }
}

const interactionModePages = new Set<string>();

export async function checkInteractionMode(page: Page, pageName?: string): Promise<void> {
  try {
    const url = page.url();
    const title = await page.title().catch(() => '');
    const detection = detectAuthPage({ url, title });
    const fullName = getFullPageName(pageName);

    if (detection.isAuthPage && !interactionModePages.has(fullName)) {
      interactionModePages.add(fullName);
      await focusPageWindow(pageName);
    } else if (!detection.isAuthPage && interactionModePages.has(fullName)) {
      interactionModePages.delete(fullName);
      await backgroundPageWindow(pageName);
    }
  } catch {
    // best-effort — window management must never break the tool call
  }
}

export {
  activePageOverride,
  ensureConnected,
  getPage,
  injectActiveTabGlow,
  removeActiveTabGlow,
  setActivePageOverride,
} from './glow.js';
export { startScreencast, stopScreencast } from './session-manager-screencast.js';
