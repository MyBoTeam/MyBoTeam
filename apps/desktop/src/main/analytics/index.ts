/**
 * Analytics barrel — re-exports all analytics modules.
 *
 * Usage: import { trackAppLaunched, initAnalytics, ... } from './analytics';
 */

// Low-level services (from Phase 1)
export {
  flushAnalytics,
  getAnalyticsSessionId,
  getClientId,
  getDeviceFingerprint,
  getFirstLaunchVersion,
  getFirstSeenAt,
  getSessionDuration,
  getSessionTaskCount,
  incrementTaskCount,
  initAnalytics,
  isFirstTaskCompleted,
  markFirstTaskCompleted,
  setOnlineStatus,
  trackEvent,
} from './analytics-service';
// Error classifier
export { classifyErrorCategory } from './error-classifier';
// Event helpers (typed wrappers around trackEvent)
export * from './events';
export { flushMixpanel, initMixpanel } from './mixpanel-service';
// Types
export type { TaskContext, TaskErrorCategory } from './types';
