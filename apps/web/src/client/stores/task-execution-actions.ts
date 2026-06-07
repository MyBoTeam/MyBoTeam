import {
  createMessageId,
  type FileAttachmentInfo,
  type Task,
  type TaskConfig,
  type TaskStatus,
} from '@myboteam/agent-core/common';
import { getMyBoTeam } from '../lib/myboteam';
import { createTaskLifecycleActions } from './task-lifecycle-actions';
import { createTaskPermissionActions } from './task-permission-actions';
import { hasTaskStateToken } from './task-state-helpers';
import { createTaskUpdateActions } from './task-update-actions';
import type { TaskState } from './taskStore';

type SetFn = (partial: Partial<TaskState> | ((state: TaskState) => Partial<TaskState>)) => void;
type GetFn = () => TaskState;

export function createTaskExecutionActions(set: SetFn, get: GetFn) {
  return {
    startTask: async (config: TaskConfig): Promise<Task | null> => {
      const myboteam = getMyBoTeam();
      const taskStateToken = get()._taskStateToken;
      set({ isLoading: true, error: null });
      try {
        void myboteam.logEvent({
          level: 'info',
          message: 'UI start task',
          context: { prompt: config.prompt, taskId: config.taskId, files: config.files?.length },
        });

        myboteam.analytics?.trackSubmitTask().catch(() => {});
        const task = await myboteam.startTask(config);
        const currentState = get();
        if (!hasTaskStateToken(currentState, taskStateToken)) {
          return null;
        }
        const currentTasks = currentState.tasks;
        set({
          currentTask: task,
          tasks: [task, ...currentTasks.filter((t) => t.id !== task.id)],
          isLoading: task.status === 'queued',
        });
        void myboteam.logEvent({
          level: 'info',
          message: task.status === 'queued' ? 'UI task queued' : 'UI task started',
          context: { taskId: task.id, status: task.status },
        });
        return task;
      } catch (err) {
        if (!hasTaskStateToken(get(), taskStateToken)) {
          return null;
        }
        set({
          error: err instanceof Error ? err.message : 'Failed to start task',
          isLoading: false,
        });
        void myboteam.logEvent({
          level: 'error',
          message: 'UI task start failed',
          context: { error: err instanceof Error ? err.message : String(err) },
        });
        return null;
      }
    },

    sendFollowUp: async (message: string, attachments?: FileAttachmentInfo[]): Promise<boolean> => {
      const myboteam = getMyBoTeam();
      const { currentTask, startTask } = get();
      const taskStateToken = get()._taskStateToken;
      if (!currentTask) {
        set({ error: 'No active task to continue' });
        void myboteam.logEvent({ level: 'warn', message: 'UI follow-up failed: no active task' });
        return false;
      }
      const sessionId = currentTask.result?.sessionId || currentTask.sessionId;
      if (!sessionId && currentTask.status === 'interrupted') {
        void myboteam.logEvent({
          level: 'info',
          message: 'UI follow-up: starting fresh task (no session from interrupted task)',
          context: { taskId: currentTask.id },
        });
        const newTask = await startTask({ prompt: message, files: attachments });
        return newTask !== null;
      }
      if (!sessionId) {
        set({ error: 'No session to continue - please start a new task' });
        void myboteam.logEvent({
          level: 'warn',
          message: 'UI follow-up failed: missing session',
          context: { taskId: currentTask.id },
        });
        return false;
      }
      const userMessage = {
        id: createMessageId(),
        type: 'user' as const,
        content: message,
        timestamp: new Date().toISOString(),
        attachments: attachments
          ? attachments.map((a) => ({ type: 'json' as const, data: 'placeholder', label: a.name }))
          : undefined,
      };
      const taskId = currentTask.id;
      set((state) => ({
        isLoading: true,
        error: null,
        currentTask: state.currentTask
          ? {
              ...state.currentTask,
              status: 'running',
              result: undefined,
              messages: [...state.currentTask.messages, userMessage],
            }
          : null,
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'running' as TaskStatus } : t,
        ),
      }));
      try {
        void myboteam.logEvent({
          level: 'info',
          message: 'UI follow-up sent',
          context: { taskId: currentTask.id, message, attachments: attachments?.length },
        });
        const task = await myboteam.resumeSession(sessionId, message, currentTask.id, attachments);
        if (!hasTaskStateToken(get(), taskStateToken)) {
          return false;
        }
        set((state) => ({
          currentTask: state.currentTask ? { ...state.currentTask, status: task.status } : null,
          isLoading: task.status === 'queued',
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)),
        }));
        return true;
      } catch (err) {
        if (!hasTaskStateToken(get(), taskStateToken)) {
          return false;
        }
        set((state) => ({
          error: err instanceof Error ? err.message : 'Failed to send message',
          isLoading: false,
          currentTask: state.currentTask ? { ...state.currentTask, status: 'failed' } : null,
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'failed' as TaskStatus } : t,
          ),
        }));
        void myboteam.logEvent({
          level: 'error',
          message: 'UI follow-up failed',
          context: {
            taskId: currentTask.id,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        return false;
      }
    },

    ...createTaskLifecycleActions(set, get),
    ...createTaskPermissionActions(set, get),
    ...createTaskUpdateActions(set, get),
  };
}
