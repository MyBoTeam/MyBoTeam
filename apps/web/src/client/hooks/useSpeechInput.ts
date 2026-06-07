import { useCallback, useRef, useState } from 'react';
import { getMyBoTeam } from '../lib/myboteam';
import {
  SpeechRecognitionError,
  type UseSpeechInputOptions,
  type UseSpeechInputState,
} from './speech-types';
import { useSpeechKeyboardShortcuts } from './use-speech-input-shortcuts';
import { createSpeechError, formatErrorMessage, useSpeechConfig } from './use-speech-input-utils';
import { useSpeechRecorder } from './useSpeechRecorder';

export type { UseSpeechInputOptions, UseSpeechInputState } from './speech-types';
export { SpeechRecognitionError } from './speech-types';

export function useSpeechInput(options: UseSpeechInputOptions = {}): UseSpeechInputState & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  retry: () => Promise<void>;
  clearError: () => void;
} {
  const {
    onTranscriptionComplete,
    onRecordingStateChange,
    onError,
    maxDuration = 120000,
  } = options;
  const myboteam = getMyBoTeam();
  const { isConfigured } = useSpeechConfig();
  const lastAudioDataRef = useRef<ArrayBuffer | null>(null);

  const [state, setState] = useState<UseSpeechInputState>({
    isRecording: false,
    isTranscribing: false,
    recordingDuration: 0,
    error: null,
    lastTranscription: null,
    isConfigured,
  });

  const recorder = useSpeechRecorder({
    maxDuration,
    onError: (code, message, originalError) => {
      const speechError = new SpeechRecognitionError(code, message, originalError);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isTranscribing: false,
        error: speechError,
        recordingDuration: 0,
      }));
      onError?.(speechError);
    },
    onStateChange: (recording) => {
      setState((prev) => ({ ...prev, isRecording: recording }));
      onRecordingStateChange?.(recording);
    },
    onDurationUpdate: (ms) => {
      setState((prev) => ({ ...prev, recordingDuration: ms }));
    },
  });

  const handleTranscriptionResult = useCallback(
    async (audioData: ArrayBuffer) => {
      setState((prev) => ({ ...prev, isTranscribing: true }));
      try {
        const result = await myboteam.speechTranscribe(audioData, 'audio/webm');
        if (result.success) {
          setState((prev) => ({
            ...prev,
            isTranscribing: false,
            lastTranscription: result.result.text,
            error: null,
            recordingDuration: 0,
          }));
          onTranscriptionComplete?.(result.result.text);
        } else {
          const transcriptionError = new SpeechRecognitionError(
            result.error.code,
            formatErrorMessage(result.error.message),
          );
          setState((prev) => ({
            ...prev,
            isTranscribing: false,
            error: transcriptionError,
            recordingDuration: 0,
          }));
          onError?.(transcriptionError);
        }
      } catch (caught) {
        const speechError = createSpeechError('TRANSCRIPTION_FAILED', caught);
        setState((prev) => ({
          ...prev,
          isTranscribing: false,
          error: speechError,
          recordingDuration: 0,
        }));
        onError?.(speechError);
      }
    },
    [myboteam, onTranscriptionComplete, onError],
  );

  const stopRecording = useCallback(async () => {
    if (!recorder.isCapturing) {
      return;
    }
    try {
      const audioData = await recorder.stopCapture();
      if (!audioData) {
        setState((prev) => ({ ...prev, isTranscribing: false, recordingDuration: 0 }));
        return;
      }
      lastAudioDataRef.current = audioData;
      await handleTranscriptionResult(audioData);
    } catch (caught) {
      const speechError = createSpeechError('TRANSCRIPTION_FAILED', caught);
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
        error: speechError,
        recordingDuration: 0,
      }));
      onError?.(speechError);
    }
  }, [recorder, handleTranscriptionResult, onError]);

  const startRecording = useCallback(async () => {
    if (recorder.isCapturing || state.isTranscribing) {
      return;
    }
    lastAudioDataRef.current = null;
    if (!isConfigured) {
      const error = new SpeechRecognitionError('NOT_CONFIGURED', 'ElevenLabs API key required');
      setState((prev) => ({ ...prev, error }));
      onError?.(error);
      return;
    }
    setState((prev) => ({ ...prev, error: null, recordingDuration: 0 }));
    await recorder.startCapture();
  }, [recorder, state.isTranscribing, isConfigured, onError]);

  const cancelRecording = useCallback(() => {
    if (!recorder.isCapturing) {
      return;
    }
    recorder.cancelCapture();
    lastAudioDataRef.current = null;
    setState((prev) => ({ ...prev, isRecording: false, error: null, recordingDuration: 0 }));
  }, [recorder]);

  const retry = useCallback(async () => {
    if (!lastAudioDataRef.current || state.isTranscribing || state.isRecording) {
      return;
    }
    await handleTranscriptionResult(lastAudioDataRef.current);
  }, [state.isTranscribing, state.isRecording, handleTranscriptionResult]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useSpeechKeyboardShortcuts({
    isRecording: state.isRecording,
    isTranscribing: state.isTranscribing,
    isConfigured,
    cancelRecording,
    startRecording,
    stopRecording,
  });

  return {
    ...state,
    isConfigured,
    startRecording,
    stopRecording,
    cancelRecording,
    retry,
    clearError,
  };
}
