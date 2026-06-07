import type { PermissionRequest, PermissionResponse } from '@myboteam/agent-core/common';
import { getMyBoTeam } from '../lib/myboteam';
import { hasTaskStateToken } from './task-state-helpers';
import type { TaskState } from './taskStore';

type SetFn = (partial: Partial<TaskState> | ((state: TaskState) => Partial<TaskState>)) => void;
type GetFn = () => TaskState;

export function createTaskPermissionActions(set: SetFn, get: GetFn) {
  return {
    setPermissionRequest: (request: PermissionRequest) => {
      set((state) => ({
        permissionRequests: { ...state.permissionRequests, [request.taskId]: request },
      }));
    },

    clearPermissionRequest: (taskId: string) => {
      set((state) => {
        const { [taskId]: _, ...rest } = state.permissionRequests;
        return { permissionRequests: rest };
      });
    },

    respondToPermission: async (response: PermissionResponse) => {
      const myboteam = getMyBoTeam();
      const taskStateToken = get()._taskStateToken;

      const requestId = response.requestId;
      void myboteam.logEvent({
        level: 'info',
        message: 'UI permission response',
        context: { ...response },
      });
      await myboteam.respondToPermission(response);
      if (!hasTaskStateToken(get(), taskStateToken)) {
        return;
      }
      set((state) => {
        const existingRequest = state.permissionRequests[response.taskId];

        if (!existingRequest || existingRequest.id !== requestId) {
          return state;
        }
        const { [response.taskId]: _, ...rest } = state.permissionRequests;
        return { permissionRequests: rest };
      });
    },
  };
}
