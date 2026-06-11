import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCleanStartTaskState } from '../../src/app-setup.js';

describe('clean-start task state', () => {
  afterEach(() => {
    delete process.env.CLEAN_START;
  });

  it('deletes task history and related task state when CLEAN_START=1', () => {
    process.env.CLEAN_START = '1';
    const storage = { clearHistory: vi.fn() };

    applyCleanStartTaskState(storage);

    expect(storage.clearHistory).toHaveBeenCalledTimes(1);
  });

  it('preserves task history when clean start is not requested', () => {
    const storage = { clearHistory: vi.fn() };

    applyCleanStartTaskState(storage);

    expect(storage.clearHistory).not.toHaveBeenCalled();
  });
});
