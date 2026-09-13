import { Handler } from '../../../../shared/cqrs';
import { PlaceBidCommand } from './place-bid.command';
import { PlaceBidResponse } from '../../models';
import { IAuctionRepository, IBidRepository } from '../../repositories';
import {
  AuctionNotFoundException,
  AuctionClosedException,
  BidTooLowException,
  DuplicateBidException,
} from '../../exceptions';
import { Bid } from '../../domain';
import { randomUUID } from 'crypto';

/**
 * Orchestrates the PlaceBid use case.
 * Concurrency and idempotency are handled at the repository level.
 */
export class PlaceBidHandler implements Handler<PlaceBidCommand, PlaceBidResponse> {
  constructor(
    private readonly auctionRepository: IAuctionRepository,
    private readonly bidRepository: IBidRepository
  ) {}

  public async handle(command: PlaceBidCommand): Promise<PlaceBidResponse> {
    // Step 1: Idempotency check — if this exact bid was already persisted,
    // return the existing result without side effects.
    const existingBid = await this.bidRepository.findByIdempotencyKey(command.idempotencyKey);
    if (existingBid) {
      // Return the stored result as-is.
      return this.toResponse(existingBid, true);
    }

    // Step 2: Find the auction.
    const auction = await this.auctionRepository.findById(command.auctionId);
    if (!auction) {
      throw new AuctionNotFoundException(command.auctionId);
    }

    // Step 3: The authoritative concurrency check is performed inside the repository
    // via an atomic conditional update. We pass the current server time as the
    // reference time for auction openness.
    const referenceTime = new Date();

    if (!auction.isOpenAt(referenceTime)) {
      throw new AuctionClosedException(command.auctionId);
    }

    if (!auction.isBidAmountValid(command.amount)) {
      throw new BidTooLowException(command.amount, auction.currentTopBid);
    }

    // Step 4: Atomically update the top bid.
    // The repository returns the updated auction only if the bid was accepted.
    const updatedAuction = await this.auctionRepository.updateTopBid(
      command.auctionId,
      command.amount,
      command.userId,
      referenceTime
    );

    if (!updatedAuction) {
      // Another concurrent request changed state between our read and the atomic update.
      // Re-read to determine the exact reason for rejection.
      const currentAuction = await this.auctionRepository.findById(command.auctionId);
      if (!currentAuction) {
        throw new AuctionNotFoundException(command.auctionId);
      }
      if (!currentAuction.isOpenAt(referenceTime)) {
        throw new AuctionClosedException(command.auctionId);
      }
      if (!currentAuction.isBidAmountValid(command.amount)) {
        throw new BidTooLowException(command.amount, currentAuction.currentTopBid);
      }
      // Should rarely happen; treat as conflict.
      throw new BidTooLowException(command.amount, currentAuction.currentTopBid);
    }

    // Step 5: Persist the bid.
    const bid = new Bid(
      randomUUID(),
      command.auctionId,
      command.userId,
      command.amount,
      command.idempotencyKey,
      referenceTime
    );

    try {
      await this.bidRepository.save(bid);
    } catch (error: any) {
      if (error.code === 'DUPLICATE_BID') {
        // Another process persisted the same idempotency key concurrently.
        // This is safe: the bid was already accepted atomically.
        // Return success as if we inserted it.
        return this.toResponse(bid, true);
      }
      throw error;
    }

    return this.toResponse(bid, true);
  }

  private toResponse(bid: Bid, isTopBid: boolean): PlaceBidResponse {
    return {
      bid_id: bid.id,
      auction_id: bid.auctionId,
      user_id: bid.userId,
      amount: bid.amount,
      accepted: true,
      is_top_bid: isTopBid,
      created_at: bid.createdAt.toISOString(),
    };
  }
}
