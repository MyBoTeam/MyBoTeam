import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@myboteam/ui';
import { useTranslation } from 'react-i18next';
import { type DaemonStatus, useDaemonStore } from '@/stores/daemonStore';

const DOT_STYLES: Record<DaemonStatus, string> = {
  connected: 'bg-green-500',
  starting: 'bg-green-500 animate-pulse',
  stopped: 'bg-red-500',
  stopping: 'bg-red-500 animate-pulse',
  reconnecting: 'bg-yellow-500 animate-pulse',
  disconnected: 'bg-yellow-500 animate-pulse',
  'reconnect-failed': 'bg-red-500',
};

const STATUS_LABELS: Record<DaemonStatus, string> = {
  connected: 'daemon.status.running',
  starting: 'daemon.status.starting',
  stopped: 'daemon.status.stopped',
  stopping: 'daemon.status.stopping',
  reconnecting: 'daemon.status.reconnecting',
  disconnected: 'daemon.status.reconnecting',
  'reconnect-failed': 'daemon.status.failed',
};

export function DaemonStatusDot() {
  const status = useDaemonStore((s) => s.status);
  const { t } = useTranslation('settings');

  const dotClass = DOT_STYLES[status];
  const labelKey = STATUS_LABELS[status];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-block h-2 w-2 rounded-full shrink-0 ${dotClass}`}
            aria-label={t(labelKey)}
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {t(labelKey)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
