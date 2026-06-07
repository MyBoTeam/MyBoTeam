import { flushAndCleanupBatcher } from '../../opencode/message-processor.js';
import { stopAzureFoundryProxy } from '../../opencode/proxies/azure-foundry-proxy.js';
import { stopMoonshotProxy } from '../../opencode/proxies/moonshot-proxy.js';
import { createConsoleLogger } from '../../utils/logging.js';
import type { ManagedTask, QueuedTask } from './task-manager-types.js';

const log = createConsoleLogger({ prefix: 'TaskManager' });

export function cleanupTask(taskId: string, activeTasks: Map<string, ManagedTask>): void {
  const managedTask = activeTasks.get(taskId);
  if (managedTask) {
    log.info(`[TaskManager] Cleaning up task ${taskId}`);
    managedTask.cleanup();
    activeTasks.delete(taskId);
    log.info(`[TaskManager] Task ${taskId} cleaned up. Active tasks: ${activeTasks.size}`);
  }
}

export function dispose(taskQueue: QueuedTask[], activeTasks: Map<string, ManagedTask>): void {
  log.info(
    `[TaskManager] Disposing all tasks (${activeTasks.size} active, ${taskQueue.length} queued)`,
  );

  taskQueue.length = 0;

  for (const [taskId, managedTask] of activeTasks) {
    try {
      flushAndCleanupBatcher(taskId);
      managedTask.cleanup();
    } catch (error) {
      log.error(`[TaskManager] Error cleaning up task ${taskId}: ${error}`);
    }
  }

  activeTasks.clear();

  stopAzureFoundryProxy().catch((err) => {
    log.error(`[TaskManager] Failed to stop Azure Foundry proxy: ${err}`);
  });
  stopMoonshotProxy().catch((err) => {
    log.error(`[TaskManager] Failed to stop Moonshot proxy: ${err}`);
  });

  log.info('[TaskManager] All tasks disposed');
}
