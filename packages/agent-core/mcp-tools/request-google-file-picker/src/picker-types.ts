import fs from 'node:fs';

export const GOOGLE_FILE_PICKER_MARKER = '__MYBOTEAM_GOOGLE_FILE_PICKER__';

export interface AccountEntry {
  googleAccountId: string;
  label: string;
  email: string;
  tokenFilePath: string;
}

export interface TokenData {
  accessToken: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

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
    error: `Multiple accounts connected. Specify which account with the 'account' parameter. Available: ${available}`,
  };
}

export function readAccessToken(entry: AccountEntry): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(entry.tokenFilePath, 'utf-8')) as TokenData;
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function searchDriveFiles(query: string, accessToken: string): Promise<DriveFile[]> {
  const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const q = `name contains '${escapedQuery}' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,mimeType)',
    orderBy: 'modifiedTime desc',
    pageSize: '10',
  });

  const url = `https://www.googleapis.com/drive/v3/files?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

export function formatFileList(files: DriveFile[]): string {
  return files.map((f) => `- **${f.name}** (ID: \`${f.id}\`, type: ${f.mimeType})`).join('\n');
}

export function sanitizeMarkerValue(v: string): string {
  return v.replace(/[\r\n]/g, ' ');
}
