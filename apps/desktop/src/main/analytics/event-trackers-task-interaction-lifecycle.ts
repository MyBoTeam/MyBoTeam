import { trackEvent } from './analytics-service';
import type { TaskContext } from './event-types';

export function trackToolUsed(
  context: TaskContext,
  toolName: string,
  model?: string,
  provider?: string,
): void {
  trackEvent('tool_used', {
    event_category: 'task_lifecycle',
    task_id: context.taskId,
    opencode_session_id: context.sessionId,
    task_type: context.taskType,
    tool_name: toolName,
    model,
    provider,
  });
}

export function trackUserInteraction(
  context: TaskContext,
  interactionType: string,
  usedSuggestion: boolean,
  model?: string,
  provider?: string,
): void {
  trackEvent('user_interaction', {
    event_category: 'task_lifecycle',
    task_id: context.taskId,
    opencode_session_id: context.sessionId,
    task_type: context.taskType,
    interaction_type: interactionType,
    used_suggestion: usedSuggestion,
    model,
    provider,
  });
}

export function trackTaskFirstResponse(
  taskId: string,
  durationMs: number,
  usedPrewarm: boolean,
  taskSessionState: 'cold' | 'warm',
  model?: string,
  provider?: string,
): void {
  trackEvent('task_first_response', {
    event_category: 'task_lifecycle',
    task_id: taskId,
    duration_ms: Math.round(durationMs),
    used_prewarm: usedPrewarm,
    task_session_state: taskSessionState,
    model,
    provider,
  });
}

export function trackTaskFeedback(
  taskId: string,
  sessionId: string,
  rating: string,
  taskStatus: string,
  feedbackStage: string,
  model?: string,
  provider?: string,
  feedbackReason?: string,
  feedbackText?: string,
): void {
  trackEvent('task_feedback', {
    event_category: 'task_lifecycle',
    task_id: taskId,
    opencode_session_id: sessionId,
    rating,
    task_status: taskStatus,
    feedback_stage: feedbackStage,
    model,
    provider,
    feedback_reason: feedbackReason,
    feedback_text: feedbackText?.substring(0, 500),
  });
}

export function trackStopAgent(taskId: string, sessionId: string): void {
  trackEvent('stop_agent', {
    event_category: 'task_lifecycle',
    task_id: taskId,
    opencode_session_id: sessionId,
  });
}
