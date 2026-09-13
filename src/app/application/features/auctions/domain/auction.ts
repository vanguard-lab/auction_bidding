/**
 * Domain model representing an auction.
 * Enforces business invariants.
 */
import { AuctionStatus } from './auction-status';

export class Auction {
  constructor(
    public readonly id: string,
    public status: AuctionStatus,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public currentTopBid: number | null,
    public currentTopBidderId: string | null,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Checks if the auction is open at a given reference time.
   * The reference time must be authoritative (e.g., database time).
   */
  public isOpenAt(referenceTime: Date): boolean {
    return (
      this.status === AuctionStatus.OPEN &&
      referenceTime >= this.startsAt &&
      referenceTime <= this.endsAt
    );
  }

  /**
   * Determines if a bid amount is strictly higher than the current top bid.
   */
  public isBidAmountValid(amount: number): boolean {
    if (this.currentTopBid === null) {
      return true; // No bids yet; any positive amount is valid.
    }
    return amount > this.currentTopBid;
  }
}
