import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { settingsTransitions, settingsVariants } from '@/utils/animations';

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
