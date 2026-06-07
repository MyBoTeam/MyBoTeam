import * as fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ScreenshotMetadata {
  testName: string;
  stateName: string;
  viewport: { width: number; height: number };
  route: string;
  timestamp: string;
  evaluationCriteria: string[];
}

export interface CaptureResult {
  success: boolean;
  path: string;
  error?: string;
}

export async function captureForAI(
  page: Page,
  testName: string,
  stateName: string,
  evaluationCriteria: string[],
): Promise<CaptureResult> {
  const timestamp = Date.now();
  const sanitizedTestName = sanitizeFilename(testName);
  const sanitizedStateName = sanitizeFilename(stateName);
  const filename = `${sanitizedTestName}-${sanitizedStateName}-${timestamp}.png`;
  const screenshotDir = join(__dirname, '../test-results/screenshots');
  const screenshotPath = join(screenshotDir, filename);

  try {
    await fs.mkdir(screenshotDir, { recursive: true });

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled',
    });

    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    const metadata: ScreenshotMetadata = {
      testName,
      stateName,
      viewport,
      route: page.url(),
      timestamp: new Date().toISOString(),
      evaluationCriteria,
    };

    await fs.writeFile(screenshotPath.replace('.png', '.json'), JSON.stringify(metadata, null, 2));

    return { success: true, path: screenshotPath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, path: '', error: errorMessage };
  }
}

function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
