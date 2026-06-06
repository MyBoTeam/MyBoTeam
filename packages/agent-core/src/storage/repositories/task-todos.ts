import type { TodoItem } from '../../common/types/todo.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowsFromResult } from '../query-helpers.js';

interface TodoRow {
  id: number;
  task_id: string;
  todo_id: string;
  content: string;
  status: string;
  priority: string;
  sort_order: number;
}

export function getTodosForTask(taskId: string): TodoItem[] {
  const db = getDatabase();

  const rows = rowsFromResult<TodoRow>(
    db.exec('SELECT * FROM task_todos WHERE task_id = ? ORDER BY sort_order ASC', [taskId]),
  );

  return rows.map((row) => ({
    id: row.todo_id,
    content: row.content,
    status: row.status as TodoItem['status'],
    priority: row.priority as TodoItem['priority'],
  }));
}

export function saveTodosForTask(taskId: string, todos: TodoItem[]): void {
  const db = getDatabase();

  withTransaction(db, () => {
    db.run('DELETE FROM task_todos WHERE task_id = ?', [taskId]);

    todos.forEach((todo, index) => {
      db.run(
        `INSERT INTO task_todos (task_id, todo_id, content, status, priority, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [taskId, todo.id, todo.content, todo.status, todo.priority, index],
      );
    });
  });
  flushDatabase();
}

export function clearTodosForTask(taskId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM task_todos WHERE task_id = ?', [taskId]);
  flushDatabase();
}
