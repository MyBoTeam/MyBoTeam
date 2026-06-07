export type {
  DaemonConnectionState,
  DaemonTransport,
} from './daemon/connection-types.js';

export type {
  DaemonMethod,
  DaemonMethodMap,
  TypedJsonRpcNotification,
  TypedJsonRpcRequest,
  TypedJsonRpcResponse,
} from './daemon/daemon-types.js';
export type {
  DaemonNotification,
  DaemonNotificationMap,
  GwsAccountAddInput,
  GwsAccountStatusChangedPayload,
  GwsAccountTokenResult,
  SettingsChangePayload,
  SettingsSnapshot,
  SkillsChangedPayload,
  WorkspaceChangePayload,
  WorkspaceDeleteResult,
  WorkspaceSetActiveResult,
} from './daemon/event-types.js';
export type {
  HealthCheckResult,
  JsonRpcError,
  JsonRpcMessage,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  WhatsAppDaemonConfig,
} from './daemon/json-rpc-types.js';
export { JSON_RPC_ERRORS } from './daemon/json-rpc-types.js';

export type {
  PermissionRespondParams,
  ScheduledTask,
  SessionResumeParams,
  StorageAddTaskMessageParams,
  StorageDeleteTaskParams,
  StorageSaveTaskParams,
  StorageUpdateTaskStatusParams,
  StorageUpdateTaskSummaryParams,
  TaskCancelScheduledParams,
  TaskIdParams,
  TaskListParams,
  TaskScheduleParams,
  TaskSendResponseParams,
  TaskStartParams,
} from './daemon/task-types.js';
