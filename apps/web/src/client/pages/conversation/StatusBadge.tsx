import type { TaskStatus } from '@myboteam/agent-core';
import { CheckCircle, Clock, Hourglass, Square, XCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation('execution');

  switch (status) {
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 shrink-0">
          <Clock className="h-3 w-3" />
          {t('status.queued')}
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/5 shrink-0">
          <span className="animate-shimmer bg-gradient-to-r from-primary via-primary/50 to-primary dark:from-primary/70 dark:via-primary/30 dark:to-primary/70 bg-[length:200%_100%] bg-clip-text text-transparent">
            {t('status.running')}
          </span>
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 shrink-0">
          <CheckCircle className="h-3 w-3" />
          {t('status.completed')}
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive shrink-0">
          <XCircle className="h-3 w-3" />
          {t('status.failed')}
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground shrink-0">
          <XCircle className="h-3 w-3" />
          {t('status.cancelled')}
        </span>
      );
    case 'interrupted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 shrink-0">
          <Square className="h-3 w-3" />
          {t('status.stopped')}
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground shrink-0">
          <Hourglass className="h-3 w-3" />
          {t('status.pending')}
        </span>
      );
    case 'waiting_permission':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 shrink-0">
          <Hourglass className="h-3 w-3" />
          {t('status.waiting_permission')}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground shrink-0">
          {status}
        </span>
      );
  }
}
