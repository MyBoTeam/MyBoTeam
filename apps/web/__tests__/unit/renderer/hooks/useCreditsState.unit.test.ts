import { describe, expect, it } from 'vitest';
import { getCreditStatusColor } from '@/hooks/useCreditsState';

describe('getCreditStatusColor', () => {
  it('returns red when remaining credits are 0 or less', () => {
    expect(
      getCreditStatusColor({ remainingCredits: 0, spentCredits: 100, totalCredits: 100 }),
    ).toBe('bg-red-500');
    expect(
      getCreditStatusColor({ remainingCredits: -1, spentCredits: 100, totalCredits: 100 }),
    ).toBe('bg-red-500');
  });

  it('returns emerald when percentage spent is under 60%', () => {
    expect(
      getCreditStatusColor({ remainingCredits: 50, spentCredits: 10, totalCredits: 100 }),
    ).toBe('bg-emerald-500');
  });

  it('returns amber when percentage spent is between 60% and 85%', () => {
    expect(
      getCreditStatusColor({ remainingCredits: 25, spentCredits: 75, totalCredits: 100 }),
    ).toBe('bg-amber-500');
  });

  it('returns red when percentage spent is 85% or more', () => {
    expect(
      getCreditStatusColor({ remainingCredits: 10, spentCredits: 90, totalCredits: 100 }),
    ).toBe('bg-red-500');
  });

  it('handles zero total credits gracefully', () => {
    expect(getCreditStatusColor({ remainingCredits: 0, spentCredits: 0, totalCredits: 0 })).toBe(
      'bg-red-500',
    );
  });
});
