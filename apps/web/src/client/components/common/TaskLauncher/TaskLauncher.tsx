import { hasAnyReadyProvider } from '@myboteam/agent-core/common';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getMyBoTeam } from '@/config/myboteam';
import { useTaskStore } from '@/stores/taskStore';
import { TaskLauncherContent } from './TaskLauncherContent';

export function TaskLauncher() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { isLauncherOpen, launcherInitialPrompt, closeLauncher, tasks, startTask } = useTaskStore();
  const myboteam = getMyBoTeam();
  const [openedAt, setOpenedAt] = useState(Date.now);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      const sevenDaysAgo = openedAt - 7 * 24 * 60 * 60 * 1000;
      return tasks.filter((t) => new Date(t.createdAt).getTime() > sevenDaysAgo);
    }
    const query = searchQuery.toLowerCase();
    return tasks.filter((t) => t.prompt.toLowerCase().includes(query));
  }, [tasks, searchQuery, openedAt]);

  const totalItems = 1 + filteredTasks.length;

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, totalItems - 1)));
  }, [totalItems]);

  useEffect(() => {
    if (isLauncherOpen) {
      setSearchQuery(launcherInitialPrompt || '');
      setSelectedIndex(0);
      setOpenedAt(Date.now());
    }
  }, [isLauncherOpen, launcherInitialPrompt]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isLauncherOpen) {
        closeLauncher();
        setSearchQuery('');
        setSelectedIndex(0);
      }
    },
    [isLauncherOpen, closeLauncher],
  );

  const handleSelect = useCallback(
    async (index: number) => {
      if (index === 0) {
        if (searchQuery.trim()) {
          const settings = await myboteam.getProviderSettings();
          if (!hasAnyReadyProvider(settings)) {
            closeLauncher();
            navigate('/');
            return;
          }
          closeLauncher();
          const taskId = `task_${Date.now()}`;
          const task = await startTask({ prompt: searchQuery.trim(), taskId });
          if (task) {
            navigate(`/execution/${task.id}`);
          }
        } else {
          closeLauncher();
          navigate('/');
        }
      } else {
        const task = filteredTasks[index - 1];
        if (task) {
          closeLauncher();
          navigate(`/execution/${task.id}`);
        }
      }
    },
    [searchQuery, filteredTasks, closeLauncher, navigate, startTask, myboteam],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          handleSelect(selectedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          closeLauncher();
          break;
      }
    },
    [totalItems, selectedIndex, handleSelect, closeLauncher],
  );

  return (
    <DialogPrimitive.Root open={isLauncherOpen} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {isLauncherOpen && (
          <DialogPrimitive.Portal forceMount>
            {}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-white/60 backdrop-blur-[12px]"
              />
            </DialogPrimitive.Overlay>

            <TaskLauncherContent
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedIndex={selectedIndex}
              filteredTasks={filteredTasks}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
            />
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
