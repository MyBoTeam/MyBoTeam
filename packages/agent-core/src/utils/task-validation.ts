import type { TaskConfig } from '../common/types/task.js';
import { sanitizeString } from './sanitize.js';

export function validateTaskConfig(config: TaskConfig): TaskConfig {
  const prompt = sanitizeString(config.prompt, 'prompt');
  const validated: TaskConfig = { prompt };

  if (config.taskId) {
    validated.taskId = sanitizeString(config.taskId, 'taskId', 128);
  }
  if (config.sessionId) {
    validated.sessionId = sanitizeString(config.sessionId, 'sessionId', 128);
  }
  if (config.workingDirectory) {
    validated.workingDirectory = sanitizeString(config.workingDirectory, 'workingDirectory', 1024);
  }
  if (Array.isArray(config.allowedTools)) {
    validated.allowedTools = config.allowedTools
      .filter((tool): tool is string => typeof tool === 'string')
      .map((tool) => sanitizeString(tool, 'allowedTools', 64))
      .slice(0, 20);
  }
  if (config.systemPromptAppend) {
    validated.systemPromptAppend = sanitizeString(config.systemPromptAppend, 'systemPromptAppend');
  }
  if (config.outputSchema && typeof config.outputSchema === 'object') {
    validated.outputSchema = config.outputSchema;
  }
  if (config.modelId) {
    validated.modelId = sanitizeString(config.modelId, 'modelId', 128);
  }

  if (config.workspaceId) {
    validated.workspaceId = sanitizeString(config.workspaceId, 'workspaceId', 128);
  }

  if (Array.isArray(config.files) && config.files.length > 0) {
    validated.files = config.files;
  }

  if (config.source === 'ui' || config.source === 'whatsapp' || config.source === 'scheduler') {
    validated.source = config.source;
  }

  return validated;
}
