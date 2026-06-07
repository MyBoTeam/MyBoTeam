import { useEffect, useRef, useState } from 'react';
import { getMyBoTeam } from '../lib/myboteam';
import { SpeechRecognitionError } from './speech-types';

export function formatErrorMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }
  if (message instanceof Error) {
    return message.message;
  }
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

export function createSpeechError(
  code: string,
  error: unknown,
  fallback?: string,
): SpeechRecognitionError {
  return new SpeechRecognitionError(
    code,
    error instanceof Error ? error.message : (fallback ?? 'Speech recognition failed'),
  );
}

export function useSpeechConfig() {
  const configCheckIdRef = useRef(0);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let mounted = true;
    configCheckIdRef.current++;
    const capturedId = configCheckIdRef.current;
    getMyBoTeam()
      .speechIsConfigured()
      .then((configured) => {
        if (mounted && capturedId === configCheckIdRef.current) {
          setIsConfigured(configured);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const handleConfigUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ isConfigured?: boolean }>).detail;
      if (detail?.isConfigured !== undefined && mounted) {
        setIsConfigured(detail.isConfigured as boolean);
      }
      configCheckIdRef.current++;
      const capturedId = configCheckIdRef.current;
      getMyBoTeam()
        .speechIsConfigured()
        .then((configured) => {
          if (mounted && capturedId === configCheckIdRef.current) {
            setIsConfigured(configured);
          }
        })
        .catch(() => {});
    };
    window.addEventListener('speech-config-updated', handleConfigUpdated);
    return () => {
      mounted = false;
      window.removeEventListener('speech-config-updated', handleConfigUpdated);
    };
  }, []);

  return { isConfigured };
}
