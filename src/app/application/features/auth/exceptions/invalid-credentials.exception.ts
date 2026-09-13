import { ApplicationException } from '../../../shared/exceptions';

export class InvalidCredentialsException extends ApplicationException {
  public readonly code = 'INVALID_CREDENTIALS';
  public readonly statusCode = 401;

  constructor() {
    super('Invalid email or password.');
  }
}
