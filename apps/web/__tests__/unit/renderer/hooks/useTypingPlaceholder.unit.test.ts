import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';

describe('useTypingPlaceholder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows full text when disabled', () => {
    const { result } = renderHook(() => useTypingPlaceholder({ enabled: false }));
    expect(result.current).toBe('Describe a task and let AI handle the rest');
  });

  it('starts with empty string when enabled', () => {
    const { result } = renderHook(() => useTypingPlaceholder());
    expect(result.current).toBe('');
  });

  it('returns custom text when provided', () => {
    const { result } = renderHook(() => useTypingPlaceholder({ enabled: true, text: 'Hello' }));
    expect(result.current).toBe('');
  });

  it('types characters over time', () => {
    const { result } = renderHook(() =>
      useTypingPlaceholder({ enabled: true, text: 'Hi', typingSpeed: 10 }),
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('H');

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(result.current).toBe('Hi');
  });
});
