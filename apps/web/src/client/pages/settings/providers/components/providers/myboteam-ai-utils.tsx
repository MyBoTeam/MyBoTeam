import type { CreditUsage } from '@myboteam/agent-core/common';
import { DEFAULT_PROVIDERS } from '@myboteam/agent-core/common';
import { useTranslation } from 'react-i18next';
import { getCreditStatusColor } from '@/hooks/useCreditsState';
import { PROVIDER_LOGOS } from '@/utils/provider-logos';

const MYBOTEAM_CONFIG = DEFAULT_PROVIDERS.find((p) => p.id === 'myboteam-ai');
if (!MYBOTEAM_CONFIG || MYBOTEAM_CONFIG.models.length === 0) {
  throw new Error('MyBoTeam provider configuration is missing required models');
}
export const STATIC_MODELS = MYBOTEAM_CONFIG.models.map((m) => ({
  id: m.fullId,
  name: m.displayName,
}));
export const MYBOTEAM_LOGO = PROVIDER_LOGOS['myboteam-ai'];

export { ConnectionRetryNotice } from './ConnectionRetryNotice';
export { UsageRetryNotice } from './UsageRetryNotice';
export { UsageSkeleton } from './UsageSkeleton';

function formatResetDate(resetsAt: string): string | null {
  if (!resetsAt) return null;
  try {
    return new Date(resetsAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function UsagePanel({ usage }: { usage: CreditUsage }) {
  const { t } = useTranslation('settings');
  const pct =
    usage.totalCredits > 0
      ? Math.max(0, Math.min(100, (usage.spentCredits / usage.totalCredits) * 100))
      : 0;

  const isExhausted = usage.remainingCredits <= 0;
  const barColor = getCreditStatusColor(usage);
  const resetsDate = formatResetDate(usage.resetsAt);

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">Credits</span>
        <span className="tabular-nums text-muted-foreground">
          {usage.spentCredits.toLocaleString()} / {usage.totalCredits.toLocaleString()} used
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isExhausted ? (
        <p className="text-xs text-destructive">
          {resetsDate
            ? t('providers.myboteamAi.exhaustedMessage', { date: resetsDate })
            : t(
                'providers.myboteamAi.exhaustedMessageSoon',
                'Credits exhausted. They will reset soon.',
              )}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {resetsDate ? `Resets on ${resetsDate}` : 'Credits will reset soon'}
        </p>
      )}
    </div>
  );
}
