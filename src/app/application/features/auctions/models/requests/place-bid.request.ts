/**
 * HTTP request model for placing a bid.
 * Represents the external API contract.
 */
export interface PlaceBidRequest {
  auction_id: string;
  user_id: string;
  amount: number;
}
