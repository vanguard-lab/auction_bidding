import { Bid } from '../domain/bid';

/**
 * Application-defined contract for bid persistence.
 * Infrastructure implements this interface.
 */
export interface IBidRepository {
  /**
   * Save a new bid.
   * Should throw DuplicateBidException if the idempotency key already exists.
   */
  save(bid: Bid): Promise<void>;

  /**
   * Find a bid by its unique idempotency key.
   * Used for idempotency: returning existing result on retry.
   */
  findByIdempotencyKey(idempotencyKey: string): Promise<Bid | null>;

  /**
   * Find all bids for an auction.
   */
  findByAuctionId(auctionId: string): Promise<Bid[]>;

  /**
   * Find a bid by its unique id.
   */
  findById(bidId: string): Promise<Bid | null>;

  /**
   * Delete a bid by its unique id.
   */
  deleteById(bidId: string): Promise<void>;
}
