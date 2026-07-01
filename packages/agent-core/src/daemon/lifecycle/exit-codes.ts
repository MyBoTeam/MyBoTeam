/**
 * Exit codes for daemon lifecycle
 *
 * These exit codes are used for debugging and monitoring.
 * They follow the convention of using specific codes for different failure scenarios.
 */
export enum DaemonExitCode {
  /** Normal shutdown completed successfully */
  Success = 0,

  /** General/unspecified error */
  GeneralError = 1,

  /** Graceful shutdown timeout (30s) exceeded */
  TimeoutExceeded = 2,

  /** Task in critical state aborted during shutdown */
  TaskAborted = 3,

  /** Daemon failed to start (e.g., socket path conflict, port in use) */
  StartupFailed = 4,

  /** Daemon crashed unexpectedly */
  Crash = 5,
}

/**
 * Human-readable descriptions for exit codes
 */
export const EXIT_CODE_DESCRIPTIONS: Record<DaemonExitCode, string> = {
  [DaemonExitCode.Success]: 'Normal shutdown completed',
  [DaemonExitCode.GeneralError]: 'Unspecified error',
  [DaemonExitCode.TimeoutExceeded]: 'Graceful shutdown timeout (30s) exceeded',
  [DaemonExitCode.TaskAborted]: 'Task in critical state aborted during shutdown',
  [DaemonExitCode.StartupFailed]: 'Daemon failed to start (e.g., socket path conflict)',
  [DaemonExitCode.Crash]: 'Daemon crashed unexpectedly',
};

/**
 * Check if an exit code indicates a failure
 * @param code Exit code to check
 * @returns True if exit code indicates failure
 */
export function isFailureExitCode(code: number): boolean {
  return code !== DaemonExitCode.Success;
}

/**
 * Get human-readable description for an exit code
 * @param code Exit code
 * @returns Description string
 */
export function getExitCodeDescription(code: number): string {
  if (code in EXIT_CODE_DESCRIPTIONS) {
    return EXIT_CODE_DESCRIPTIONS[code as DaemonExitCode];
  }
  return `Unknown exit code: ${code}`;
}
