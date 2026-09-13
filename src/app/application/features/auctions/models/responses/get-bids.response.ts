/**
 * HTTP response model for listing bids.
 */
export interface GetBidsResponse {
  bid_id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}
