import type { TaskMessage, TaskStatus, TaskUpdateEvent } from '@myboteam/agent-core';
import { upsertTaskMessages } from '@myboteam/agent-core';
import { getMyBoTeam } from '@/config/myboteam';
import type { TaskState } from './taskStore';

type SetFn = (partial: Partial<TaskState> | ((state: TaskState) => Partial<TaskState>)) => void;
type GetFn = () => TaskState;

export function createTaskUpdateActions(set: SetFn, _get: GetFn) {
  return {
    addTaskUpdate: (event: TaskUpdateEvent) => {
      const myboteam = getMyBoTeam();
      void myboteam.logEvent({
        level: 'debug',
        message: 'UI task update received',
        context: { ...event },
      });
      set((state) => {
        const isCurrentTask = state.currentTask?.id === event.taskId;
        let updatedCurrentTask = state.currentTask;
        let updatedTasks = state.tasks;
        let newStatus: TaskStatus | null = null;
        if (event.type === 'message' && event.message && isCurrentTask && state.currentTask) {
          updatedCurrentTask = {
            ...state.currentTask,
            messages: upsertTaskMessages(state.currentTask.messages, [event.message]),
          };
        }
        if (event.type === 'complete' && event.result) {
          if (event.result.status === 'success') {
            newStatus = 'completed';
          } else if (event.result.status === 'interrupted') {
            newStatus = 'interrupted';
          } else {
            newStatus = 'failed';
          }
          if (isCurrentTask && state.currentTask) {
            updatedCurrentTask = {
              ...state.currentTask,
              status: newStatus,
              result: event.result,
              completedAt: newStatus === 'interrupted' ? undefined : new Date().toISOString(),
              sessionId: event.result.sessionId || state.currentTask.sessionId,
            };
          }
        }
        if (event.type === 'error') {
          newStatus = 'failed';
          if (isCurrentTask && state.currentTask) {
            updatedCurrentTask = {
              ...state.currentTask,
              status: newStatus,
              result: { status: 'error', error: event.error },
            };
          }
        }
        if (newStatus) {
          const finalStatus = newStatus;
          updatedTasks = state.tasks.map((t) => {
            if (t.id !== event.taskId) return t;
            const taskUpdate: Partial<typeof t> = { status: finalStatus };
            if (isCurrentTask && updatedCurrentTask) {
              taskUpdate.messages = updatedCurrentTask.messages;
              if ('result' in updatedCurrentTask) taskUpdate.result = updatedCurrentTask.result;
              if ('sessionId' in updatedCurrentTask && updatedCurrentTask.sessionId != null) {
                taskUpdate.sessionId = updatedCurrentTask.sessionId;
              }
              if ('completedAt' in updatedCurrentTask && updatedCurrentTask.completedAt != null) {
                taskUpdate.completedAt = updatedCurrentTask.completedAt;
              }
            }
            return { ...t, ...taskUpdate };
          });
        }
        let shouldClearTodos = false;
        if (
          (event.type === 'complete' || event.type === 'error') &&
          state.todosTaskId === event.taskId
        ) {
          const isInterrupted = event.type === 'complete' && event.result?.status === 'interrupted';
          shouldClearTodos = !isInterrupted;
        }

        const wasQueued =
          state.currentTask?.id === event.taskId && state.currentTask?.status === 'queued';
        const shouldClearLoading = isCurrentTask && (newStatus !== null || wasQueued);
        return {
          currentTask: updatedCurrentTask,
          tasks: updatedTasks,
          ...(shouldClearLoading ? { isLoading: false } : {}),
          ...(shouldClearTodos ? { todos: [], todosTaskId: null } : {}),
        };
      });
    },

    addTaskUpdateBatch: (event: { taskId: string; messages: TaskMessage[] }) => {
      const myboteam = getMyBoTeam();
      void myboteam.logEvent({
        level: 'debug',
        message: 'UI task batch update received',
        context: { taskId: event.taskId, messageCount: event.messages.length },
      });
      set((state) => {
        if (!state.currentTask || state.currentTask.id !== event.taskId) {
          return state;
        }

        const updatedMessages = upsertTaskMessages(state.currentTask.messages, event.messages);
        const updatedTask = {
          ...state.currentTask,
          messages: updatedMessages,
        };

        const updatedTasks = state.tasks.map((t) =>
          t.id === event.taskId ? { ...t, messages: updatedMessages } : t,
        );
        return { currentTask: updatedTask, tasks: updatedTasks, isLoading: false };
      });
    },

    updateTaskStatus: (taskId: string, status: TaskStatus) => {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task,
        ),
        currentTask:
          state.currentTask?.id === taskId
            ? { ...state.currentTask, status, updatedAt: new Date().toISOString() }
            : state.currentTask,
      }));
    },

    setTaskSummary: (taskId: string, summary: string) => {
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, summary } : task)),
        currentTask:
          state.currentTask?.id === taskId ? { ...state.currentTask, summary } : state.currentTask,
      }));
    },
  };
}
