import { Command } from '../../../../shared/cqrs';

/**
 * Command to place a bid on an auction.
 */
export interface PlaceBidCommand extends Command<void> {
  readonly _type: 'PlaceBidCommand';
  readonly auctionId: string;
  readonly userId: string;
  readonly amount: number;
  readonly idempotencyKey: string;
}
