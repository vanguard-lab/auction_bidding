import { Query } from '../../../../shared/cqrs';

/**
 * Query to retrieve all bids for an auction.
 */
export interface GetBidsQuery extends Query<void> {
  readonly _type: 'GetBidsQuery';
  readonly auctionId: string;
}
