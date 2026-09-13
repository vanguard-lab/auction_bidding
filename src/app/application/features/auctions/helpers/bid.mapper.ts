import { Bid } from '../domain';

/**
 * Maps between persistence representations and domain Bid objects.
 */
export class BidMapper {
  public static toDomain(row: {
    id: string;
    auction_id: string;
    user_id: string;
    amount: number;
    idempotency_key: string;
    created_at: string | Date;
  }): Bid {
    return new Bid(
      row.id,
      row.auction_id,
      row.user_id,
      row.amount,
      row.idempotency_key,
      row.created_at instanceof Date ? row.created_at : new Date(row.created_at)
    );
  }
}
