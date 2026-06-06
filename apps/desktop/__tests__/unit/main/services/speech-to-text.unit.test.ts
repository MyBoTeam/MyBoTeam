import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn(),
}));

const mockCreateSpeechService = vi.hoisted(() => vi.fn());
vi.mock('@myboteam/agent-core/desktop-main', () => ({
  createSpeechService: mockCreateSpeechService,
  TranscriptionError: class MockTranscriptionError extends Error {},
  TranscriptionResult: class MockTranscriptionResult {},
}));

import { transcribeAudio, validateElevenLabsApiKey } from '@main/services/speechToText';
import { getApiKey } from '@main/store/secureStorage';

describe('speechToText', () => {
  const mockService = {
    validateElevenLabsApiKey: vi.fn(),
    transcribeAudio: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSpeechService.mockReturnValue(mockService);
  });

  describe('validateElevenLabsApiKey', () => {
    it('should validate via daemon when no explicit apiKey provided', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-eleven-123');
      mockService.validateElevenLabsApiKey.mockResolvedValue({ valid: true });

      const result = await validateElevenLabsApiKey();

      expect(getApiKey).toHaveBeenCalledWith('elevenlabs');
      expect(mockCreateSpeechService).toHaveBeenCalled();
      expect(result).toEqual({ valid: true });
    });

    it('should build service without storage when apiKey is provided', async () => {
      mockService.validateElevenLabsApiKey.mockResolvedValue({ valid: true, error: undefined });

      const result = await validateElevenLabsApiKey('sk-explicit-key');

      expect(getApiKey).not.toHaveBeenCalled();
      expect(mockCreateSpeechService).toHaveBeenCalled();
      const storageArg = mockCreateSpeechService.mock.calls[0][0].storage;
      expect(storageArg.getApiKey('elevenlabs')).toBeNull();
      expect(result).toEqual({ valid: true, error: undefined });
    });

    it('should pass validation errors when apiKey is provided', async () => {
      mockService.validateElevenLabsApiKey.mockResolvedValue({
        valid: false,
        error: 'Invalid key',
      });

      const result = await validateElevenLabsApiKey('sk-bad');

      expect(result).toEqual({ valid: false, error: 'Invalid key' });
    });

    it('should pass validation errors when using daemon key', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-eleven-123');
      mockService.validateElevenLabsApiKey.mockResolvedValue({
        valid: false,
        error: 'Insufficient credits',
      });

      const result = await validateElevenLabsApiKey();

      expect(result).toEqual({ valid: false, error: 'Insufficient credits' });
    });
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio using daemon key', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-eleven-123');
      const audioData = Buffer.from('fake-audio');
      const mockResult = { success: true as const, result: { text: 'hello world' } };
      mockService.transcribeAudio.mockResolvedValue(mockResult);

      const result = await transcribeAudio(audioData, 'audio/webm');

      expect(getApiKey).toHaveBeenCalledWith('elevenlabs');
      expect(mockService.transcribeAudio).toHaveBeenCalledWith(audioData, 'audio/webm');
      expect(result).toEqual(mockResult);
    });

    it('should use default mime type when not provided', async () => {
      (getApiKey as ReturnType<typeof vi.fn>).mockResolvedValue('sk-eleven-123');
      const audioData = Buffer.from('fake-audio');
      mockService.transcribeAudio.mockResolvedValue({
        success: true as const,
        result: { text: '' },
      });

      await transcribeAudio(audioData);

      expect(mockService.transcribeAudio).toHaveBeenCalledWith(audioData, 'audio/webm');
    });
  });
});
