import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceDeleteResult,
  WorkspaceUpdateInput,
} from '@myboteam/agent-core/desktop-main';
import { getDaemonClient } from '../daemon-bootstrap';
import { _state } from './workspaceManager-state';

export function getWorkspace(workspaceId: string): Workspace | null {
  return _state.workspaces.get(workspaceId) ?? null;
}

export function listWorkspaces(): Workspace[] {
  return Array.from(_state.workspaces.values());
}

export async function createWorkspace(input: WorkspaceCreateInput): Promise<Workspace> {
  const ws = await getDaemonClient().call('workspace.create', { input });
  _state.workspaces.set(ws.id, ws);
  return ws;
}

export async function updateWorkspace(
  workspaceId: string,
  input: WorkspaceUpdateInput,
): Promise<Workspace | null> {
  const ws = await getDaemonClient().call('workspace.update', { workspaceId, input });
  if (ws) {
    _state.workspaces.set(ws.id, ws);
  }
  return ws;
}

export async function deleteWorkspace(workspaceId: string): Promise<WorkspaceDeleteResult> {
  const result = await getDaemonClient().call('workspace.delete', { workspaceId });
  if (result.deleted) {
    _state.workspaces.delete(workspaceId);
  }
  if (result.newActiveWorkspaceId !== undefined) {
    _state.activeWorkspaceId = result.newActiveWorkspaceId;
  }
  return result;
}
