/**
 * HTTP response model for auction queries.
 */
export interface GetAuctionResponse {
  auction_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  current_top_bid: number | null;
  current_top_bidder: string | null;
}
