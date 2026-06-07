import { Clock } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { springs } from '@/lib/animations';

export function QueuedEmptyState() {
  const { t } = useTranslation('execution');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="flex-1 flex flex-col items-center justify-center gap-6 px-6"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
        <Clock className="h-8 w-8 text-amber-600" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('waiting.title')}</h2>
        <p className="text-muted-foreground">{t('waiting.description')}</p>
      </div>
    </motion.div>
  );
}
