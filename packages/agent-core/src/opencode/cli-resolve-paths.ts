import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedCliPaths } from '../types.js';
import { createConsoleLogger } from '../utils/logging.js';

const log = createConsoleLogger({ prefix: 'CLIResolver' });

export const OPENCODE_LAUNCHER_PACKAGE = 'opencode-ai';

export function getCandidateAppRoots(appPath?: string): string[] {
  const roots: string[] = [];

  if (process.env.APP_ROOT) {
    roots.push(path.resolve(process.env.APP_ROOT));
  }

  if (appPath) {
    const resolvedAppPath = path.resolve(appPath);
    roots.push(resolvedAppPath);
    roots.push(path.resolve(resolvedAppPath, '..'));
    roots.push(path.resolve(resolvedAppPath, '..', '..'));
  }

  return [...new Set(roots)];
}

export function resolveWindowsCliFromLauncher(
  nodeModulesRoot: string,
  packageNames: string[],
): ResolvedCliPaths | null {
  const launcherPackagePath = path.join(nodeModulesRoot, OPENCODE_LAUNCHER_PACKAGE);
  if (!fs.existsSync(launcherPackagePath)) {
    return null;
  }

  const candidateModuleRoots = new Set<string>([nodeModulesRoot]);
  try {
    const realLauncherPackagePath = fs.realpathSync(launcherPackagePath);
    candidateModuleRoots.add(path.dirname(realLauncherPackagePath));
  } catch {
    // Ignore realpath failures and continue with known roots.
  }

  for (const moduleRoot of candidateModuleRoots) {
    for (const packageName of packageNames) {
      const cliPath = path.join(moduleRoot, packageName, 'bin', 'opencode.exe');
      if (fs.existsSync(cliPath)) {
        log.info(`[CLI Resolver] Using OpenCode CLI executable via launcher package: ${cliPath}`);
        return {
          cliPath,
          cliDir: path.dirname(cliPath),
          source: 'local',
        };
      }
    }
  }

  return null;
}
