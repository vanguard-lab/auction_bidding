import { ApplicationException } from '../../../shared/exceptions/application.exception';

/**
 * Thrown when a bid is requested but does not exist.
 */
export class BidNotFoundException extends ApplicationException {
  public readonly code = 'BID_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(bidId: string) {
    super(`Bid with id "${bidId}" not found.`);
  }
}
