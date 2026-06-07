import type { Task } from '@myboteam/agent-core';
import { Clock } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MessageBubble } from '@/components/execution/MessageList';
import { springs } from '@/lib/animations';

export { QueuedEmptyState } from './QueuedEmptyState';

interface QueuedWithMessagesProps {
  messages: Task['messages'];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function QueuedWithMessages({ messages, messagesEndRef }: QueuedWithMessagesProps) {
  const { t } = useTranslation('execution');
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto space-y-4">
        {messages
          .filter((m) => !(m.type === 'tool' && m.toolName?.toLowerCase() === 'bash'))
          .map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="flex flex-col items-center gap-4 py-8"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{t('waiting.title')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('waiting.followUpDescription')}</p>
          </div>
        </motion.div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
