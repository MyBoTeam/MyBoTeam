import {
  getFirstSeenAt,
  incrementTaskCount,
  isFirstTaskCompleted,
  markFirstTaskCompleted,
  trackEvent,
} from './analytics-service';
import type { TaskContext, TaskErrorCategory } from './event-types';

export function trackTaskStart(context: TaskContext, model?: string, provider?: string): void {
  incrementTaskCount();
  trackEvent('task_start', {
    event_category: 'task_lifecycle',
    task_id: context.taskId,
    opencode_session_id: context.sessionId,
    task_type: context.taskType,
    model,
    provider,
  });
}

export function trackTaskComplete(
  context: TaskContext,
  durationMs: number,
  totalSteps: number,
  hadErrors: boolean,
  model?: string,
  totalTokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache_read: number;
    cache_write: number;
  },
  totalCost?: number,
  provider?: string,
): void {
  try {
    trackEvent('task_complete', {
      event_category: 'task_lifecycle',
      task_id: context.taskId,
      opencode_session_id: context.sessionId,
      task_type: context.taskType,
      duration_ms: durationMs,
      total_steps: totalSteps,
      had_errors: hadErrors,
      model,
      provider,
      tokens_input: totalTokens?.input,
      tokens_output: totalTokens?.output,
      tokens_reasoning: totalTokens?.reasoning,
      tokens_cache_read: totalTokens?.cache_read,
      tokens_cache_write: totalTokens?.cache_write,
      cost_usd: totalCost,
    });

    if (!isFirstTaskCompleted()) {
      const firstSeen = getFirstSeenAt();
      const daysSinceInstall = firstSeen
        ? Math.floor((Date.now() - new Date(firstSeen).getTime()) / 86_400_000)
        : 0;
      trackEvent('first_task_complete', {
        event_category: 'activation',
        task_id: context.taskId,
        opencode_session_id: context.sessionId,
        task_type: context.taskType,
        days_since_install: daysSinceInstall,
        model,
        provider,
      });
      markFirstTaskCompleted();
    }
  } catch (error) {
    console.error('[Analytics] Failed to track task complete:', error);
  }
}

export function trackTaskCancel(
  context: TaskContext,
  durationMs: number,
  totalSteps: number,
  model?: string,
  totalTokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache_read: number;
    cache_write: number;
  },
  totalCost?: number,
  provider?: string,
): void {
  try {
    trackEvent('task_cancel', {
      event_category: 'task_lifecycle',
      task_id: context.taskId,
      opencode_session_id: context.sessionId,
      task_type: context.taskType,
      duration_ms: durationMs,
      total_steps: totalSteps,
      model,
      provider,
      tokens_input: totalTokens?.input,
      tokens_output: totalTokens?.output,
      tokens_reasoning: totalTokens?.reasoning,
      tokens_cache_read: totalTokens?.cache_read,
      tokens_cache_write: totalTokens?.cache_write,
      cost_usd: totalCost,
    });
  } catch (error) {
    console.error('[Analytics] Failed to track task cancel:', error);
  }
}

export function trackTaskError(
  context: TaskContext,
  durationMs: number,
  totalSteps: number,
  errorType: TaskErrorCategory,
  model?: string,
  totalTokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache_read: number;
    cache_write: number;
  },
  totalCost?: number,
  provider?: string,
  failureReason?: string,
): void {
  trackEvent('task_error', {
    event_category: 'task_lifecycle',
    task_id: context.taskId,
    opencode_session_id: context.sessionId,
    task_type: context.taskType,
    duration_ms: durationMs,
    total_steps: totalSteps,
    error_type: errorType,
    model,
    provider,
    tokens_input: totalTokens?.input,
    tokens_output: totalTokens?.output,
    tokens_reasoning: totalTokens?.reasoning,
    tokens_cache_read: totalTokens?.cache_read,
    tokens_cache_write: totalTokens?.cache_write,
    cost_usd: totalCost,
    failure_reason: failureReason ? failureReason.slice(0, 500) : undefined,
  });
}
