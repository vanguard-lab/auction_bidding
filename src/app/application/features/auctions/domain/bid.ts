/**
 * Domain model representing a bid.
 */
export class Bid {
  constructor(
    public readonly id: string,
    public readonly auctionId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly idempotencyKey: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
