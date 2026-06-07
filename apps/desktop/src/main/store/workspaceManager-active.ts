import { getDaemonClient } from '../daemon-bootstrap';
import { _state } from './workspaceManager-state';

export function getActiveWorkspace(): string | null {
  return _state.activeWorkspaceId;
}

export async function switchWorkspace(workspaceId: string): Promise<boolean> {
  const result = await getDaemonClient().call('workspace.setActive', { workspaceId });
  if (result.changed) {
    _state.activeWorkspaceId = workspaceId;
  }
  return result.changed;
}
