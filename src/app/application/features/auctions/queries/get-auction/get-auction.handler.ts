import { Handler } from '../../../../shared/cqrs';
import { GetAuctionQuery } from './get-auction.query';
import { GetAuctionResponse } from '../../models';
import { IAuctionRepository } from '../../repositories';
import { AuctionNotFoundException } from '../../exceptions';

/**
 * Handles GetAuctionQuery.
 */
export class GetAuctionHandler implements Handler<GetAuctionQuery, GetAuctionResponse> {
  constructor(private readonly auctionRepository: IAuctionRepository) {}

  public async handle(query: GetAuctionQuery): Promise<GetAuctionResponse> {
    const auction = await this.auctionRepository.findById(query.auctionId);
    if (!auction) {
      throw new AuctionNotFoundException(query.auctionId);
    }

    return {
      auction_id: auction.id,
      status: auction.status,
      starts_at: auction.startsAt.toISOString(),
      ends_at: auction.endsAt.toISOString(),
      current_top_bid: auction.currentTopBid,
      current_top_bidder: auction.currentTopBidderId,
    };
  }
}
