import { vi } from 'vitest';

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({
    write: vi.fn(),
    logEnv: vi.fn(),
    flush: vi.fn(),
    getCurrentLogPath: vi.fn(() => '/mock/logs/app.log'),
    getLogDir: vi.fn(() => '/mock/logs'),
    initialize: vi.fn(),
    shutdown: vi.fn(),
  })),
  getLogFileWriter: vi.fn(() => ({
    write: vi.fn(),
    initialize: vi.fn(),
    shutdown: vi.fn(),
  })),
  initializeLogCollector: vi.fn(),
  shutdownLogCollector: vi.fn(),
  initializeLogFileWriter: vi.fn(),
  shutdownLogFileWriter: vi.fn(),
}));
