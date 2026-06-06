export const DEFAULT_ELEVENLABS_STT_MODEL_ID = 'scribe_v2';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  duration: number;
  timestamp: number;
}

export interface TranscriptionError {
  code: string;
  message: string;
}
