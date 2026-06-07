export class OpenCodeRuntimeUnavailableError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'OpenCode runtime URL is not available. Ensure the daemon has started the serve process before starting a task.',
    );
    this.name = 'OpenCodeRuntimeUnavailableError';
  }
}
