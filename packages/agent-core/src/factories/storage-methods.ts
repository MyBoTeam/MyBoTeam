import {
  clearAllConnectors,
  deleteConnector,
  getAllConnectors,
  getConnectorById,
  getEnabledConnectors,
  setConnectorEnabled,
  setConnectorStatus,
  upsertConnector,
} from '../storage/repositories/connectors.js';
import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
} from '../storage/repositories/favorites.js';
import {
  createScheduledTask,
  deleteScheduledTask,
  getAllScheduledTasks,
  getEnabledScheduledTasks,
  getScheduledTaskById,
  getScheduledTasksByWorkspace,
  setScheduledTaskEnabled,
  updateScheduledTaskLastRun,
} from '../storage/repositories/scheduled-tasks.js';
import {
  addTaskMessage,
  clearHistory,
  clearTodosForTask,
  deleteTask,
  getTask,
  getTasks,
  getTodosForTask,
  saveTask,
  saveTodosForTask,
  updateTaskSessionId,
  updateTaskStatus,
  updateTaskSummary,
} from '../storage/repositories/taskHistory.js';
import type { StorageAPI } from '../types/storage.js';

export function createTaskMethods(): Pick<
  StorageAPI,
  | 'getTasks'
  | 'getTask'
  | 'saveTask'
  | 'updateTaskStatus'
  | 'addTaskMessage'
  | 'updateTaskSessionId'
  | 'updateTaskSummary'
  | 'deleteTask'
  | 'clearHistory'
  | 'getTodosForTask'
  | 'saveTodosForTask'
  | 'clearTodosForTask'
  | 'addFavorite'
  | 'removeFavorite'
  | 'getFavorites'
  | 'isFavorite'
> {
  return {
    getTasks: (workspaceId, includeUnassigned) => getTasks(workspaceId, includeUnassigned),
    getTask: (taskId) => getTask(taskId),
    saveTask: (task, workspaceId) => saveTask(task, workspaceId),
    updateTaskStatus: (taskId, status, completedAt) =>
      updateTaskStatus(taskId, status, completedAt),
    addTaskMessage: (taskId, message) => addTaskMessage(taskId, message),
    updateTaskSessionId: (taskId, sessionId) => updateTaskSessionId(taskId, sessionId),
    updateTaskSummary: (taskId, summary) => updateTaskSummary(taskId, summary),
    deleteTask: (taskId) => deleteTask(taskId),
    clearHistory: () => clearHistory(),
    getTodosForTask: (taskId) => getTodosForTask(taskId),
    saveTodosForTask: (taskId, todos) => saveTodosForTask(taskId, todos),
    clearTodosForTask: (taskId) => clearTodosForTask(taskId),
    addFavorite: (taskId, prompt, summary) => addFavorite(taskId, prompt, summary),
    removeFavorite: (taskId) => removeFavorite(taskId),
    getFavorites: () => getFavorites(),
    isFavorite: (taskId) => isFavorite(taskId),
  };
}

export function createConnectorMethods(): Pick<
  StorageAPI,
  | 'getAllConnectors'
  | 'getEnabledConnectors'
  | 'getConnectorById'
  | 'upsertConnector'
  | 'setConnectorEnabled'
  | 'setConnectorStatus'
  | 'deleteConnector'
  | 'clearAllConnectors'
> {
  return {
    getAllConnectors: () => getAllConnectors(),
    getEnabledConnectors: () => getEnabledConnectors(),
    getConnectorById: (id) => getConnectorById(id),
    upsertConnector: (connector) => upsertConnector(connector),
    setConnectorEnabled: (id, enabled) => setConnectorEnabled(id, enabled),
    setConnectorStatus: (id, status) => setConnectorStatus(id, status),
    deleteConnector: (id) => deleteConnector(id),
    clearAllConnectors: () => clearAllConnectors(),
  };
}

export function createScheduledTaskMethods(): Pick<
  StorageAPI,
  | 'getAllScheduledTasks'
  | 'getEnabledScheduledTasks'
  | 'getScheduledTasksByWorkspace'
  | 'getScheduledTaskById'
  | 'createScheduledTask'
  | 'deleteScheduledTask'
  | 'setScheduledTaskEnabled'
  | 'updateScheduledTaskLastRun'
> {
  return {
    getAllScheduledTasks: () => getAllScheduledTasks(),
    getEnabledScheduledTasks: () => getEnabledScheduledTasks(),
    getScheduledTasksByWorkspace: (workspaceId) => getScheduledTasksByWorkspace(workspaceId),
    getScheduledTaskById: (id) => getScheduledTaskById(id),
    createScheduledTask: (cron, prompt, workspaceId) =>
      createScheduledTask(cron, prompt, workspaceId),
    deleteScheduledTask: (id) => deleteScheduledTask(id),
    setScheduledTaskEnabled: (id, enabled) => setScheduledTaskEnabled(id, enabled),
    updateScheduledTaskLastRun: (id, timestamp, nextRunAt) =>
      updateScheduledTaskLastRun(id, timestamp, nextRunAt),
  };
}
