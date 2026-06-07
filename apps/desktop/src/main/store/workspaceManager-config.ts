import type { WorkspaceChangePayload } from '@myboteam/agent-core/desktop-main';
import { getDaemonClient } from '../daemon-bootstrap';
import { _state, log } from './workspaceManager-state';

async function refreshCacheFromEvent(payload: WorkspaceChangePayload): Promise<void> {
  const client = getDaemonClient();
  try {
    switch (payload.kind) {
      case 'workspace.created':
      case 'workspace.updated': {
        const ws = await client.call('workspace.get', { workspaceId: payload.workspaceId });
        if (ws) {
          _state.workspaces.set(ws.id, ws);
        }
        break;
      }
      case 'workspace.deleted':
        _state.workspaces.delete(payload.workspaceId);
        break;
      case 'workspace.activeChanged':
        _state.activeWorkspaceId = payload.workspaceId;
        break;
      case 'knowledgeNote.changed':
        break;
    }
  } catch (err) {
    log('WARN', '[WorkspaceManager] Cache refresh failed', { err: String(err) });
  }
}

export function isInitialized(): boolean {
  return _state.initialized;
}

export async function initialize(): Promise<void> {
  log('INFO', '[WorkspaceManager] Initializing...');

  const client = getDaemonClient();
  const list = await client.call('workspace.list');
  _state.workspaces.clear();
  for (const ws of list) {
    _state.workspaces.set(ws.id, ws);
  }

  const active = await client.call('workspace.getActive');
  _state.activeWorkspaceId = active?.id ?? null;

  client.onNotification('workspace.changed', (payload) => {
    void refreshCacheFromEvent(payload);
  });

  _state.initialized = true;
  log(
    'INFO',
    `[WorkspaceManager] Initialized (${_state.workspaces.size} workspaces, active=${_state.activeWorkspaceId ?? 'none'})`,
  );
}

export function close(): void {
  log('INFO', '[WorkspaceManager] Closing...');
  _state.activeWorkspaceId = null;
  _state.workspaces.clear();
  _state.initialized = false;
}
