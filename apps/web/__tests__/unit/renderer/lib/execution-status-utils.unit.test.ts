import { describe, expect, it } from 'vitest';
import { getStatusTranslationKey } from '@/pages/execution/executionStatusUtils';

describe('getStatusTranslationKey', () => {
  it('maps "interrupted" to "status.stopped"', () => {
    expect(getStatusTranslationKey('interrupted')).toBe('status.stopped');
  });

  it('maps "running" to "status.running"', () => {
    expect(getStatusTranslationKey('running')).toBe('status.running');
  });

  it('maps "completed" to "status.completed"', () => {
    expect(getStatusTranslationKey('completed')).toBe('status.completed');
  });

  it('maps "error" to "status.error"', () => {
    expect(getStatusTranslationKey('error')).toBe('status.error');
  });

  it('maps "pending" to "status.pending"', () => {
    expect(getStatusTranslationKey('pending')).toBe('status.pending');
  });
});
