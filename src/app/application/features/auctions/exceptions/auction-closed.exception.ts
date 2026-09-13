import { ApplicationException } from '../../../shared/exceptions/application.exception';

/**
 * Thrown when a bid is placed on an auction that is already closed.
 */
export class AuctionClosedException extends ApplicationException {
  public readonly code = 'AUCTION_CLOSED';
  public readonly statusCode = 409;

  constructor(auctionId: string) {
    super(`Auction with id '${auctionId}' is closed.`);
  }
}
