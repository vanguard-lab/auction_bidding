import { ApplicationException } from '../../../shared/exceptions';

export class UserAlreadyExistsException extends ApplicationException {
  public readonly code = 'USER_ALREADY_EXISTS';
  public readonly statusCode = 409;

  constructor() {
    super('A user with this email already exists.');
  }
}
