import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { settingsTransitions, settingsVariants } from '@/lib/animations';

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
