export {
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from '@myboteam/agent-core/desktop-main';

export function normalizeIpcError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : 'Unknown IPC error');
}
