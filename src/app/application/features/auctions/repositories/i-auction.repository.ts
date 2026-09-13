import { Auction } from '../domain/auction';

/**
 * Application-defined contract for auction persistence.
 * Infrastructure implements this interface.
 */
export interface IAuctionRepository {
  /**
   * Find an auction by its unique id.
   */
  findById(id: string): Promise<Auction | null>;

  /**
   * Find all auctions.
   */
  findAll(): Promise<Auction[]>;

  /**
   * Atomically update the top bid for an auction.
   * Returns the updated auction, or null if the update was not applied
   * (e.g., because the auction is closed or the new amount is not higher).
   * This is the critical concurrency primitive.
   */
  updateTopBid(
    auctionId: string,
    amount: number,
    bidderId: string,
    referenceTime: Date
  ): Promise<Auction | null>;

  /**
   * Mark an auction as closed.
   */
  closeAuction(id: string): Promise<void>;
}
