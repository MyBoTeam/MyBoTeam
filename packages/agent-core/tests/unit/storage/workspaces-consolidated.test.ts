import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

type DbModule = typeof import('../../../src/storage/database.js');
type WorkspacesModule = typeof import('../../../src/storage/repositories/workspaces.js');
type KnowledgeNotesModule = typeof import('../../../src/storage/repositories/knowledgeNotes.js');

describe('workspaces + knowledgeNotes repositories (consolidated DB)', () => {
  let dbModule: DbModule | null = null;
  let wsModule: WorkspacesModule | null = null;
  let knModule: KnowledgeNotesModule | null = null;
  let testDir: string;

  beforeAll(async () => {
    dbModule = await import('../../../src/storage/database.js');
    wsModule = await import('../../../src/storage/repositories/workspaces.js');
    knModule = await import('../../../src/storage/repositories/knowledgeNotes.js');
  });

  beforeEach(async () => {
    if (dbModule) {
      try {
        dbModule.closeDatabase();
      } catch {}
    }
    testDir = path.join(
      os.tmpdir(),
      `ws-consol-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(testDir, { recursive: true });
    if (dbModule) {
      const dbPath = path.join(testDir, 'main.db');
      await dbModule.initializeDatabase({ databasePath: dbPath, runMigrations: true });
    }
  });

  afterEach(() => {
    if (dbModule) {
      try {
        dbModule.closeDatabase();
      } catch {}
    }
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('createDefaultWorkspace, listWorkspaces, getWorkspace round-trip', () => {
    if (!wsModule) return;
    const def = wsModule.createDefaultWorkspace();
    expect(def.isDefault).toBe(true);
    const all = wsModule.listWorkspaces();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(def.id);
    const got = wsModule.getWorkspace(def.id);
    expect(got?.name).toBe(def.name);
  });

  it('setActiveWorkspaceId / getActiveWorkspaceId via workspace_meta', () => {
    if (!wsModule) return;
    const def = wsModule.createDefaultWorkspace();
    wsModule.setActiveWorkspaceId(def.id);
    expect(wsModule.getActiveWorkspaceId()).toBe(def.id);
  });

  it('createWorkspace / updateWorkspace / deleteWorkspace CRUD', () => {
    if (!wsModule) return;
    wsModule.createDefaultWorkspace();
    const ws = wsModule.createWorkspace({ name: 'Projects', color: '#f00' });
    expect(ws.color).toBe('#f00');
    const updated = wsModule.updateWorkspace(ws.id, { description: 'All projects' });
    expect(updated?.description).toBe('All projects');
    const removed = wsModule.deleteWorkspace(ws.id);
    expect(removed).toBe(true);
    expect(wsModule.getWorkspace(ws.id)).toBeNull();
  });

  it('knowledge_notes CRUD + cascade delete when workspace removed', () => {
    if (!wsModule || !knModule) return;
    const def = wsModule.createDefaultWorkspace();
    const ws = wsModule.createWorkspace({ name: 'Temp' });
    const note = knModule.createKnowledgeNote({
      workspaceId: ws.id,
      type: 'context',
      content: 'hello',
    });
    expect(note.content).toBe('hello');
    const listed = knModule.listKnowledgeNotes(ws.id);
    expect(listed).toHaveLength(1);

    wsModule.deleteWorkspace(ws.id);
    const after = knModule.listKnowledgeNotes(ws.id);
    expect(after).toHaveLength(0);

    expect(wsModule.getWorkspace(def.id)).not.toBeNull();
  });

  it('no src/ file imports from workspace-meta-db', async () => {
    const srcDir = path.resolve(__dirname, '../../../src');
    const offenders: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          const content = fs.readFileSync(full, 'utf8');

          if (full.endsWith('v030-workspace-meta-consolidation.ts')) continue;
          if (
            content.includes('workspace-meta-db') ||
            content.includes('getMetaDatabase') ||
            content.includes('initializeMetaDatabase')
          ) {
            offenders.push(full);
          }
        }
      }
    }
    walk(srcDir);
    expect(offenders).toEqual([]);
  });
});
