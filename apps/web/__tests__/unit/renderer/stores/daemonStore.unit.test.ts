import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDaemonStore } from '@/stores/daemonStore';

describe('daemonStore', () => {
  beforeEach(() => {
    useDaemonStore.setState({ status: 'connected', toastDismissed: false });
  });

  it('starts with connected status and toast not dismissed', () => {
    const { result } = renderHook(() => useDaemonStore());
    expect(result.current.status).toBe('connected');
    expect(result.current.toastDismissed).toBe(false);
  });

  it('setStatus updates status', () => {
    const { result } = renderHook(() => useDaemonStore());
    act(() => {
      result.current.setStatus('stopped');
    });
    expect(result.current.status).toBe('stopped');
  });

  it('setStatus resets toastDismissed for disconnected', () => {
    const { result } = renderHook(() => useDaemonStore());
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastDismissed).toBe(true);

    act(() => {
      result.current.setStatus('disconnected');
    });
    expect(result.current.toastDismissed).toBe(false);
  });

  it('setStatus resets toastDismissed for reconnect-failed', () => {
    const { result } = renderHook(() => useDaemonStore());
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastDismissed).toBe(true);

    act(() => {
      result.current.setStatus('reconnect-failed');
    });
    expect(result.current.toastDismissed).toBe(false);
  });

  it('setStatus does not reset toastDismissed for non-problem status', () => {
    const { result } = renderHook(() => useDaemonStore());
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastDismissed).toBe(true);

    act(() => {
      result.current.setStatus('starting');
    });
    expect(result.current.toastDismissed).toBe(true);
  });

  it('dismissToast sets toastDismissed to true', () => {
    const { result } = renderHook(() => useDaemonStore());
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastDismissed).toBe(true);
  });
});
