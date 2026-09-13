import { Handler } from '../../../../shared/cqrs';
import { ListAuctionsQuery } from './list-auctions.query';
import { GetAuctionResponse } from '../../models';
import { IAuctionRepository } from '../../repositories';

/**
 * Handles ListAuctionsQuery.
 */
export class ListAuctionsHandler implements Handler<ListAuctionsQuery, GetAuctionResponse[]> {
  constructor(private readonly auctionRepository: IAuctionRepository) {}

  public async handle(_query: ListAuctionsQuery): Promise<GetAuctionResponse[]> {
    const auctions = await this.auctionRepository.findAll();
    return auctions.map((auction) => ({
      auction_id: auction.id,
      status: auction.status,
      starts_at: auction.startsAt.toISOString(),
      ends_at: auction.endsAt.toISOString(),
      current_top_bid: auction.currentTopBid,
      current_top_bidder: auction.currentTopBidderId,
    }));
  }
}
