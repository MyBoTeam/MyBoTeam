import { describe, expect, it } from 'vitest';
import {
  initialPreviewState,
  isViewStatus,
  previewReducer,
} from '@/components/execution/browserPreviewState';

describe('isViewStatus', () => {
  it('returns true for valid statuses', () => {
    expect(isViewStatus('idle')).toBe(true);
    expect(isViewStatus('starting')).toBe(true);
    expect(isViewStatus('streaming')).toBe(true);
    expect(isViewStatus('stopping')).toBe(true);
    expect(isViewStatus('error')).toBe(true);
  });

  it('returns false for invalid statuses', () => {
    expect(isViewStatus('unknown')).toBe(false);
    expect(isViewStatus('connected')).toBe(false);
    expect(isViewStatus('')).toBe(false);
  });
});

describe('initialPreviewState', () => {
  it('has correct default values', () => {
    expect(initialPreviewState).toEqual({
      frameData: null,
      currentUrl: '',
      status: 'idle',
      error: undefined,
      isCollapsed: false,
    });
  });
});

describe('previewReducer', () => {
  it('RESET returns initial state', () => {
    const state = { ...initialPreviewState, currentUrl: 'http://example.com' };
    expect(previewReducer(state, { type: 'RESET' })).toEqual(initialPreviewState);
  });

  it('IDLE returns initial state with preserved isCollapsed', () => {
    const state = { ...initialPreviewState, isCollapsed: true, currentUrl: 'http://x.com' };
    const result = previewReducer(state, { type: 'IDLE' });
    expect(result.isCollapsed).toBe(true);
    expect(result.currentUrl).toBe('');
    expect(result.frameData).toBeNull();
  });

  it('SET_COLLAPSED updates isCollapsed', () => {
    expect(
      previewReducer(initialPreviewState, { type: 'SET_COLLAPSED', value: true }).isCollapsed,
    ).toBe(true);
    expect(
      previewReducer(initialPreviewState, { type: 'SET_COLLAPSED', value: false }).isCollapsed,
    ).toBe(false);
  });

  it('SET_STARTING sets status to starting', () => {
    const result = previewReducer(initialPreviewState, { type: 'SET_STARTING' });
    expect(result.status).toBe('starting');
  });

  it('SET_FRAME sets frameData and status to streaming', () => {
    const result = previewReducer(initialPreviewState, { type: 'SET_FRAME', frame: '<html>' });
    expect(result.frameData).toBe('<html>');
    expect(result.status).toBe('streaming');
  });

  it('SET_URL updates currentUrl', () => {
    const result = previewReducer(initialPreviewState, {
      type: 'SET_URL',
      url: 'https://example.com',
    });
    expect(result.currentUrl).toBe('https://example.com');
  });

  it('SET_STATUS updates status and error', () => {
    const result = previewReducer(initialPreviewState, {
      type: 'SET_STATUS',
      status: 'error',
      message: 'Failed to load',
    });
    expect(result.status).toBe('error');
    expect(result.error).toBe('Failed to load');
  });

  it('throws for unknown action types', () => {
    expect(() => previewReducer(initialPreviewState, { type: 'UNKNOWN' } as never)).toThrow(
      'Unhandled action type',
    );
  });
});
