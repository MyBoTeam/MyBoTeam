import type { SecureStorage } from './SecureStorage.js';
import {
  callElevenLabsTranscribe,
  DEFAULT_ELEVENLABS_STT_MODEL_ID,
  validateElevenLabsApiKey,
} from './speech-api.js';

export type { TranscriptionError, TranscriptionResult } from './speech-api.js';

export class SpeechService {
  private storage: SecureStorage;

  constructor(storage: SecureStorage) {
    this.storage = storage;
  }

  getElevenLabsApiKey(): string | null {
    const key = this.storage.getApiKey('elevenlabs');
    return key?.trim() ? key : null;
  }

  isElevenLabsConfigured(): boolean {
    return this.getElevenLabsApiKey() !== null;
  }

  async validateElevenLabsApiKey(apiKey?: string): Promise<{ valid: boolean; error?: string }> {
    const key = apiKey || this.getElevenLabsApiKey();
    if (!key?.trim()) {
      return { valid: false, error: 'API key is required' };
    }
    return validateElevenLabsApiKey(key);
  }

  async transcribeAudio(
    audioData: Buffer,
    mimeType: string = 'audio/webm',
  ): Promise<
    | { success: true; result: import('./speech-api.js').TranscriptionResult }
    | { success: false; error: import('./speech-api.js').TranscriptionError }
  > {
    const apiKey = this.getElevenLabsApiKey();
    const modelId = process.env.ELEVENLABS_STT_MODEL_ID?.trim() || DEFAULT_ELEVENLABS_STT_MODEL_ID;

    if (!apiKey) {
      return {
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'ElevenLabs API key is not configured. Please add it in settings.',
        },
      };
    }

    return callElevenLabsTranscribe(apiKey, audioData, mimeType, modelId);
  }
}

export function createSpeechService(storage: SecureStorage): SpeechService {
  return new SpeechService(storage);
}
