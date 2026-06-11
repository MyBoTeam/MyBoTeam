export interface SpeechInputButtonProps {
  isRecording: boolean;

  isTranscribing: boolean;

  recordingDuration?: number;

  error?: Error | null;

  isConfigured?: boolean;

  disabled?: boolean;

  onStartRecording?: () => void;

  onStopRecording?: () => void;

  onCancel?: () => void;

  onRetry?: () => void;

  onOpenSettings?: () => void;

  size?: 'sm' | 'md' | 'lg';

  className?: string;

  tooltipText?: string;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
