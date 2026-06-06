import type { MyboteamRuntime, StorageAPI } from '@myboteam/agent-core';
import type { TaskConfigBuilderOptions } from '../task-config-builder.js';

export const READY_TIMEOUT_MS = 15_000;
export const SERVER_URL_WAIT_TIMEOUT_MS = 10_000;
export const TASK_RUNTIME_IDLE_CLEANUP_MS = 60_000;

export interface TrackedOpencodeServerHandle {
  url: string;
  close(): void;
}

export interface ServerManagerDeps extends TaskConfigBuilderOptions {
  storage: StorageAPI;
  myboteamRuntime?: MyboteamRuntime;
}
