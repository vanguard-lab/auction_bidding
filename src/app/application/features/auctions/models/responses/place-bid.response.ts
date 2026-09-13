/**
 * HTTP response model for placing a bid.
 */
export interface PlaceBidResponse {
  bid_id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  accepted: boolean;
  is_top_bid: boolean;
  created_at: string;
}
