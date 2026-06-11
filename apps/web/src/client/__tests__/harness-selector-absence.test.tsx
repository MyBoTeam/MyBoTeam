import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB_SRC_ROOT = join(process.cwd(), 'src/client');

describe('harness selector absence', () => {
  it('does not expose a normal user-facing harness selector or deprecation warning copy', () => {
    const sourceFiles = [
      'layouts/main/App.tsx',
      'pages/conversation/ExecutionPage.tsx',
      'pages/conversations/HistoryPage.tsx',
      'stores/taskStore.ts',
    ];

    const combinedSource = sourceFiles
      .map((file) => readFileSync(join(WEB_SRC_ROOT, file), 'utf8'))
      .join('\n');

    expect(combinedSource).not.toMatch(/harness selector/i);
    expect(combinedSource).not.toMatch(/select.*harness/i);
    expect(combinedSource).not.toMatch(/opencode.*pi/i);
    expect(combinedSource).not.toMatch(/deprecated.*harness/i);
  });
});
