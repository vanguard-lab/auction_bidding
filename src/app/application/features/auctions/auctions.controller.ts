import { Request, Response, NextFunction } from 'express';
import { Mediator } from '../../shared/cqrs';
import { PlaceBidCommand, DeleteBidCommand } from './commands';
import { GetAuctionQuery, GetBidsQuery, ListAuctionsQuery } from './queries';
import { PlaceBidRequest, GetAuctionResponse, PlaceBidResponse, GetBidsResponse } from './models';
import { ValidationResult } from '../../shared/validation';
import { AuthenticatedRequest } from '../../../http/middleware/auth.guard';

/**
 * Auctions controller.
 * Responsible for HTTP/application translation.
 * Does NOT contain business logic.
 */
export class AuctionsController {
  constructor(
    private readonly mediator: Mediator,
    private readonly placeBidValidator: { validate: (req: PlaceBidRequest) => ValidationResult }
  ) {}

  public placeBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Extract payload
      const payload: PlaceBidRequest = req.body;

      // Step 2: Validate payload
      const validation = this.placeBidValidator.validate(payload);
      if (!validation.isValid) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          errors: validation.errors,
        });
        return;
      }

      // Step 3: Extract idempotency key from header
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      if (!idempotencyKey || typeof idempotencyKey !== 'string') {
        res.status(400).json({
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required.',
        });
        return;
      }

      // Step 4: Get authenticated user from JWT token 
      // Never trust user_id from request body - always use the authenticated user
      const authenticatedRequest = req as AuthenticatedRequest;
      if (!authenticatedRequest.user || !authenticatedRequest.user.id) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated.',
        });
        return;
      }

      // Step 5: Build command with authenticated user ID
      const command: PlaceBidCommand = {
        _type: 'PlaceBidCommand',
        auctionId: payload.auction_id,
        userId: authenticatedRequest.user.id, // ✅ Use authenticated user, not request body
        amount: payload.amount,
        idempotencyKey: `${authenticatedRequest.user.id}:${payload.auction_id}:${idempotencyKey}`,
      };

      // Step 6: Dispatch through mediator
      const result: PlaceBidResponse = await this.mediator.send(command);

      // Step 7: Return HTTP response
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public getAuction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auctionId = req.params.id;
      if (!auctionId) {
        res.status(400).json({
          code: 'MISSING_AUCTION_ID',
          message: 'Auction id is required.',
        });
        return;
      }

      const query: GetAuctionQuery = {
        _type: 'GetAuctionQuery',
        auctionId,
      };

      const result: GetAuctionResponse = await this.mediator.query(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public listAuctions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: ListAuctionsQuery = {
        _type: 'ListAuctionsQuery',
      };

      const result: GetAuctionResponse[] = await this.mediator.query(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public getBids = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auctionId = req.params.id;
      if (!auctionId) {
        res.status(400).json({
          code: 'MISSING_AUCTION_ID',
          message: 'Auction id is required.',
        });
        return;
      }

      const query: GetBidsQuery = {
        _type: 'GetBidsQuery',
        auctionId,
      };

      const result: GetBidsResponse[] = await this.mediator.query(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public deleteBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = req.params.id;
      if (!bidId) {
        res.status(400).json({
          code: 'MISSING_BID_ID',
          message: 'Bid id is required.',
        });
        return;
      }

      const command: DeleteBidCommand = {
        _type: 'DeleteBidCommand',
        bidId,
      };

      await this.mediator.send(command);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
