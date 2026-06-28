import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentStorage, NotFoundError } from '../../../src/storage/agent-storage.js';

describe('Task CRUD', () => {
  let storage: AgentStorage;
  let agentId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'test-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    agentId = agent.id;
  });

  afterEach(() => {
    storage.close();
  });

  it('should create a task with pending status', () => {
    const task = storage.createTask({ agent_id: agentId, title: 'test task' });
    expect(task.id).toBeDefined();
    expect(task.title).toBe('test task');
    expect(task.agent_id).toBe(agentId);
    expect(task.status).toBe('pending');
    expect(task.verification_status).toBeNull();
    expect(task.continuation_count).toBe(0);
  });

  it('should create a task with custom status', () => {
    const task = storage.createTask({
      agent_id: agentId,
      title: 'running task',
      status: 'running',
    });
    expect(task.status).toBe('running');
  });

  it('should get a task by id', () => {
    const created = storage.createTask({ agent_id: agentId, title: 'get-me' });
    const retrieved = storage.getTask(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
  });

  it('should return null for non-existent task', () => {
    expect(storage.getTask('nonexistent')).toBeNull();
  });

  it('should list all tasks', () => {
    storage.createTask({ agent_id: agentId, title: 't1' });
    storage.createTask({ agent_id: agentId, title: 't2' });
    const tasks = storage.listTasks();
    expect(tasks.length).toBe(2);
  });

  it('should list tasks by agent', () => {
    storage.createTask({ agent_id: agentId, title: 't1' });
    storage.createTask({ agent_id: agentId, title: 't2' });
    const tasks = storage.listTasksByAgent(agentId);
    expect(tasks.length).toBe(2);
  });

  it('should list tasks filtered by status', () => {
    storage.createTask({ agent_id: agentId, title: 't1', status: 'running' });
    storage.createTask({ agent_id: agentId, title: 't2', status: 'completed' });
    const running = storage.listTasks({ status: 'running' });
    expect(running.length).toBe(1);
    expect(running[0].title).toBe('t1');
  });

  it('should update a task status', () => {
    const task = storage.createTask({ agent_id: agentId, title: 'update-me' });
    const updated = storage.updateTask(task.id, { status: 'completed' });
    expect(updated.status).toBe('completed');
  });

  it('should throw NotFoundError when updating non-existent task', () => {
    expect(() => storage.updateTask('nonexistent', { title: 'test' })).toThrow(NotFoundError);
  });

  it('should delete a task', () => {
    const task = storage.createTask({ agent_id: agentId, title: 'delete-me' });
    storage.deleteTask(task.id);
    expect(storage.getTask(task.id)).toBeNull();
  });

  it('should throw NotFoundError when deleting non-existent task', () => {
    expect(() => storage.deleteTask('nonexistent')).toThrow(NotFoundError);
  });

  it('should cascade delete task_todos when task is deleted', () => {
    const task = storage.createTask({ agent_id: agentId, title: 'with-todos' });
    storage.createTaskTodo({ task_id: task.id, description: 'todo1' });
    storage.createTaskTodo({ task_id: task.id, description: 'todo2' });
    storage.deleteTask(task.id);
    expect(storage.listTaskTodos(task.id)).toEqual([]);
  });
});

describe('TaskTodo CRUD', () => {
  let storage: AgentStorage;
  let taskId: string;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
    const agent = storage.createAgent({
      slug: 'todo-agent',
      provider: 'anthropic',
      model: 'claude',
    });
    const task = storage.createTask({ agent_id: agent.id, title: 'todo-task' });
    taskId = task.id;
  });

  afterEach(() => {
    storage.close();
  });

  it('should create a task todo', () => {
    const todo = storage.createTaskTodo({ task_id: taskId, description: 'do something' });
    expect(todo.id).toBeDefined();
    expect(todo.description).toBe('do something');
    expect(todo.is_completed).toBe(0);
  });

  it('should get a task todo by id', () => {
    const created = storage.createTaskTodo({ task_id: taskId, description: 'get-me' });
    const retrieved = storage.getTaskTodo(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
  });

  it('should list todos for a task', () => {
    storage.createTaskTodo({ task_id: taskId, description: 'todo1' });
    storage.createTaskTodo({ task_id: taskId, description: 'todo2' });
    const todos = storage.listTaskTodos(taskId);
    expect(todos.length).toBe(2);
  });

  it('should mark a todo as completed', () => {
    const todo = storage.createTaskTodo({ task_id: taskId, description: 'mark-me' });
    const updated = storage.updateTaskTodo(todo.id, { is_completed: 1 });
    expect(updated.is_completed).toBe(1);
  });

  it('should throw NotFoundError when updating non-existent todo', () => {
    expect(() => storage.updateTaskTodo('nonexistent', { is_completed: 1 })).toThrow(NotFoundError);
  });

  it('should delete a todo', () => {
    const todo = storage.createTaskTodo({ task_id: taskId, description: 'delete-me' });
    storage.deleteTaskTodo(todo.id);
    expect(storage.getTaskTodo(todo.id)).toBeNull();
  });

  it('should throw NotFoundError when deleting non-existent todo', () => {
    expect(() => storage.deleteTaskTodo('nonexistent')).toThrow(NotFoundError);
  });

  it('should return empty list for task with no todos', () => {
    expect(storage.listTaskTodos(taskId)).toEqual([]);
  });
});
