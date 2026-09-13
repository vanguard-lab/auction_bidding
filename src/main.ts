import { createHttpServer, createRoutes, PlaceBidValidator } from './app/http';
import { AuctionsController, PlaceBidHandler, GetAuctionHandler, GetBidsHandler, DeleteBidHandler, ListAuctionsHandler } from './app/application/features/auctions';
import { AuthController, SignupHandler, LoginHandler } from './app/application/features/auth';
import { Mediator } from './app/application/shared/cqrs';
import { createInfrastructure, Infrastructure } from './infrastructure';
import { loadConfig } from './app/configuration';
import { Application } from 'express';
import { SignupValidator, LoginValidator } from './app/http/middleware';
import { JwtService } from './infrastructure/security';
import { PasswordService } from './infrastructure/security';

/**
 * Composition root.
 * Assembles the dependency graph explicitly with no global mutable state.
 */
export async function composeApplication(): Promise<{ app: Application; infrastructure: Infrastructure }> {
  // 1. Configuration
  const config = loadConfig();

  // 2. Infrastructure layer (database, repositories)
  const infrastructure = await createInfrastructure({
    host: config.dbHost,
    port: config.dbPort,
    username: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
  });

  // 3. Application layer (handlers)
  const placeBidHandler = new PlaceBidHandler(
    infrastructure.auctionRepository,
    infrastructure.bidRepository
  );

  const getAuctionHandler = new GetAuctionHandler(
    infrastructure.auctionRepository
  );

  const getBidsHandler = new GetBidsHandler(
    infrastructure.bidRepository
  );

  const deleteBidHandler = new DeleteBidHandler(
    infrastructure.bidRepository
  );

  const listAuctionsHandler = new ListAuctionsHandler(
    infrastructure.auctionRepository
  );

  // 4. Mediator (registers handlers)
  const mediator = new Mediator();
  mediator.register('PlaceBidCommand', placeBidHandler);
  mediator.register('GetAuctionQuery', getAuctionHandler);
  mediator.register('GetBidsQuery', getBidsHandler);
  mediator.register('DeleteBidCommand', deleteBidHandler);
  mediator.register('ListAuctionsQuery', listAuctionsHandler);

  // 5. Controllers (HTTP boundary)
  const placeBidValidator = new PlaceBidValidator();
  const auctionsController = new AuctionsController(mediator, placeBidValidator);
  
  const jwtService = new JwtService(config.jwtSecret, config.jwtExpiresIn);
  const passwordService = new PasswordService();
  const signupValidator = new SignupValidator();
  const loginValidator = new LoginValidator();
  const authController = new AuthController(mediator, signupValidator, loginValidator);

  // 6. Register auth handlers
  const signupHandler = new SignupHandler(infrastructure.userRepository, passwordService, jwtService);
  const loginHandler = new LoginHandler(infrastructure.userRepository, passwordService, jwtService);
  mediator.register('SignupCommand', signupHandler);
  mediator.register('LoginCommand', loginHandler);

  // 7. Routes
  const router = createRoutes(auctionsController, authController);

  // 8. HTTP server
  const app = createHttpServer(router);

  return { app, infrastructure };
}

/**
 * Main entry point.
 */
export async function main(): Promise<void> {
  const config = loadConfig();
  const { app } = await composeApplication();

  app.listen(config.port, () => {
    console.log(`Auction bidding backend running on port ${config.port}`);
  });
}
