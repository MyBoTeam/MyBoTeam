import type { TaskConfig } from '../../common/types/task.js';
import type { AdapterOptions, TaskRuntimeAdapter } from './adapter-types.js';
import { OpenCodeAdapter } from './open-code-adapter.js';
import { PiTaskRuntimeAdapter } from '@myboteam/pi-agent-core';

export type TaskRuntimeKind = 'opencode' | 'pi';

export interface TaskRuntimeAdapterFactoryOptions {
  adapterOptions: AdapterOptions;
  taskId: string;
  taskConfig?: Pick<TaskConfig, 'source'>;
  runtimeOverride?: TaskRuntimeKind;
}

export function selectTaskRuntime(_taskConfig?: Pick<TaskConfig, 'source'>): TaskRuntimeKind {
  return 'pi';
}

export function createTaskRuntimeAdapter({
  adapterOptions,
  taskId,
  taskConfig,
  runtimeOverride,
}: TaskRuntimeAdapterFactoryOptions): TaskRuntimeAdapter {
  const runtime = runtimeOverride ?? selectTaskRuntime(taskConfig);

  if (runtime === 'pi') {
    return new PiTaskRuntimeAdapter({ taskId }) as unknown as TaskRuntimeAdapter;
  }

  return new OpenCodeAdapter(adapterOptions, taskId) as unknown as TaskRuntimeAdapter;
}
