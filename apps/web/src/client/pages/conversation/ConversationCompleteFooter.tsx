import { Alert, AlertDescription, Button } from '@myboteam/ui';
import { WarningCircle } from '@phosphor-icons/react';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StarButton } from '@/components/StarButton';
import { useTaskStore } from '@/stores/taskStore';
import { FAVORITABLE_STATUSES } from '@/utils/task-utils';
import { getStatusTranslationKey } from './conversationStatusUtils';

export function ConversationCompleteFooter({
  taskId,
  onStartNewTask,
}: {
  taskId: string;
  onStartNewTask: () => void;
}) {
  const { t: tExecution } = useTranslation('execution');
  const { currentTask, favorites, loadFavorites, addFavorite, removeFavorite } = useTaskStore();
  const favoritesList = Array.isArray(favorites) ? favorites : [];
  const isFavorited = favoritesList.some((f) => f.taskId === taskId);

  useEffect(() => {
    if (typeof loadFavorites === 'function') {
      loadFavorites();
    }
  }, [loadFavorites]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      if (isFavorited) {
        await removeFavorite(taskId);
      } else {
        await addFavorite(taskId);
      }
    } catch (_err) {}
  }, [taskId, isFavorited, addFavorite, removeFavorite]);

  const rawStatus = currentTask?.status ?? '';
  const statusLabel = rawStatus ? tExecution(getStatusTranslationKey(rawStatus)) : '';
  const canFavorite = FAVORITABLE_STATUSES.includes(rawStatus);

  const failedErrorMessage =
    currentTask?.status === 'failed' ? (currentTask.result?.error ?? null) : null;

  const showFailedAlert =
    failedErrorMessage !== null &&
    failedErrorMessage.length > 0 &&
    !failedErrorMessage.includes('Check the debug panel for details');

  return (
    <div className="flex-shrink-0 px-6 py-4 flex flex-col items-center gap-3">
      <p className="text-sm text-foreground">{tExecution('taskStatus', { status: statusLabel })}</p>
      {showFailedAlert && (
        <Alert
          variant="destructive"
          className="py-2 px-3 flex items-center gap-2 [&>svg]:static [&>svg~*]:pl-0 max-w-md w-full"
        >
          <WarningCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs leading-tight">
            {failedErrorMessage}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-2">
        {canFavorite && (
          <StarButton
            isFavorite={isFavorited}
            onToggle={() => void handleToggleFavorite()}
            size="md"
            data-testid="favorite-toggle"
          />
        )}
        <Button onClick={onStartNewTask} data-testid="start-new-task">
          {tExecution('startNewTask')}
        </Button>
      </div>
    </div>
  );
}
