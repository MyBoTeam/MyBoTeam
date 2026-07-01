import { cleanupAgentProcesses, saveAgentPids } from './agent-pids.js';
import { createChildLogger } from './logger.js';

const log = createChildLogger('agent-tracker');

export interface AgentTracker {
  savePids: (pids: number[]) => void;
  cleanupProcesses: () => number;
}

export function createAgentTracker(dataDir: string): AgentTracker {
  return {
    savePids: (pids: number[]) => {
      saveAgentPids(dataDir, pids);
      log.info(`Saved ${pids.length} agent PID(s)`);
    },

    cleanupProcesses: () => {
      const cleaned = cleanupAgentProcesses(dataDir);
      if (cleaned > 0) {
        log.info(`Cleaned up ${cleaned} agent process(es)`);
      }
      return cleaned;
    },
  };
}
