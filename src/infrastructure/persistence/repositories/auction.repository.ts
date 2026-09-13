import { Repository, DataSource } from 'typeorm';
import { IAuctionRepository } from '../../../app/application/features/auctions/repositories';
import { Auction } from '../../../app/application/features/auctions/domain';
import { AuctionMapper } from '../../../app/application/features/auctions/helpers';
import { AuctionEntity } from '../entities';

/**
 * TypeORM implementation of IAuctionRepository.
 *
 * Concurrency strategy:
 * - The updateTopBid method uses a database transaction.
 * - The UPDATE statement is conditional: it only updates rows where:
 *   1) status = 'OPEN'
 *   2) ends_at >= :reference_time (auction hasn't closed)
 *   3) current_top_bid IS NULL OR current_top_bid < :amount
 * - PostgreSQL row-level locking ensures that only one concurrent transaction
 *   can modify a given row at a time.
 * - The conditional UPDATE means that even if two transactions read the same
 *   old top bid simultaneously, only one will succeed in updating the row.
 * - Uses UPDATE ... RETURNING * so we know whether the update succeeded and
 *   get the updated row in a single query.
 */
export class AuctionRepository implements IAuctionRepository {
  private readonly repo: Repository<AuctionEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AuctionEntity);
  }

  public async findById(id: string): Promise<Auction | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    return AuctionMapper.toDomain(row);
  }

  public async findAll(): Promise<Auction[]> {
    const rows = await this.repo.find();
    return rows.map((row) => AuctionMapper.toDomain(row));
  }

  public async updateTopBid(
    auctionId: string,
    amount: number,
    bidderId: string,
    referenceTime: Date
  ): Promise<Auction | null> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.query(
        `UPDATE auctions
         SET current_top_bid = $1,
             current_top_bidder_id = $2
         WHERE id = $3
           AND status = 'OPEN'
           AND ends_at >= $4
           AND (current_top_bid IS NULL OR current_top_bid < $5)
         RETURNING *`,
        [amount, bidderId, auctionId, referenceTime.toISOString(), amount]
      );

      if (!result || (result as any[]).length === 0) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return null;
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return AuctionMapper.toDomain((result as any[])[0]);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw err;
    }
  }

  public async closeAuction(id: string): Promise<void> {
    await this.repo.update(id, { status: 'CLOSED' });
  }
}
