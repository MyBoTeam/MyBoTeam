import { spawnSync } from 'node:child_process';

const WINDOWS_OPENCODE_X64_PACKAGE = 'opencode-windows-x64';
const WINDOWS_OPENCODE_X64_BASELINE_PACKAGE = 'opencode-windows-x64-baseline';
const LINUX_OPENCODE_X64_PACKAGE = 'opencode-linux-x64';
const LINUX_OPENCODE_X64_BASELINE_PACKAGE = 'opencode-linux-x64-baseline';
const LINUX_OPENCODE_X64_MUSL_PACKAGE = 'opencode-linux-x64-musl';
const LINUX_OPENCODE_X64_BASELINE_MUSL_PACKAGE = 'opencode-linux-x64-baseline-musl';
const LINUX_OPENCODE_ARM64_PACKAGE = 'opencode-linux-arm64';
const LINUX_OPENCODE_ARM64_MUSL_PACKAGE = 'opencode-linux-arm64-musl';

let cachedWindowsPackageNames: string[] | null = null;

function detectWindowsAvx2Support(): boolean {
  const checkCommand =
    '(Add-Type -MemberDefinition "[DllImport(""kernel32.dll"")] public static extern bool IsProcessorFeaturePresent(int ProcessorFeature);" -Name Kernel32 -Namespace Win32 -PassThru)::IsProcessorFeaturePresent(40)';

  for (const shell of ['powershell.exe', 'pwsh.exe', 'pwsh', 'powershell']) {
    try {
      const result = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', checkCommand], {
        encoding: 'utf-8',
        timeout: 3000,
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      });
      if (result.status !== 0) {
        continue;
      }

      const output = (result.stdout ?? '').trim().toLowerCase();
      if (output === 'true' || output === '1') {
        return true;
      }
      if (output === 'false' || output === '0') {
        return false;
      }
    } catch {}
  }

  return false;
}

export function getWindowsPackageNames(): string[] {
  if (cachedWindowsPackageNames) {
    return cachedWindowsPackageNames;
  }

  const preferAvx2Binary = detectWindowsAvx2Support();
  cachedWindowsPackageNames = preferAvx2Binary
    ? [WINDOWS_OPENCODE_X64_PACKAGE, WINDOWS_OPENCODE_X64_BASELINE_PACKAGE]
    : [WINDOWS_OPENCODE_X64_BASELINE_PACKAGE, WINDOWS_OPENCODE_X64_PACKAGE];

  return cachedWindowsPackageNames;
}

export function getLinuxPackageNames(): string[] {
  if (process.arch === 'arm64') {
    return [LINUX_OPENCODE_ARM64_PACKAGE, LINUX_OPENCODE_ARM64_MUSL_PACKAGE];
  }
  return [
    LINUX_OPENCODE_X64_PACKAGE,
    LINUX_OPENCODE_X64_BASELINE_PACKAGE,
    LINUX_OPENCODE_X64_MUSL_PACKAGE,
    LINUX_OPENCODE_X64_BASELINE_MUSL_PACKAGE,
  ];
}

export function getOpenCodePlatformInfo(): { packageNames: string[]; binaryName: string } {
  if (process.platform === 'win32') {
    return { packageNames: getWindowsPackageNames(), binaryName: 'opencode.exe' };
  }
  if (process.platform === 'linux') {
    return { packageNames: getLinuxPackageNames(), binaryName: 'opencode' };
  }
  return { packageNames: ['opencode-ai'], binaryName: 'opencode' };
}
