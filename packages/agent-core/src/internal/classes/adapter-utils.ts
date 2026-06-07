import type {
  Part as OpenCodeSdkPart,
  PermissionRequest as OpenCodeSdkPermissionRequest,
} from '@opencode-ai/sdk/v2';
import * as crypto from 'crypto';
import type { OpenCodeMessage } from '../../common/types/opencode.js';
import type { PermissionRequest } from '../../common/types/permission.js';
import {
  FILE_PERMISSION_REQUEST_PREFIX,
  QUESTION_REQUEST_PREFIX,
} from '../../common/types/permission.js';
import type { TaskConfig } from '../../common/types/task.js';

export function generateTaskId(): string {
  return crypto.randomUUID();
}

export function generateRequestId(kind: 'permission' | 'question'): string {
  const prefix = kind === 'permission' ? FILE_PERMISSION_REQUEST_PREFIX : QUESTION_REQUEST_PREFIX;
  return `${prefix}${crypto.randomUUID()}`;
}

export function deriveTitle(prompt: string): string {
  const trimmed = prompt.trim().split('\n')[0] ?? '';
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}

export function buildModelParam(
  config: TaskConfig,
): { providerID: string; modelID: string } | null {
  if (!config.modelId || !config.provider) return null;
  return { providerID: config.provider, modelID: config.modelId };
}

export function inferFileOperation(
  req: OpenCodeSdkPermissionRequest,
): PermissionRequest['fileOperation'] | undefined {
  const perm = req.permission;
  if (perm === 'edit' || perm === 'modify') return 'modify';
  if (perm === 'write') return 'create';
  if (perm === 'delete') return 'delete';
  return undefined;
}

export function formatPermissionToolName(permission: string): string | undefined {
  const trimmed = permission.trim();
  if (!trimmed) {
    return undefined;
  }
  const knownLabels: Record<string, string> = {
    bash: 'Bash',
    write: 'Write',
    edit: 'Edit',
    patch: 'Patch',
    multiedit: 'MultiEdit',
    read: 'Read',
    webfetch: 'WebFetch',
    external_directory: 'External Directory Access',
  };
  const known = knownLabels[trimmed.toLowerCase()];
  if (known) {
    return known;
  }
  return trimmed
    .split(/[-_:.\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildPermissionToolInput(
  req: OpenCodeSdkPermissionRequest,
): Record<string, unknown> | undefined {
  const input: Record<string, unknown> = {};
  const patterns = Array.isArray(req.patterns) ? req.patterns.filter(Boolean) : [];
  const metadata =
    req.metadata && typeof req.metadata === 'object'
      ? (req.metadata as Record<string, unknown>)
      : {};

  if (req.permission.toLowerCase() === 'bash' && patterns.length === 1) {
    input.command = patterns[0];
  } else if (patterns.length === 1) {
    input.pattern = patterns[0];
  } else if (patterns.length > 1) {
    input.patterns = patterns;
  }

  Object.assign(input, metadata);
  input.permission = req.permission;

  return Object.keys(input).length > 0 ? input : undefined;
}

export function inferFilePath(req: OpenCodeSdkPermissionRequest): string | undefined {
  const patterns = req.patterns;
  if (Array.isArray(patterns) && patterns.length > 0) return patterns[0];
  return undefined;
}

export function partToOpenCodeMessage(part: OpenCodeSdkPart): OpenCodeMessage | null {
  const asAny = part as unknown as {
    id?: string;
    sessionID?: string;
    messageID?: string;
    type?: string;
    text?: string;
    tool?: string;
    state?: { status?: string; input?: unknown; output?: string };
  };

  if (part.type === 'text') {
    const text = asAny.text ?? '';
    return {
      type: 'text',
      part: {
        id: asAny.id ?? '',
        sessionID: asAny.sessionID ?? '',
        messageID: asAny.messageID ?? '',
        type: 'text',
        text,
      },
    } as OpenCodeMessage;
  }

  if (part.type === 'tool') {
    const rawStatus = asAny.state?.status;
    const status: 'pending' | 'running' | 'completed' | 'error' =
      rawStatus === 'running' ||
      rawStatus === 'completed' ||
      rawStatus === 'error' ||
      rawStatus === 'pending'
        ? rawStatus
        : 'pending';
    return {
      type: 'tool_use',
      part: {
        id: asAny.id ?? '',
        sessionID: asAny.sessionID ?? '',
        messageID: asAny.messageID ?? '',
        type: 'tool',
        tool: asAny.tool ?? 'unknown',
        state: {
          status,
          input: asAny.state?.input,
          output: asAny.state?.output,
        },
      },
    };
  }

  return null;
}

export function parseConnectorAuthPayload(
  text: string,
  marker: string,
): Record<string, unknown> | null {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const after = text.slice(start + marker.length).trim();
  const braceStart = after.indexOf('{');
  if (braceStart < 0) return null;
  try {
    let depth = 0;
    for (let i = braceStart; i < after.length; i++) {
      if (after[i] === '{') depth++;
      else if (after[i] === '}') {
        depth--;
        if (depth === 0) {
          return JSON.parse(after.slice(braceStart, i + 1));
        }
      }
    }
  } catch {
    return null;
  }
  return null;
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
