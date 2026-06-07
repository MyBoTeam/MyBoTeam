/**
 * Analytics events barrel — re-exports all event type definitions, trackers, and error classifier.
 */
export { classifyErrorCategory } from './error-classifier';
export * from './event-trackers';
export * from './event-trackers-feature';
export * from './event-trackers-task';
export * from './event-trackers-task-interaction';
export type { HardwareProperties } from './event-types';
export type { TaskContext, TaskErrorCategory } from './types';
