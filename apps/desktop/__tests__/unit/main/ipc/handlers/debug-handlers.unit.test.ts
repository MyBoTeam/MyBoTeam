import { describe, expect, it, vi } from 'vitest';

const mockRegisterLogHandlers = vi.hoisted(() => vi.fn());
const mockRegisterCaptureHandlers = vi.hoisted(() => vi.fn());
const mockRegisterBugReportHandlers = vi.hoisted(() => vi.fn());

vi.mock('@main/ipc/handlers/bug-report-handlers', () => ({
  registerBugReportHandlers: mockRegisterBugReportHandlers,
}));

vi.mock('@main/ipc/handlers/capture-handlers', () => ({
  registerCaptureHandlers: mockRegisterCaptureHandlers,
}));

vi.mock('@main/ipc/handlers/log-handlers', () => ({
  registerLogHandlers: mockRegisterLogHandlers,
}));

import { registerDebugHandlers } from '@main/ipc/handlers/debug-handlers';

describe('debug-handlers', () => {
  it('should register all sub-handlers', () => {
    registerDebugHandlers();
    expect(mockRegisterLogHandlers).toHaveBeenCalled();
    expect(mockRegisterCaptureHandlers).toHaveBeenCalled();
    expect(mockRegisterBugReportHandlers).toHaveBeenCalled();
  });
});
