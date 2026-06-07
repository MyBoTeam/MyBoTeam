import { useTranslation } from 'react-i18next';
import Header from '@/layouts/main/components/Header';
import { useTaskStore } from '@/stores/taskStore';
import ConversationList from './components/ConversationList';

export default function HistoryPage() {
  const { t } = useTranslation('history');
  const { t: tCommon } = useTranslation('common');
  const { tasks, clearHistory } = useTaskStore();

  const handleClearAll = async () => {
    if (confirm(t('confirmClear'))) {
      try {
        await clearHistory();
      } catch (_error) {}
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-text">{t('title')}</h1>
          {tasks.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-text-muted hover:text-danger transition-colors"
            >
              {tCommon('buttons.clearAll')}
            </button>
          )}
        </div>
        <ConversationList showTitle={false} />
      </main>
    </div>
  );
}
