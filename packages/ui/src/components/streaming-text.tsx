import { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number;
  isComplete?: boolean;
  onComplete?: () => void;
  className?: string;
  children: (displayedText: string) => React.ReactNode;
}

export function StreamingText({
  text,
  speed = 80,
  isComplete = false,
  onComplete,
  className,
  children,
}: StreamingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(isComplete ? text.length : 0);
  const [isStreaming, setIsStreaming] = useState(!isComplete);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const textRef = useRef(text);

  useEffect(() => {
    if (text.length > textRef.current.length && !isComplete) {
      setIsStreaming(true);
    }
    textRef.current = text;
  }, [text, isComplete]);

  useEffect(() => {
    if (isComplete) {
      setDisplayedLength(text.length);
      setIsStreaming(false);
    }
  }, [isComplete, text.length]);

  const [streamingJustFinished, setStreamingJustFinished] = useState(false);

  useEffect(() => {
    if (streamingJustFinished) {
      setStreamingJustFinished(false);
      onComplete?.();
    }
  }, [streamingJustFinished, onComplete]);

  useEffect(() => {
    if (!isStreaming || isComplete) return;

    const charsPerMs = speed / 1000;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimeRef.current;
      const charsToAdd = Math.floor(elapsed * charsPerMs);

      if (charsToAdd > 0) {
        setDisplayedLength((prev) => {
          const next = Math.min(prev + charsToAdd, textRef.current.length);
          if (next >= textRef.current.length) {
            setIsStreaming(false);
            setStreamingJustFinished(true);
          }
          return next;
        });
        lastTimeRef.current = timestamp;
      }

      if (displayedLength < textRef.current.length) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isStreaming, isComplete, speed, displayedLength]);

  const displayedText = text.slice(0, displayedLength);

  return (
    <div className={className}>
      {children(displayedText)}
      {isStreaming && displayedLength < text.length && (
        <span className="inline-block w-2 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}

export function useStreamingState(
  messageId: string,
  isLatestAssistantMessage: boolean,
  isTaskRunning: boolean,
) {
  const [hasFinishedStreaming, setHasFinishedStreaming] = useState(false);
  const wasStreamingRef = useRef(false);

  const shouldStream = isLatestAssistantMessage && isTaskRunning && !hasFinishedStreaming;

  useEffect(() => {
    if (wasStreamingRef.current && !shouldStream) {
      setHasFinishedStreaming(true);
    }
    wasStreamingRef.current = shouldStream;
  }, [shouldStream]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messageId signals a new message
  useEffect(() => {
    setHasFinishedStreaming(false);
    wasStreamingRef.current = false;
  }, [messageId]);

  return {
    shouldStream,
    isComplete: !shouldStream,
    onComplete: () => setHasFinishedStreaming(true),
  };
}
