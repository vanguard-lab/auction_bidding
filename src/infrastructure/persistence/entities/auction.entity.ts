import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { BidEntity } from './bid.entity';

@Entity('auctions')
export class AuctionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  status: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'starts_at' })
  starts_at: Date;

  @Column({ type: 'timestamptz', nullable: false, name: 'ends_at' })
  ends_at: Date;

  @Column({ type: 'decimal', nullable: true, name: 'current_top_bid' })
  current_top_bid: number | null;

  @Column({ type: 'text', nullable: true, name: 'current_top_bidder_id' })
  current_top_bidder_id: string | null;

  @Column({ type: 'timestamptz', nullable: false, name: 'created_at' })
  created_at: Date;

  @OneToMany(() => BidEntity, (bid) => bid.auction)
  bids: BidEntity[];
}
