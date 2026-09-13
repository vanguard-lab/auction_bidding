import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuctionEntity } from './auction.entity';

@Entity('bids')
export class BidEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'auction_id' })
  auction_id: string;

  @Column({ type: 'text', nullable: false, name: 'user_id' })
  user_id: string;

  @Column({ type: 'decimal', nullable: false })
  amount: number;

  @Column({ type: 'text', nullable: false, unique: true, name: 'idempotency_key' })
  idempotency_key: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => AuctionEntity, (auction) => auction.bids)
  @JoinColumn({ name: 'auction_id' })
  auction: AuctionEntity;
}
