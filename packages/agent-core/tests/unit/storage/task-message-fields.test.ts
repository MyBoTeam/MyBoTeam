import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('TaskMessage new fields round-trip (v029)', () => {
  let testDir: string;
  let dbPath: string;
  let databaseModule: typeof import('../../../src/storage/database.js') | null = null;
  let repoModule: typeof import('../../../src/storage/repositories/taskHistory.js') | null = null;

  beforeAll(async () => {
    databaseModule = await import('../../../src/storage/database.js');
    repoModule = await import('../../../src/storage/repositories/taskHistory.js');
  });

  beforeEach(() => {
    testDir = path.join(
      os.tmpdir(),
      `msg-fields-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(testDir, { recursive: true });
    dbPath = path.join(testDir, 'test.db');
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (databaseModule) databaseModule.resetDatabaseInstance();
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('persists toolStatus / modelId / providerId via saveTask bulk insert', async () => {
    if (!databaseModule || !repoModule) return;
    await databaseModule.initializeDatabase({ databasePath: dbPath });

    const task = {
      id: 'task-bulk-1',
      prompt: 'do the thing',
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          type: 'tool' as const,
          content: 'bash output',
          toolName: 'bash',
          toolStatus: 'completed' as const,
          timestamp: new Date().toISOString(),
          modelId: 'claude-opus-4-6',
          providerId: 'anthropic',
        },
      ],
    };

    repoModule.saveTask(task);

    const loaded = repoModule.getTask(task.id);
    expect(loaded).toBeDefined();
    expect(loaded!.messages).toHaveLength(1);
    const m = loaded!.messages[0];
    expect(m.toolStatus).toBe('completed');
    expect(m.modelId).toBe('claude-opus-4-6');
    expect(m.providerId).toBe('anthropic');
    expect(m.toolName).toBe('bash');
  });

  it('persists toolStatus=running via addTaskMessage and survives update to completed', async () => {
    if (!databaseModule || !repoModule) return;
    await databaseModule.initializeDatabase({ databasePath: dbPath });

    const taskId = 'task-add-1';
    repoModule.saveTask({
      id: taskId,
      prompt: 'streaming tool',
      status: 'running',
      createdAt: new Date().toISOString(),
      messages: [],
    });

    const firstTimestamp = new Date().toISOString();
    repoModule.addTaskMessage(taskId, {
      id: 'msg-running',
      type: 'tool',
      content: '',
      toolName: 'read',
      toolStatus: 'running',
      timestamp: firstTimestamp,
      modelId: 'gpt-5.4',
      providerId: 'openai',
    });

    const afterRunning = repoModule.getTask(taskId);
    expect(afterRunning!.messages).toHaveLength(1);
    expect(afterRunning!.messages[0].toolStatus).toBe('running');
    expect(afterRunning!.messages[0].modelId).toBe('gpt-5.4');

    repoModule.addTaskMessage(taskId, {
      id: 'msg-running',
      type: 'tool',
      content: 'file contents here',
      toolName: 'read',
      toolStatus: 'completed',

      timestamp: new Date(Date.now() + 5_000).toISOString(),
      modelId: 'gpt-5.4',
      providerId: 'openai',
    });

    const afterCompleted = repoModule.getTask(taskId);
    expect(afterCompleted!.messages).toHaveLength(1);
    expect(afterCompleted!.messages[0].id).toBe('msg-running');
    expect(afterCompleted!.messages[0].toolStatus).toBe('completed');
    expect(afterCompleted!.messages[0].content).toBe('file contents here');

    expect(afterCompleted!.messages[0].timestamp).toBe(firstTimestamp);
  });

  it('accepts messages without new fields (back-compat, NULL columns)', async () => {
    if (!databaseModule || !repoModule) return;
    await databaseModule.initializeDatabase({ databasePath: dbPath });

    const task = {
      id: 'task-back-compat',
      prompt: 'legacy-shape',
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-legacy',
          type: 'assistant' as const,
          content: 'hello',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    repoModule.saveTask(task);
    const loaded = repoModule.getTask(task.id);
    expect(loaded!.messages[0].toolStatus).toBeUndefined();
    expect(loaded!.messages[0].modelId).toBeUndefined();
    expect(loaded!.messages[0].providerId).toBeUndefined();
  });

  it('does not accumulate attachments across repeat addTaskMessage calls (Codex R3 P2)', async () => {
    if (!databaseModule || !repoModule) return;
    await databaseModule.initializeDatabase({ databasePath: dbPath });

    const taskId = 'task-attachment-dedupe';
    repoModule.saveTask({
      id: taskId,
      prompt: 'tool with attachment',
      status: 'running',
      createdAt: new Date().toISOString(),
      messages: [],
    });

    const attachment = {
      type: 'image' as const,
      data: 'data:image/png;base64,iVBORw0KGgo=',
      label: 'screenshot',
    };

    repoModule.addTaskMessage(taskId, {
      id: 'msg-stable',
      type: 'tool',
      content: '',
      toolName: 'dev-browser-mcp',
      toolStatus: 'running',
      timestamp: new Date().toISOString(),
      attachments: [attachment],
    });

    repoModule.addTaskMessage(taskId, {
      id: 'msg-stable',
      type: 'tool',
      content: 'finished',
      toolName: 'dev-browser-mcp',
      toolStatus: 'completed',
      timestamp: new Date().toISOString(),
      attachments: [attachment],
    });

    const loaded = repoModule.getTask(taskId);
    expect(loaded!.messages).toHaveLength(1);

    expect(loaded!.messages[0].attachments).toHaveLength(1);
    expect(loaded!.messages[0].attachments![0].label).toBe('screenshot');
  });

  it('preserves toolStatus=error and round-trips via rowToTask', async () => {
    if (!databaseModule || !repoModule) return;
    await databaseModule.initializeDatabase({ databasePath: dbPath });

    const taskId = 'task-error';
    repoModule.saveTask({
      id: taskId,
      prompt: 'failing tool',
      status: 'failed',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-error',
          type: 'tool',
          content: 'EACCES',
          toolName: 'write',
          toolStatus: 'error',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const loaded = repoModule.getTask(taskId);
    expect(loaded!.messages[0].toolStatus).toBe('error');
  });
});
