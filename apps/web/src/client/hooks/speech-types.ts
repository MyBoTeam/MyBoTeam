export class SpeechRecognitionError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'SpeechRecognitionError';
  }
}

export interface UseSpeechInputOptions {
  onTranscriptionComplete?: (text: string) => void;

  onRecordingStateChange?: (isRecording: boolean) => void;

  onError?: (error: SpeechRecognitionError) => void;

  maxDuration?: number;
}

export interface UseSpeechInputState {
  isRecording: boolean;

  isTranscribing: boolean;

  recordingDuration: number;

  error: SpeechRecognitionError | null;

  lastTranscription: string | null;

  isConfigured: boolean;
}
