import { useEffect, useRef } from 'react';

export function useSpeechKeyboardShortcuts(params: {
  isRecording: boolean;
  isTranscribing: boolean;
  isConfigured: boolean;
  cancelRecording: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}) {
  const {
    isRecording,
    isTranscribing,
    isConfigured,
    cancelRecording,
    startRecording,
    stopRecording,
  } = params;
  const isPushToTalkRef = useRef(false);
  const isStartingRef = useRef(false);
  const pendingStopRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRecording) {
        event.preventDefault();
        isPushToTalkRef.current = false;
        cancelRecording();
        return;
      }
      if (
        event.key === 'Alt' &&
        !event.repeat &&
        !isPushToTalkRef.current &&
        !isRecording &&
        !isTranscribing &&
        isConfigured
      ) {
        event.preventDefault();
        isPushToTalkRef.current = true;
        isStartingRef.current = true;
        pendingStopRef.current = false;
        startRecording()
          .then(() => {
            isStartingRef.current = false;
            if (pendingStopRef.current) {
              pendingStopRef.current = false;
              stopRecording();
            }
          })
          .catch(() => {
            isStartingRef.current = false;
            isPushToTalkRef.current = false;
            pendingStopRef.current = false;
          });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt' && isPushToTalkRef.current) {
        isPushToTalkRef.current = false;
        if (isStartingRef.current) {
          pendingStopRef.current = true;
        } else {
          stopRecording();
        }
      }
    };

    const handleBlur = () => {
      if (isPushToTalkRef.current) {
        isPushToTalkRef.current = false;
        if (isStartingRef.current) {
          pendingStopRef.current = true;
        } else {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isRecording, isTranscribing, isConfigured, cancelRecording, startRecording, stopRecording]);
}
