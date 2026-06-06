import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/internal/classes/SpeechService.js', () => ({
  SpeechService: class MockSpeech {
    constructor(readonly storage: unknown) {}
    speak = vi.fn();
    stop = vi.fn();
    isSpeaking = vi.fn();
  },
}));

import { createSpeechService } from '../../../src/factories/speech.js';

describe('createSpeechService', () => {
  it('should create a SpeechService with storage', () => {
    const storage = { get: vi.fn(), set: vi.fn() } as never;
    const result = createSpeechService({ storage });
    expect(result).toBeDefined();
    expect(typeof result.speak).toBe('function');
  });
});
