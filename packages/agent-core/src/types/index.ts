/**
 * Public API interfaces for agent-core
 *
 * This module exports all public API interfaces and their related types.
 * Consumers should use factory functions to create instances that implement these interfaces.
 */

// Log Writer API
export type {
  LogEntry,
  LogLevel,
  LogSource,
  LogWriterAPI,
  LogWriterOptions,
} from './log-writer.js';
// Permission Handler API
export type {
  FilePermissionRequestData,
  PermissionHandlerAPI,
  PermissionHandlerOptions,
  PermissionValidationResult,
  QuestionRequestData,
  QuestionResponseData,
} from './permission-handler.js';
// Skills Manager API
export type { SkillsManagerAPI, SkillsManagerOptions } from './skills-manager.js';
// Speech Service API
export type {
  SpeechServiceAPI,
  SpeechServiceOptions,
  TranscriptionError,
  TranscriptionResult,
} from './speech.js';
// Storage API
export type {
  AppSettings,
  AppSettingsAPI,
  DatabaseLifecycleAPI,
  ProviderSettingsAPI,
  SchedulerStorageAPI,
  SecureStorageAPI,
  StorageAPI,
  StorageOptions,
  StoredFavorite,
  StoredTask,
  TaskStorageAPI,
  ThemeColorPreference,
  ThemePreference,
} from './storage.js';
// Task Manager API
export type {
  OnBeforeStartContext,
  OnBeforeStartResult,
  TaskAdapterOptions,
  TaskCallbacks,
  TaskManagerAPI,
  TaskManagerOptions,
  TaskProgressEvent,
} from './task-manager.js';
