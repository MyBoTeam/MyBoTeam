import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { AccountEntry, TokenData } from './gws-types.js';

export function loadManifest(): AccountEntry[] {
  const manifestPath = process.env.GWS_ACCOUNTS_MANIFEST;
  if (!manifestPath) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as AccountEntry[];
  } catch {
    return [];
  }
}

export function resolveAccount(
  accounts: AccountEntry[],
  accountParam: string | undefined,
): { entry: AccountEntry; error?: undefined } | { entry?: undefined; error: string } {
  if (accounts.length === 0) {
    return {
      error: 'No Google accounts configured. Please connect an account in Settings → Integrations.',
    };
  }

  if (accountParam) {
    const needle = accountParam.toLowerCase();
    const match = accounts.find(
      (a) => a.label.toLowerCase() === needle || a.email.toLowerCase() === needle,
    );
    if (!match) {
      const available = accounts.map((a) => `${a.label} (${a.email})`).join(', ');
      return { error: `Account not found: "${accountParam}". Available: ${available}` };
    }
    return { entry: match };
  }

  if (accounts.length === 1) {
    return { entry: accounts[0] };
  }

  const available = accounts.map((a) => `${a.label} (${a.email})`).join(', ');
  return {
    error: `Multiple accounts connected. Specify which account to use with the 'account' parameter. Available: ${available}`,
  };
}

export function readToken(entry: AccountEntry): string {
  const data = JSON.parse(fs.readFileSync(entry.tokenFilePath, 'utf-8')) as TokenData;
  return data.accessToken;
}

function resolveGwsBin(): string | null {
  try {
    const require = createRequire(import.meta.url);
    const pkgJsonPath = require.resolve('@googleworkspace/cli/package.json');
    const pkgDir = path.dirname(pkgJsonPath);

    if (process.platform === 'win32') {
      const nativeBin = path.join(pkgDir, 'node_modules', '.bin_real', 'gws.exe');
      if (fs.existsSync(nativeBin)) {
        return nativeBin;
      }
      return null;
    }

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as {
      bin?: string | Record<string, string>;
    };
    const binEntry: string | undefined =
      typeof pkgJson.bin === 'string' ? pkgJson.bin : pkgJson.bin?.gws;
    if (!binEntry) {
      return null;
    }
    return path.resolve(pkgDir, binEntry);
  } catch {
    return null;
  }
}

export const GWS_BIN = resolveGwsBin();

export function tokenizeCommand(command: string): string[] {
  const args: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (ch === '\\' && !inSingle && i + 1 < command.length) {
      current += command[i + 1];
      i++;
    } else if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === ' ' && !inSingle && !inDouble) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) {
    args.push(current);
  }
  return args;
}

export function runGws(
  command: string,
  token: string,
): Promise<{ stdout: string; stderr: string }> {
  if (!GWS_BIN) {
    return Promise.reject(
      new Error(
        '@googleworkspace/cli is not installed. ' +
          'Google Docs, Sheets, and Slides require this package.',
      ),
    );
  }

  const args = [...tokenizeCommand(command), '--format', 'json'];

  return new Promise((resolve, reject) => {
    execFile(
      GWS_BIN,
      args,
      {
        env: { ...process.env, GOOGLE_WORKSPACE_CLI_TOKEN: token },
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
      },
      (error, stdout, stderr) => {
        if (error) {
          let apiError: string | null = null;
          if (stdout) {
            try {
              const parsed = JSON.parse(stdout.trim()) as {
                error?: { message?: string; code?: number };
              };
              if (parsed?.error?.message) {
                apiError = `${parsed.error.message} (HTTP ${parsed.error.code ?? '?'})`;
              }
            } catch {}
          }
          reject(new Error(apiError || stderr || error.message, { cause: error }));
        } else {
          resolve({ stdout, stderr });
        }
      },
    );
  });
}
