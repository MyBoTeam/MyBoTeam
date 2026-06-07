import type { CreditUsage } from '@myboteam/agent-core/common';
import { DEFAULT_PROVIDERS } from '@myboteam/agent-core/common';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getCreditStatusColor } from '@/hooks/useCreditsState';
import { settingsTransitions, settingsVariants } from '@/lib/animations';
import { PROVIDER_LOGOS } from '@/lib/provider-logos';

export const MYBOTEAM_CONFIG = DEFAULT_PROVIDERS.find((p) => p.id === 'myboteam-ai');
if (!MYBOTEAM_CONFIG || MYBOTEAM_CONFIG.models.length === 0) {
  throw new Error('MyBoTeam provider configuration is missing required models');
}
export const STATIC_MODELS = MYBOTEAM_CONFIG.models.map((m) => ({
  id: m.fullId,
  name: m.displayName,
}));
export const MYBOTEAM_LOGO = PROVIDER_LOGOS['myboteam-ai'];

export function UsageSkeleton() {
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
      <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
    </div>
  );
}

export function ConnectionRetryNotice() {
  const { t } = useTranslation('settings');
  return (
    <motion.div
      className="mt-3 rounded-lg border border-border bg-muted/20 p-3"
      variants={settingsVariants.fadeSlide}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={settingsTransitions.enter}
    >
      <div className="flex items-start gap-2.5">
        <span className="relative mt-[3px] flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground/80">
            {t('providers.myboteamAi.connectionIssue', 'Having trouble connecting')}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t(
              'providers.myboteamAi.retryingInBackground',
              'Retrying in the background — this will resolve when your connection is restored.',
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function UsageRetryNotice() {
  const { t } = useTranslation('settings');
  return (
    <motion.div
      className="mt-3 rounded-lg border border-border bg-muted/20 p-3"
      variants={settingsVariants.fadeSlide}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={settingsTransitions.enter}
    >
      <div className="flex items-start gap-2.5">
        <span className="relative mt-[3px] flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
        </span>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground/80">
            {t('providers.myboteamAi.usageIssue', 'Unable to refresh credits')}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t(
              'providers.myboteamAi.usageRetryingInBackground',
              'Retrying in the background. Sending with MyBoTeam should still work.',
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

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
