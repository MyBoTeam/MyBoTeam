import { createConsoleLogger } from '../utils/logging.js';

const log = createConsoleLogger({ prefix: 'Browser' });

export async function isDevBrowserServerReady(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`http://localhost:${port}`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function waitForDevBrowserServer(
  port: number,
  maxWaitMs = 15000,
  pollIntervalMs = 500,
): Promise<boolean> {
  const startTime = Date.now();
  let attempts = 0;
  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    if (await isDevBrowserServerReady(port)) {
      log.info(
        `[Browser] Dev-browser server ready after ${attempts} attempts (${Date.now() - startTime}ms)`,
      );
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  log.info(
    `[Browser] Dev-browser server not ready after ${attempts} attempts (${maxWaitMs}ms timeout)`,
  );
  return false;
}
