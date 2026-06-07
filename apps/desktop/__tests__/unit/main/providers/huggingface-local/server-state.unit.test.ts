import {
  activeGenerations,
  decrementGenerations,
  incrementGenerations,
  loadModelPromise,
  setLoadModelPromise,
  setStartServerPromise,
  startServerPromise,
  state,
} from '@main/providers/huggingface-local/server-state';
import { beforeEach, describe, expect, it } from 'vitest';

describe('server-state', () => {
  beforeEach(() => {
    state.server = null;
    state.port = null;
    state.loadedModelId = null;
    state.pipeline = null;
    state.tokenizer = null;
    state.model = null;
    state.isLoading = false;
    state.isStopping = false;
    setLoadModelPromise(null);
    setStartServerPromise(null);

    while (activeGenerations > 0) decrementGenerations();
  });

  it('should initialize with default values', () => {
    expect(state.server).toBeNull();
    expect(state.port).toBeNull();
    expect(state.loadedModelId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isStopping).toBe(false);
  });

  it('should allow setting server reference', () => {
    state.server = {} as never;
    expect(state.server).not.toBeNull();
  });

  it('should allow setting port', () => {
    state.port = 8080;
    expect(state.port).toBe(8080);
  });

  it('should allow setting loadedModelId', () => {
    state.loadedModelId = 'meta-llama/Llama-2-7b';
    expect(state.loadedModelId).toBe('meta-llama/Llama-2-7b');
  });

  it('should allow setting isLoading flag', () => {
    state.isLoading = true;
    expect(state.isLoading).toBe(true);
  });

  it('should allow setting isStopping flag', () => {
    state.isStopping = true;
    expect(state.isStopping).toBe(true);
  });

  describe('loadModelPromise mutex', () => {
    it('should start as null', () => {
      expect(loadModelPromise).toBeNull();
    });

    it('should set and get', () => {
      const promise = Promise.resolve();
      setLoadModelPromise(promise);
      expect(loadModelPromise).toBe(promise);
    });

    it('should allow clearing', () => {
      setLoadModelPromise(Promise.resolve());
      setLoadModelPromise(null);
      expect(loadModelPromise).toBeNull();
    });
  });

  describe('startServerPromise mutex', () => {
    it('should start as null', () => {
      expect(startServerPromise).toBeNull();
    });

    it('should set and get', () => {
      const promise = Promise.resolve({ success: true as const, port: 8080 });
      setStartServerPromise(promise);
      expect(startServerPromise).toBe(promise);
    });

    it('should allow clearing', () => {
      setStartServerPromise(Promise.resolve({ success: true as const }));
      setStartServerPromise(null);
      expect(startServerPromise).toBeNull();
    });
  });

  describe('activeGenerations counter', () => {
    it('should start at 0', () => {
      expect(activeGenerations).toBe(0);
    });

    it('should increment', () => {
      incrementGenerations();
      expect(activeGenerations).toBe(1);
    });

    it('should decrement', () => {
      incrementGenerations();
      incrementGenerations();
      decrementGenerations();
      expect(activeGenerations).toBe(1);
    });

    it('should handle multiple increments and decrements', () => {
      incrementGenerations();
      incrementGenerations();
      incrementGenerations();
      decrementGenerations();
      decrementGenerations();
      expect(activeGenerations).toBe(1);
    });
  });
});
