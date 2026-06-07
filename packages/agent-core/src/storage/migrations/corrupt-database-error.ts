export class CorruptDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptDatabaseError';
  }
}
