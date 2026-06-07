import * as crypto from 'crypto';
import type { TaskConfig } from '../../common/types/task.js';

export function generateTaskId(): string {
  return crypto.randomUUID();
}

export function deriveTitle(prompt: string): string {
  const trimmed = prompt.trim().split('\n')[0] ?? '';
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}

export function buildModelParam(
  config: TaskConfig,
): { providerID: string; modelID: string } | null {
  if (!config.modelId || !config.provider) return null;
  const prefix = `${config.provider}/`;
  const modelID = config.modelId.startsWith(prefix)
    ? config.modelId.slice(prefix.length)
    : config.modelId;
  return { providerID: config.provider, modelID };
}

export function buildWorkspaceInstructionRuntimeBlock(
  workspaceInstructions: string | undefined,
): string | undefined {
  if (!workspaceInstructions) return undefined;
  return [
    '<workspace-instructions>',
    'MANDATORY WORKSPACE INSTRUCTIONS.',
    '',
    'These are persistent user instructions saved for this workspace.',
    'They apply to THIS response and every subsequent response in this',
    'session, including short conversational replies, direct answers to',
    'simple questions, and tool-using multi-step tasks. Follow them',
    'literally on every reply. They OVERRIDE the default "respond',
    'concisely" / "1-3 sentences" behavior described in the agent',
    'prompt. Only ignore them if following them would conflict with a',
    'higher-priority safety or system rule.',
    '',
    workspaceInstructions,
    '</workspace-instructions>',
  ].join('\n');
}
