import { ApplicationException } from '../../../shared/exceptions/application.exception';

/**
 * Thrown when a bid with the same idempotency key already exists.
 */
export class DuplicateBidException extends ApplicationException {
  public readonly code = 'DUPLICATE_BID';
  public readonly statusCode = 409;

  constructor() {
    super('A bid with the same idempotency key has already been submitted.');
  }
}
