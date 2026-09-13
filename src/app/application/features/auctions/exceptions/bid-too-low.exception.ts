import { ApplicationException } from '../../../shared/exceptions/application.exception';

/**
 * Thrown when a bid amount is not strictly higher than the current top bid.
 */
export class BidTooLowException extends ApplicationException {
  public readonly code = 'BID_TOO_LOW';
  public readonly statusCode = 409;

  constructor(amount: number, currentTopBid: number | null) {
    const current = currentTopBid ?? 0;
    super(`Bid amount ${amount} must be strictly higher than the current top bid ${current}.`);
  }
}
