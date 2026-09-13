import { ApplicationException } from '../../../shared/exceptions/application.exception';

/**
 * Thrown when the requested auction does not exist.
 */
export class AuctionNotFoundException extends ApplicationException {
  public readonly code = 'AUCTION_NOT_FOUND';
  public readonly statusCode = 404;

  constructor(auctionId: string) {
    super(`Auction with id '${auctionId}' was not found.`);
  }
}
