import path from 'node:path';

export const GH_BINARY_CANDIDATES: readonly string[] = [
  'gh',
  '/opt/homebrew/bin/gh',
  '/usr/local/bin/gh',
  '/usr/bin/gh',
  '/home/linuxbrew/.linuxbrew/bin/gh',
  'C:\\Program Files\\GitHub CLI\\gh.exe',
  'C:\\Program Files (x86)\\GitHub CLI\\gh.exe',
];

export function buildGhAugmentedPath(): string {
  const base = process.env.PATH ?? process.env.Path ?? '';
  const extra =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\GitHub CLI',
          'C:\\Program Files (x86)\\GitHub CLI',
          'C:\\Program Files\\Git\\bin',
        ]
      : ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'];
  return [base, ...extra].join(path.delimiter);
}

const connectedProviders = new Set<string>();

export function setDesktopConnectorConnected(providerId: string, connected: boolean): void {
  if (connected) {
    connectedProviders.add(providerId);
  } else {
    connectedProviders.delete(providerId);
  }
}

export function isDesktopConnectorConnected(providerId: string): boolean {
  return connectedProviders.has(providerId);
}
