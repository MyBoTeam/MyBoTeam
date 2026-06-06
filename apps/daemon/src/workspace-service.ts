import { EventEmitter } from 'node:events';
import type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceDeleteResult,
  WorkspaceSetActiveResult,
  WorkspaceUpdateInput,
} from '@myboteam/agent-core';
import {
  createDefaultWorkspace,
  createKnowledgeNote,
  createWorkspaceRecord,
  deleteKnowledgeNote,
  deleteWorkspaceRecord,
  getActiveWorkspaceId,
  getKnowledgeNote,
  getWorkspace,
  listKnowledgeNotes,
  listWorkspaces,
  setActiveWorkspaceId,
  updateKnowledgeNote,
  updateWorkspaceRecord,
} from '@myboteam/agent-core';

export { WORKSPACE_CHANGED, type WorkspaceChangePayload } from './workspace-types.js';

export class WorkspaceService extends EventEmitter {
  ensureInitialized(): void {
    const defaultWs = createDefaultWorkspace();
    const activeId = getActiveWorkspaceId();
    if (!activeId || !getWorkspace(activeId)) {
      setActiveWorkspaceId(defaultWs.id);
    }
  }

  list(): Workspace[] {
    return listWorkspaces();
  }

  get(workspaceId: string): Workspace | null {
    return getWorkspace(workspaceId) ?? null;
  }

  getActive(): Workspace | null {
    const id = getActiveWorkspaceId();
    if (!id) {
      return null;
    }
    return getWorkspace(id) ?? null;
  }

  setActive(workspaceId: string): WorkspaceSetActiveResult {
    const target = getWorkspace(workspaceId);
    if (!target) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    if (getActiveWorkspaceId() === workspaceId) {
      return { changed: false };
    }
    setActiveWorkspaceId(workspaceId);
    this.emit('workspace.changed', { kind: 'workspace.activeChanged', workspaceId });
    return { changed: true };
  }

  create(input: WorkspaceCreateInput): Workspace {
    const ws = createWorkspaceRecord(input);
    this.emit('workspace.changed', { kind: 'workspace.created', workspaceId: ws.id });
    return ws;
  }

  update(workspaceId: string, input: WorkspaceUpdateInput): Workspace | null {
    const ws = updateWorkspaceRecord(workspaceId, input);
    if (ws) {
      this.emit('workspace.changed', { kind: 'workspace.updated', workspaceId });
    }
    return ws ?? null;
  }

  delete(workspaceId: string): WorkspaceDeleteResult {
    const target = getWorkspace(workspaceId);
    if (!target || target.isDefault) {
      return { deleted: false };
    }

    let newActiveWorkspaceId: string | undefined;
    if (getActiveWorkspaceId() === workspaceId) {
      const all = listWorkspaces();
      const defaultWs = all.find((w) => w.isDefault);
      const fallback = defaultWs ?? all.find((w) => w.id !== workspaceId);
      if (fallback) {
        setActiveWorkspaceId(fallback.id);
        newActiveWorkspaceId = fallback.id;
        this.emit('workspace.changed', {
          kind: 'workspace.activeChanged',
          workspaceId: fallback.id,
        });
      }
    }

    const deleted = deleteWorkspaceRecord(workspaceId);
    if (!deleted) {
      return { deleted: false, newActiveWorkspaceId };
    }

    this.emit('workspace.changed', { kind: 'workspace.deleted', workspaceId });
    return { deleted: true, newActiveWorkspaceId };
  }

  listKnowledgeNotes(workspaceId: string): KnowledgeNote[] {
    return listKnowledgeNotes(workspaceId);
  }

  getKnowledgeNote(noteId: string, workspaceId: string): KnowledgeNote | null {
    return getKnowledgeNote(noteId, workspaceId) ?? null;
  }

  createKnowledgeNote(input: KnowledgeNoteCreateInput): KnowledgeNote {
    const note = createKnowledgeNote(input);
    this.emit('workspace.changed', {
      kind: 'knowledgeNote.changed',
      workspaceId: note.workspaceId,
    });
    return note;
  }

  updateKnowledgeNote(
    noteId: string,
    workspaceId: string,
    input: KnowledgeNoteUpdateInput,
  ): KnowledgeNote | null {
    const note = updateKnowledgeNote(noteId, workspaceId, input);
    if (note) {
      this.emit('workspace.changed', {
        kind: 'knowledgeNote.changed',
        workspaceId: note.workspaceId,
      });
    }
    return note ?? null;
  }

  deleteKnowledgeNote(noteId: string, workspaceId: string): void {
    const deleted = deleteKnowledgeNote(noteId, workspaceId);
    if (deleted) {
      this.emit('workspace.changed', { kind: 'knowledgeNote.changed', workspaceId });
    }
  }
}
