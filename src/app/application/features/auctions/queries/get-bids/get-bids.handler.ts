import { Handler } from '../../../../shared/cqrs';
import { GetBidsQuery } from './get-bids.query';
import { GetBidsResponse } from '../../models';
import { IBidRepository } from '../../repositories';

/**
 * Handles GetBidsQuery.
 */
export class GetBidsHandler implements Handler<GetBidsQuery, GetBidsResponse[]> {
  constructor(private readonly bidRepository: IBidRepository) {}

  public async handle(query: GetBidsQuery): Promise<GetBidsResponse[]> {
    const bids = await this.bidRepository.findByAuctionId(query.auctionId);
    return bids.map((bid) => ({
      bid_id: bid.id,
      auction_id: bid.auctionId,
      user_id: bid.userId,
      amount: bid.amount,
      created_at: bid.createdAt.toISOString(),
    }));
  }
}
