/**
 * Base application exception.
 * All domain/application exceptions extend this.
 */
export abstract class ApplicationException extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
