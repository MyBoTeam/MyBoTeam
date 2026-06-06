// Debug handlers are split into focused sub-modules for maintainability.
// Each module registers a related set of IPC handlers.

import { registerBugReportHandlers } from './bug-report-handlers';
import { registerCaptureHandlers } from './capture-handlers';
import { registerLogHandlers } from './log-handlers';

export function registerDebugHandlers(): void {
  registerLogHandlers();
  registerCaptureHandlers();
  registerBugReportHandlers();
}
