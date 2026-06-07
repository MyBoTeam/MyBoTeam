import type { Page } from 'playwright';
import {
  ensureConnected as ensureConnectedRaw,
  getConnectionMode,
  getFullPageName,
  getPage as getPageRaw,
} from './connection.js';

let glowingPage: Page | null = null;
const pagesWithGlowListeners = new WeakSet<Page>();
let glowInitialized = false;

export let activePageOverride: Page | null = null;

export function setActivePageOverride(page: Page | null): void {
  activePageOverride = page;
}

async function injectGlowElements(page: Page): Promise<void> {
  if (page.isClosed()) return;
  try {
    await page.evaluate(() => {
      document.getElementById('__dev-browser-active-glow')?.remove();
      document.getElementById('__dev-browser-active-glow-style')?.remove();
      const style = document.createElement('style');
      style.id = '__dev-browser-active-glow-style';
      style.textContent = `
        @keyframes devBrowserGlowColor {
          0%, 100% { border-color: rgba(59, 130, 246, 0.9); box-shadow: inset 0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 60px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4); }
          25% { border-color: rgba(168, 85, 247, 0.9); box-shadow: inset 0 0 30px rgba(168, 85, 247, 0.6), inset 0 0 60px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { border-color: rgba(236, 72, 153, 0.9); box-shadow: inset 0 0 30px rgba(236, 72, 153, 0.6), inset 0 0 60px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.4); }
          75% { border-color: rgba(34, 211, 238, 0.9); box-shadow: inset 0 0 30px rgba(34, 211, 238, 0.6), inset 0 0 60px rgba(34, 211, 238, 0.3), 0 0 20px rgba(34, 211, 238, 0.4); }
        }
      `;
      document.head.appendChild(style);
      const overlay = document.createElement('div');
      overlay.id = '__dev-browser-active-glow';
      overlay.style.cssText =
        'position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; border: 5px solid rgba(59, 130, 246, 0.9); border-radius: 4px; box-shadow: inset 0 0 30px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4); animation: devBrowserGlowColor 6s ease-in-out infinite;';
      document.body.appendChild(overlay);
    });
  } catch {}
}

export async function injectActiveTabGlow(page: Page): Promise<void> {
  if (glowingPage && glowingPage !== page && !glowingPage.isClosed()) {
    await removeActiveTabGlow(glowingPage);
  }
  glowingPage = page;
  await injectGlowElements(page);
  if (!pagesWithGlowListeners.has(page)) {
    pagesWithGlowListeners.add(page);
    page.on('load', async () => {
      if (glowingPage === page && !page.isClosed()) {
        await injectGlowElements(page);
      }
    });
  }
}

export async function removeActiveTabGlow(page: Page): Promise<void> {
  if (page.isClosed()) {
    if (glowingPage === page) glowingPage = null;
    return;
  }
  try {
    await page.evaluate(() => {
      document.getElementById('__dev-browser-active-glow')?.remove();
      document.getElementById('__dev-browser-active-glow-style')?.remove();
    });
  } catch {}
  if (glowingPage === page) glowingPage = null;
}

export async function ensureConnected() {
  const b = await ensureConnectedRaw();

  if (!glowInitialized && getConnectionMode() === 'builtin') {
    glowInitialized = true;
    for (const context of b.contexts()) {
      context.on('page', async (page) => {
        setTimeout(async () => {
          try {
            if (!page.isClosed()) {
              await injectActiveTabGlow(page);
            }
          } catch {}
        }, 100);
      });

      for (const page of context.pages()) {
        if (!page.isClosed() && !glowingPage) {
          try {
            await injectActiveTabGlow(page);
          } catch {}
        }
      }
    }
  }

  return b;
}

export async function getPage(pageName?: string): Promise<Page> {
  if (activePageOverride) {
    if (!activePageOverride.isClosed()) {
      return activePageOverride;
    }
    activePageOverride = null;
  }
  return getPageRaw(pageName);
}
