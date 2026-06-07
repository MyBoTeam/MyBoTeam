import type { Page } from 'playwright';

export async function cdpInsertText(page: Page, text: string): Promise<void> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Input.insertText', { text });
  } finally {
    await client.detach().catch(() => {});
  }
}
