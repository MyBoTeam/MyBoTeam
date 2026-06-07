import type { PermissionRequest as OpenCodeSdkPermissionRequest } from '@opencode-ai/sdk/v2';
import * as crypto from 'crypto';
import type { PermissionRequest } from '../../common/types/permission.js';
import {
  FILE_PERMISSION_REQUEST_PREFIX,
  QUESTION_REQUEST_PREFIX,
} from '../../common/types/permission.js';

export function generateRequestId(kind: 'permission' | 'question'): string {
  const prefix = kind === 'permission' ? FILE_PERMISSION_REQUEST_PREFIX : QUESTION_REQUEST_PREFIX;
  return `${prefix}${crypto.randomUUID()}`;
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
