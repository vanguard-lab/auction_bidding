import express, { Application } from 'express';
import { Router } from 'express';
import { errorMiddleware } from './middleware/error.middleware';
import { createAuthRoutes } from './routes/auth.routes';

/**
 * Creates and configures the Express application.
 */
export function createHttpServer(routes: Router): Application {
  const app = express();

  app.use(express.json());
  app.use(routes);
  app.use(errorMiddleware);

  return app;
}

export * from './middleware';
export * from './routes';
export { createAuthRoutes };
