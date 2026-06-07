import { registerBugReportHandlers } from './bug-report-handlers';
import { registerCaptureHandlers } from './capture-handlers';
import { registerLogHandlers } from './log-handlers';

export function registerDebugHandlers(): void {
  registerLogHandlers();
  registerCaptureHandlers();
  registerBugReportHandlers();
}
