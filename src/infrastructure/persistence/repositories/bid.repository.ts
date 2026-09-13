import { Repository, DataSource } from 'typeorm';
import { IBidRepository } from '../../../app/application/features/auctions/repositories';
import { Bid } from '../../../app/application/features/auctions/domain';
import { BidMapper } from '../../../app/application/features/auctions/helpers';
import { BidEntity } from '../entities';

/**
 * TypeORM implementation of IBidRepository.
 *
 * Idempotency strategy:
 * - The idempotency_key column has a UNIQUE constraint.
 * - Insertion of a duplicate key will throw a TypeORM query error.
 * - The save() method detects this and throws a DuplicateBidException.
 * - The findByIdempotencyKey() method allows returning existing results on retry.
 */
export class BidRepository implements IBidRepository {
  private readonly repo: Repository<BidEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(BidEntity);
  }

  public async save(bid: Bid): Promise<void> {
    try {
      const entity = new BidEntity();
      entity.id = bid.id;
      entity.auction_id = bid.auctionId;
      entity.user_id = bid.userId;
      entity.amount = bid.amount;
      entity.idempotency_key = bid.idempotencyKey;
      entity.created_at = bid.createdAt;

      await this.repo.save(entity);
    } catch (error: any) {
      const isUniqueViolation = error.code === '23505' ||
        (error.message?.includes('unique constraint') && error.message?.includes('idempotency_key')) ||
        (error.message?.includes('UNIQUE constraint failed') && error.message?.includes('idempotency_key'));

      if (isUniqueViolation) {
        const duplicateError = new Error('Duplicate bid idempotency key');
        (duplicateError as any).code = 'DUPLICATE_BID';
        throw duplicateError;
      }
      throw error;
    }
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<Bid | null> {
    const row = await this.repo.findOne({ where: { idempotency_key: idempotencyKey } });
    if (!row) return null;
    return BidMapper.toDomain(row);
  }

  public async findByAuctionId(auctionId: string): Promise<Bid[]> {
    const rows = await this.repo.find({
      where: { auction_id: auctionId },
      order: { created_at: 'DESC' },
    });
    return rows.map((row) => BidMapper.toDomain(row));
  }

  public async findById(bidId: string): Promise<Bid | null> {
    const row = await this.repo.findOne({ where: { id: bidId } });
    if (!row) return null;
    return BidMapper.toDomain(row);
  }

  public async deleteById(bidId: string): Promise<void> {
    await this.repo.delete({ id: bidId });
  }
}
