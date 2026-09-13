import { Router } from 'express';
import { AuctionsController } from '../../application/features/auctions';
import { validationMiddleware, placeBidSchema, createAuthGuard, AuthenticatedRequest } from '../middleware';
import { loadConfig } from '../../configuration';

/**
 * Auctions routes.
 */
export function createAuctionsRoutes(controller: AuctionsController): Router {
  const config = loadConfig();
  const authGuard = createAuthGuard(config.jwtSecret);
  const router = Router();

  // POST /bid (protected)
  router.post('/bid', authGuard, validationMiddleware(placeBidSchema), controller.placeBid);

  // GET /auctions (public)
  router.get('/auctions', controller.listAuctions);

  // GET /auctions/:id (public)
  router.get('/auctions/:id', controller.getAuction);

  // GET /auctions/:id/bids (public)
  router.get('/auctions/:id/bids', controller.getBids);

  // DELETE /bids/:id (protected)
  router.delete('/bids/:id', authGuard, controller.deleteBid);

  return router;
}
