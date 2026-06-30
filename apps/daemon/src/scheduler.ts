import { createChildLogger } from '@myboteam/agent-core/daemon';

const log = createChildLogger('scheduler');

export interface Scheduler {
  stop: () => void;
  isRunning: () => boolean;
}

export function createScheduler(): Scheduler {
  let running = true;

  return {
    stop: () => {
      if (!running) {
        log.warn('Scheduler already stopped');
        return;
      }
      running = false;
      log.info('Scheduler stopped');
    },

    isRunning: () => running,
  };
}
