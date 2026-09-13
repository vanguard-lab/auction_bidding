import { Query } from '../../../../shared/cqrs';

/**
 * Query to retrieve auction details.
 */
export interface GetAuctionQuery extends Query<void> {
  readonly _type: 'GetAuctionQuery';
  readonly auctionId: string;
}
