import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useTaskStore } from '../../stores/taskStore';
import { TaskHistoryItem } from './TaskHistoryItem';

interface TaskHistoryProps {
  limit?: number;
  showTitle?: boolean;
}

export default function TaskHistory({ limit, showTitle = true }: TaskHistoryProps) {
  const {
    tasks,
    favorites,
    loadTasks,
    loadFavorites,
    addFavorite,
    removeFavorite,
    deleteTask,
    clearHistory,
  } = useTaskStore();
  const favoritesList = Array.isArray(favorites) ? favorites : [];
  const { t } = useTranslation('history');
  const { t: tCommon } = useTranslation('common');

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (typeof loadFavorites === 'function') {
      loadFavorites();
    }
  }, [loadFavorites]);

  const displayedTasks = limit ? tasks.slice(0, limit) : tasks;

  if (displayedTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">{t('noTasks')}</p>
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-text">{t('recentTasks')}</h2>
          {tasks.length > 0 && !limit && (
            <button
              onClick={() => {
                if (confirm(t('confirmClear'))) {
                  clearHistory();
                }
              }}
              className="text-sm text-text-muted hover:text-danger transition-colors"
            >
              {tCommon('buttons.clearAll')}
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {displayedTasks.map((task) => (
          <TaskHistoryItem
            key={task.id}
            task={task}
            isFavorited={favoritesList.some((f) => f.taskId === task.id)}
            onToggleFavorite={async () => {
              if (typeof addFavorite !== 'function' || typeof removeFavorite !== 'function') {
                return;
              }
              if (favoritesList.some((f) => f.taskId === task.id)) {
                await removeFavorite(task.id);
              } else {
                await addFavorite(task.id);
              }
            }}
            onDelete={() => deleteTask(task.id)}
          />
        ))}
      </div>

      {limit && tasks.length > limit && (
        <Link
          to="/history"
          className="block mt-4 text-center text-sm text-text-muted hover:text-text transition-colors"
        >
          {t('viewAll', { count: tasks.length })}
        </Link>
      )}
    </div>
  );
}
