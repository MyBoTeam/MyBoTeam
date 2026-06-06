export class FutureSchemaError extends Error {
  constructor(
    public readonly storedVersion: number,
    public readonly appVersion: number,
  ) {
    super(
      `Database schema version ${storedVersion} is newer than app version ${appVersion}. Please update the application.`,
    );
    this.name = 'FutureSchemaError';
  }
}

export class CorruptDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptDatabaseError';
  }
}
