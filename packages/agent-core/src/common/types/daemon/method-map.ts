import type { PermissionResponse } from '../permission.js';
import type { Task, TaskStatus } from '../task.js';
import type { TodoItem } from '../todo.js';
import type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '../workspace.js';
import type { WorkspaceDeleteResult, WorkspaceSetActiveResult } from './event-types.js';
import type { HealthCheckResult, WhatsAppDaemonConfig } from './json-rpc-types.js';
import type { DaemonMethodMapExtras } from './method-map-extras.js';
import type {
  ScheduledTask,
  SessionResumeParams,
  StorageDeleteTaskParams,
  TaskCancelScheduledParams,
  TaskIdParams,
  TaskListParams,
  TaskScheduleParams,
  TaskStartParams,
} from './task-types.js';

interface DaemonMethodMapCore {
  'task.start': { params: TaskStartParams; result: Task };
  'task.cancel': { params: TaskIdParams; result: undefined };
  'task.interrupt': { params: TaskIdParams; result: undefined };
  'task.list': { params: TaskListParams | undefined; result: Task[] };
  'task.get': { params: TaskIdParams; result: Task | null };
  'task.delete': { params: StorageDeleteTaskParams; result: undefined };
  'task.clearHistory': { params: undefined; result: undefined };
  'task.getTodos': { params: TaskIdParams; result: TodoItem[] };
  'task.getActiveCount': { params: undefined; result: number };
  'task.status': {
    params: TaskIdParams;
    result: { taskId: string; status: TaskStatus; prompt: string; createdAt: string } | null;
  };

  'session.resume': { params: SessionResumeParams; result: Task };
  'permission.respond': { params: PermissionResponse; result: undefined };

  'task.schedule': { params: TaskScheduleParams; result: ScheduledTask };
  'task.listScheduled': { params: { workspaceId?: string } | undefined; result: ScheduledTask[] };
  'task.cancelScheduled': { params: TaskCancelScheduledParams; result: undefined };
  'task.setScheduleEnabled': {
    params: { scheduleId: string; enabled: boolean };
    result: undefined;
  };

  'whatsapp.connect': { params: undefined; result: undefined };
  'whatsapp.disconnect': { params: undefined; result: undefined };
  'whatsapp.getConfig': { params: undefined; result: WhatsAppDaemonConfig | null };
  'whatsapp.setEnabled': { params: { enabled: boolean }; result: undefined };

  'daemon.ping': { params: undefined; result: { status: 'ok'; uptime: number; buildId?: string } };
  'daemon.shutdown': { params: undefined; result: undefined };
  'health.check': { params: undefined; result: HealthCheckResult };

  'myboteam-ai.connect': {
    params: undefined;
    result: { deviceFingerprint: string; usage: import('../gateway.js').CreditUsage | null };
  };
  'myboteam-ai.get-usage': { params: undefined; result: import('../gateway.js').CreditUsage };
  'myboteam-ai.disconnect': { params: undefined; result: undefined };

  'auth.openai.startLogin': {
    params: undefined;
    result: { sessionId: string; authorizeUrl: string };
  };
  'auth.openai.awaitCompletion': {
    params: { sessionId: string; timeoutMs?: number };
    result: { ok: true; plan: 'free' | 'paid' } | { ok: false; error: string };
  };
  'auth.openai.status': { params: undefined; result: { connected: boolean; expires?: number } };
  'auth.openai.getAccessToken': { params: undefined; result: string | null };

  'workspace.list': { params: undefined; result: Workspace[] };
  'workspace.get': { params: { workspaceId: string }; result: Workspace | null };
  'workspace.getActive': { params: undefined; result: Workspace | null };
  'workspace.setActive': { params: { workspaceId: string }; result: WorkspaceSetActiveResult };
  'workspace.create': { params: { input: WorkspaceCreateInput }; result: Workspace };
  'workspace.update': {
    params: { workspaceId: string; input: WorkspaceUpdateInput };
    result: Workspace | null;
  };
  'workspace.delete': { params: { workspaceId: string }; result: WorkspaceDeleteResult };

  'knowledgeNote.list': { params: { workspaceId: string }; result: KnowledgeNote[] };
  'knowledgeNote.get': {
    params: { noteId: string; workspaceId: string };
    result: KnowledgeNote | null;
  };
  'knowledgeNote.create': { params: { input: KnowledgeNoteCreateInput }; result: KnowledgeNote };
  'knowledgeNote.update': {
    params: { noteId: string; workspaceId: string; input: KnowledgeNoteUpdateInput };
    result: KnowledgeNote | null;
  };
  'knowledgeNote.delete': { params: { noteId: string; workspaceId: string }; result: undefined };
}

export type DaemonMethodMap = DaemonMethodMapCore & DaemonMethodMapExtras;
export type DaemonMethod = keyof DaemonMethodMap;
