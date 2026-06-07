import type { FileAttachmentInfo } from '@myboteam/agent-core';
import { PROMPT_DEFAULT_MAX_LENGTH } from '@myboteam/agent-core';
import { useCallback, useEffect, useRef } from 'react';
import { useSlashCommand } from '@/hooks/useSlashCommand';
import { useSpeechInput } from '@/hooks/useSpeechInput';
import { useTaskInputBehavior } from '@/hooks/useTaskInputBehavior';
import { useTaskInputDragDrop } from '@/hooks/useTaskInputDragDrop';
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder';
import { createLogger } from '@/utils/logger';

const logger = createLogger('TaskInputBar');

interface UseTaskInputBarOptions {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  typingPlaceholder: boolean;
  isLoading: boolean;
  disabled: boolean;
  autoFocus: boolean;
  autoSubmitOnTranscription: boolean;
  attachments: FileAttachmentInfo[];
  onAttachmentsChange?: (attachments: FileAttachmentInfo[]) => void;
  onOpenSpeechSettings?: () => void;
  externalAttachmentError: string | null;
}

export function useTaskInputBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  typingPlaceholder,
  isLoading,
  disabled,
  autoFocus,
  autoSubmitOnTranscription,
  attachments,
  onAttachmentsChange,
  externalAttachmentError,
}: UseTaskInputBarOptions) {
  const isInputDisabled = disabled || isLoading;
  const isOverLimit = value.length > PROMPT_DEFAULT_MAX_LENGTH;
  const canSubmit = (!!value.trim() || attachments.length > 0) && !disabled && !isOverLimit;
  const isSubmitDisabled = !canSubmit || isInputDisabled;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestValueRef = useRef(value);
  const pendingAutoSubmitRef = useRef<string | null>(null);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const animatedPlaceholder = useTypingPlaceholder({
    enabled: typingPlaceholder && !value,
    text: placeholder,
  });
  const effectivePlaceholder = typingPlaceholder && !value ? animatedPlaceholder : placeholder;

  const dragDrop = useTaskInputDragDrop({
    attachments,
    onAttachmentsChange,
    isInputDisabled,
  });
  const attachmentError = externalAttachmentError ?? dragDrop.attachmentError;

  const slashCommand = useSlashCommand({
    value,
    textareaRef,
    onChange,
  });

  const handleTranscriptionComplete = useCallback(
    (text: string) => {
      const currentValue = latestValueRef.current;
      const newValue = currentValue.trim() ? `${currentValue} ${text}` : text;
      onChange(newValue);
      if (autoSubmitOnTranscription && newValue.trim()) {
        pendingAutoSubmitRef.current = newValue;
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
    [onChange, autoSubmitOnTranscription],
  );

  const speechInput = useSpeechInput({
    onTranscriptionComplete: handleTranscriptionComplete,
    onError: (error) => {
      logger.error('Speech error:', error.message);
    },
  });

  const behavior = useTaskInputBehavior({
    textareaRef,
    value,
    isInputDisabled,
    isOverLimit,
    autoFocus,
    autoSubmitOnTranscription,
    canSubmit,
    isLoading,
    isRecording: speechInput.isRecording,
    slashCommand,
    onSubmit,
    pendingAutoSubmitRef,
  });

  const { attachmentError: _dragDropAttachmentError, ...dragDropRest } = dragDrop;

  return {
    textareaRef,
    effectivePlaceholder,
    isInputDisabled,
    isOverLimit,
    isSubmitDisabled,
    attachmentError,
    slashCommand,
    speechInput,
    behavior,
    ...dragDropRest,
  };
}
