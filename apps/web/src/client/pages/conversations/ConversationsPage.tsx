import { Button, ScrollArea } from '@myboteam/ui';
import { ChatText } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { getMyBoTeam } from '@/config/myboteam';
import { ConversationListItem } from '@/layouts/main/components/ConversationListItem';
import { useTaskStore } from '@/stores/taskStore';
import { staggerContainer } from '@/utils/animations';

export default function ConversationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('sidebar');
  const { tasks, loadTasks, updateTaskStatus, addTaskUpdate } = useTaskStore();
  const myboteam = getMyBoTeam();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const unsubscribeStatusChange = myboteam.onTaskStatusChange?.((data) => {
      updateTaskStatus(data.taskId, data.status);
    });
    const unsubscribeTaskUpdate = myboteam.onTaskUpdate((event) => {
      addTaskUpdate(event);
    });
    return () => {
      unsubscribeStatusChange?.();
      unsubscribeTaskUpdate();
    };
  }, [updateTaskStatus, addTaskUpdate, myboteam]);

  const handleNewConversation = () => {
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">{t('conversations')}</h1>
        <Button onClick={handleNewConversation} variant="default" size="sm" className="gap-2">
          <ChatText className="h-4 w-4" />
          {t('newTask')}
        </Button>
      </div>
      <ScrollArea className="flex-1 rounded-lg border border-border glass-bg p-2">
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            {tasks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-16 text-center text-sm text-muted-foreground"
              >
                {t('noConversations')}
              </motion.div>
            ) : (
              <motion.div
                key="task-list"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-1"
              >
                {tasks.map((task) => (
                  <ConversationListItem key={task.id} task={task} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
