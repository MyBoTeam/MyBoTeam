import type { TaskErrorCategory } from './types';

export function classifyErrorCategory(errorName: unknown): TaskErrorCategory {
  const name = String(errorName).toLowerCase();

  if (
    name.includes('auth') ||
    name.includes('oauth') ||
    name.includes('unauthorized') ||
    name.includes('accessdenied') ||
    name.includes('invalidsignature')
  ) {
    return 'auth_error';
  }

  if (
    name.includes('throttl') ||
    name.includes('rate_limit') ||
    name.includes('ratelimit') ||
    name.includes('429')
  ) {
    return 'rate_limit';
  }

  if (name.includes('timeout') || name === 'aborterror') {
    return 'timeout';
  }

  if (
    name.includes('network') ||
    name.includes('econnrefused') ||
    name.includes('enotfound') ||
    name.includes('503')
  ) {
    return 'network_error';
  }

  if (
    name.includes('contextoverflowerror') ||
    name.includes('n_keep') ||
    name.includes('n_ctx') ||
    name.includes('context window is too small') ||
    name.includes('context size has been exceeded') ||
    name.includes('exceeds the available context size')
  ) {
    return 'context_overflow';
  }

  if (name.includes('interrupt') || name.includes('cancel') || name.includes('abort')) {
    return 'user_interrupted';
  }

  if (name.includes('tool_error') || name.includes('validation')) {
    return 'tool_error';
  }

  return 'unknown';
}
