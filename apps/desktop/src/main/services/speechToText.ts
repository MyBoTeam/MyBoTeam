import {
  createSpeechService,
  type SecureStorageAPI,
  type SpeechServiceAPI,
  type TranscriptionError,
  type TranscriptionResult,
} from '@myboteam/agent-core/desktop-main';
import { getApiKey } from '../store/secureStorage';

export type { TranscriptionError, TranscriptionResult } from '@myboteam/agent-core/desktop-main';

async function buildServiceFromDaemon(): Promise<SpeechServiceAPI> {
  const elevenlabsKey = await getApiKey('elevenlabs');
  const fakeStorage = {
    getApiKey: (provider: string): string | null =>
      provider === 'elevenlabs' ? elevenlabsKey : null,
  } as unknown as SecureStorageAPI;
  return createSpeechService({ storage: fakeStorage });
}

function buildServiceWithoutStorage(): SpeechServiceAPI {
  const nullStorage = {
    getApiKey: (): string | null => null,
  } as unknown as SecureStorageAPI;
  return createSpeechService({ storage: nullStorage });
}

export async function validateElevenLabsApiKey(
  apiKey?: string,
): Promise<{ valid: boolean; error?: string }> {
  if (apiKey) {
    return buildServiceWithoutStorage().validateElevenLabsApiKey(apiKey);
  }
  const service = await buildServiceFromDaemon();
  return service.validateElevenLabsApiKey();
}

export async function transcribeAudio(
  audioData: Buffer,
  mimeType: string = 'audio/webm',
): Promise<
  { success: true; result: TranscriptionResult } | { success: false; error: TranscriptionError }
> {
  const service = await buildServiceFromDaemon();
  return service.transcribeAudio(audioData, mimeType);
}
