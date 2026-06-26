export class DatabaseError extends Error {
  public readonly code: string;
  public readonly query?: string;

  constructor(message: string, code: string, query?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.query = query;
  }
}

export class NotFoundError extends Error {
  public readonly entity: string;
  public readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly value: unknown;

  constructor(field: string, value: unknown, message?: string) {
    super(message ?? `Validation failed for field '${field}'`);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}
