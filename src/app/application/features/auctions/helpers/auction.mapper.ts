import { Auction } from '../domain';
import { AuctionStatus } from '../domain';

/**
 * Maps between persistence representations and domain Auction objects.
 */
export class AuctionMapper {
  public static toDomain(row: {
    id: string;
    status: string;
    starts_at: string | Date;
    ends_at: string | Date;
    current_top_bid: number | null;
    current_top_bidder_id: string | null;
    created_at: string | Date;
  }): Auction {
    return new Auction(
      row.id,
      row.status as AuctionStatus,
      row.starts_at instanceof Date ? row.starts_at : new Date(row.starts_at),
      row.ends_at instanceof Date ? row.ends_at : new Date(row.ends_at),
      row.current_top_bid,
      row.current_top_bidder_id,
      row.created_at instanceof Date ? row.created_at : new Date(row.created_at)
    );
  }
}
