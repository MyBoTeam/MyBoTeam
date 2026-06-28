import type { Task, TaskFilters, TaskTodo } from '@myboteam/types';
import type Database from 'better-sqlite3';
import { NotFoundError } from '../errors.js';
import { type createChildLogger, logOperation } from '../logger.js';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function createTask(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { agent_id: string; title: string; status?: string },
): Task {
  return logOperation(
    log,
    'createTask',
    () => {
      const id = uuid();
      const ts = now();
      const status = data.status ?? 'pending';
      db.prepare(
        `INSERT INTO task (id, agent_id, title, status, verification_status, continuation_count, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, 0, ?, ?)`,
      ).run(id, data.agent_id, data.title, status, ts, ts);
      return getTask(db, log, id) as Task;
    },
    { agent_id: data.agent_id },
  );
}

export function getTask(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): Task | null {
  return logOperation(
    log,
    'getTask',
    () => {
      const row = db.prepare('SELECT * FROM task WHERE id = ?').get(id) as Task | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listTasks(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  filters?: TaskFilters,
): Task[] {
  return logOperation(
    log,
    'listTasks',
    () => {
      let sql = 'SELECT * FROM task';
      const conditions: string[] = [];
      const values: string[] = [];
      if (filters?.agent_id) {
        conditions.push('agent_id = ?');
        values.push(filters.agent_id);
      }
      if (filters?.status) {
        conditions.push('status = ?');
        values.push(filters.status);
      }
      if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ' ORDER BY created_at';
      return db.prepare(sql).all(...values) as Task[];
    },
    { filters },
  );
}

export function listTasksByAgent(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  agentId: string,
): Task[] {
  return listTasks(db, log, { agent_id: agentId });
}

export function updateTask(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: Partial<Omit<Task, 'id' | 'created_at'>>,
): Task {
  return logOperation(
    log,
    'updateTask',
    () => {
      const existing = getTask(db, log, id);
      if (!existing) throw new NotFoundError('Task', id);
      const ts = now();
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      fields.push('updated_at = ?');
      values.push(ts);
      values.push(id);
      db.prepare(`UPDATE task SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return getTask(db, log, id) as Task;
    },
    { id },
  );
}

export function deleteTask(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteTask',
    () => {
      const existing = getTask(db, log, id);
      if (!existing) throw new NotFoundError('Task', id);
      db.prepare('DELETE FROM task WHERE id = ?').run(id);
    },
    { id },
  );
}

export function createTaskTodo(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  data: { task_id: string; description: string },
): TaskTodo {
  return logOperation(
    log,
    'createTaskTodo',
    () => {
      const id = uuid();
      const ts = now();
      db.prepare(
        `INSERT INTO task_todo (id, task_id, description, is_completed, created_at) VALUES (?, ?, ?, 0, ?)`,
      ).run(id, data.task_id, data.description, ts);
      return getTaskTodo(db, log, id) as TaskTodo;
    },
    { task_id: data.task_id },
  );
}

export function getTaskTodo(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): TaskTodo | null {
  return logOperation(
    log,
    'getTaskTodo',
    () => {
      const row = db.prepare('SELECT * FROM task_todo WHERE id = ?').get(id) as
        | TaskTodo
        | undefined;
      return row ?? null;
    },
    { id },
  );
}

export function listTaskTodos(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  taskId: string,
): TaskTodo[] {
  return logOperation(
    log,
    'listTaskTodos',
    () => {
      return db
        .prepare('SELECT * FROM task_todo WHERE task_id = ? ORDER BY created_at')
        .all(taskId) as TaskTodo[];
    },
    { task_id: taskId },
  );
}

export function updateTaskTodo(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
  data: { is_completed?: number },
): TaskTodo {
  return logOperation(
    log,
    'updateTaskTodo',
    () => {
      const existing = getTaskTodo(db, log, id);
      if (!existing) throw new NotFoundError('TaskTodo', id);
      if (data.is_completed !== undefined) {
        db.prepare('UPDATE task_todo SET is_completed = ? WHERE id = ?').run(data.is_completed, id);
      }
      return getTaskTodo(db, log, id) as TaskTodo;
    },
    { id },
  );
}

export function deleteTaskTodo(
  db: Database.Database,
  log: ReturnType<typeof createChildLogger>,
  id: string,
): void {
  logOperation(
    log,
    'deleteTaskTodo',
    () => {
      const existing = getTaskTodo(db, log, id);
      if (!existing) throw new NotFoundError('TaskTodo', id);
      db.prepare('DELETE FROM task_todo WHERE id = ?').run(id);
    },
    { id },
  );
}
