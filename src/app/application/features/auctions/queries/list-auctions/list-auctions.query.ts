import { Query } from '../../../../shared/cqrs';

/**
 * Query to retrieve a list of auctions.
 */
export interface ListAuctionsQuery extends Query<void> {
  readonly _type: 'ListAuctionsQuery';
}
