import { execFileSync, execSync } from 'node:child_process';

export async function withPreservedForeground<T>(operation: () => Promise<T>): Promise<T> {
  if (process.platform !== 'darwin') {
    return operation();
  }

  let frontmostApp: string | null = null;
  try {
    frontmostApp = execSync(
      `osascript -e 'tell application "System Events" to get name of first process whose frontmost is true'`,
      { encoding: 'utf8', timeout: 2000 },
    ).trim();
  } catch {}

  try {
    return await operation();
  } finally {
    if (frontmostApp) {
      try {
        execFileSync('osascript', ['-e', `tell application "${frontmostApp}" to activate`], {
          encoding: 'utf8',
          timeout: 2000,
        });
      } catch {}
    }
  }
}
