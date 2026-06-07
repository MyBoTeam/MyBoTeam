import type { TaskUpdateEvent } from '@myboteam/agent-core/common';
import { useEffect } from 'react';
import type { DebugLogEntry } from '@/pages/conversation/components/DebugPanel';
import type { getMyBoTeam } from '@/config/myboteam';
import { useTaskStore } from '@/stores/taskStore';

type MyBoTeam = ReturnType<typeof getMyBoTeam>;

interface UseExecutionEventsOptions {
  id: string | undefined;
  myboteam: MyBoTeam;
  addTaskUpdate: (event: TaskUpdateEvent) => void;
  addTaskUpdateBatch: (event: {
    taskId: string;
    messages: import('@myboteam/agent-core/common').TaskMessage[];
  }) => void;
  updateTaskStatus: (
    taskId: string,
    status: import('@myboteam/agent-core/common').TaskStatus,
  ) => void;
  setPermissionRequest: (req: import('@myboteam/agent-core/common').PermissionRequest) => void;
  setCurrentTool: (tool: string | null) => void;
  setCurrentToolInput: (input: unknown) => void;
  clearStartupStage: (taskId: string) => void;
  setDebugLogs: React.Dispatch<React.SetStateAction<DebugLogEntry[]>>;
  loadTaskById: (id: string) => Promise<void>;
}

export function useExecutionEvents(opts: UseExecutionEventsOptions) {
  const {
    id,
    myboteam,
    addTaskUpdate,
    addTaskUpdateBatch,
    updateTaskStatus,
    setPermissionRequest,
    setCurrentTool,
    setCurrentToolInput,
    clearStartupStage,
    setDebugLogs,
    loadTaskById,
  } = opts;

  useEffect(() => {
    if (id) {
      loadTaskById(id);
      setDebugLogs([]);
      setCurrentTool(null);
      setCurrentToolInput(null);
      myboteam.getTodosForTask(id).then((todos) => {
        useTaskStore.getState().setTodos(id, todos);
      });
    }

    const unsubscribeTask = myboteam.onTaskUpdate((event) => {
      addTaskUpdate(event);
      if (event.taskId === id && event.type === 'message' && event.message?.type === 'tool') {
        const toolName =
          event.message.toolName || event.message.content?.match(/Using tool: (\w+)/)?.[1];
        if (toolName) {
          setCurrentTool(toolName);
          setCurrentToolInput(event.message.toolInput);
        }
      }
      if (event.taskId === id && event.type === 'message' && event.message?.type === 'assistant') {
        setCurrentTool(null);
        setCurrentToolInput(null);
        if (id) {
          clearStartupStage(id);
        }
      }
      if (event.taskId === id && (event.type === 'complete' || event.type === 'error')) {
        setCurrentTool(null);
        setCurrentToolInput(null);
      }
    });

    const unsubscribeTaskBatch = myboteam.onTaskUpdateBatch?.((event) => {
      if (event.messages?.length) {
        addTaskUpdateBatch(event);
        if (event.taskId === id) {
          const lastMsg = event.messages[event.messages.length - 1];
          if (lastMsg.type === 'assistant') {
            setCurrentTool(null);
            setCurrentToolInput(null);
            if (id) {
              clearStartupStage(id);
            }
          } else if (lastMsg.type === 'tool') {
            const toolName = lastMsg.toolName || lastMsg.content?.match(/Using tool: (\w+)/)?.[1];
            if (toolName) {
              setCurrentTool(toolName);
              setCurrentToolInput(lastMsg.toolInput);
            }
          }
        }
      }
    });

    const unsubscribePermission = myboteam.onPermissionRequest((request) => {
      setPermissionRequest(request);
    });

    const unsubscribeStatusChange = myboteam.onTaskStatusChange?.((data) => {
      if (data.taskId === id) {
        updateTaskStatus(data.taskId, data.status);
      }
    });

    const unsubscribeDebugLog = myboteam.onDebugLog((log) => {
      const entry = log as DebugLogEntry;
      if (entry.taskId === id) {
        setDebugLogs((prev) => [...prev, entry]);
      }
    });

    const unsubscribeDaemonReconnected = myboteam.onDaemonReconnected(() => {
      if (id) {
        loadTaskById(id);
      }
    });

    const unsubscribeDaemonReconnectFailed = myboteam.onDaemonReconnectFailed?.(() => {
      if (id) {
        const state = useTaskStore.getState();
        if (state.currentTask?.id === id && state.currentTask.status === 'running') {
          updateTaskStatus(id, 'failed');
        }
      }
    });

    return () => {
      unsubscribeTask();
      unsubscribeTaskBatch?.();
      unsubscribePermission();
      unsubscribeStatusChange?.();
      unsubscribeDebugLog();
      unsubscribeDaemonReconnected();
      unsubscribeDaemonReconnectFailed?.();
    };
  }, [
    id,
    loadTaskById,
    addTaskUpdate,
    addTaskUpdateBatch,
    updateTaskStatus,
    setPermissionRequest,
    setDebugLogs,
    setCurrentToolInput,
    setCurrentTool,
    myboteam.onTaskUpdateBatch,
    myboteam.onPermissionRequest,
    myboteam.onTaskUpdate,
    myboteam.onDebugLog,
    myboteam.getTodosForTask,
    myboteam.onTaskStatusChange,
    myboteam.onDaemonReconnected,
    myboteam.onDaemonReconnectFailed,
    clearStartupStage,
  ]);
}
