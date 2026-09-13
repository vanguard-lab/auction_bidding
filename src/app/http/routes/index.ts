import { Router } from 'express';
import { createAuctionsRoutes } from './auctions.routes';
import { createAuthRoutes } from './auth.routes';
import { AuctionsController } from '../../application/features/auctions';
import { AuthController } from '../../application/features/auth';

/**
 * Application routes composition.
 */
export function createRoutes(auctionsController: AuctionsController, authController: AuthController): Router {
  const router = Router();

  // Mount routes under /api
  router.use('/api', createAuctionsRoutes(auctionsController));
  router.use('/api', createAuthRoutes(authController));

  return router;
}
