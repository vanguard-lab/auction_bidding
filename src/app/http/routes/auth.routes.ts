import { Router } from 'express';
import { AuthController } from '../../application/features/auth';
import { validationMiddleware, signupSchema, loginSchema } from '../middleware';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  // Routes will be mounted at /api in main.ts
  router.post('/auth/signup', validationMiddleware(signupSchema), controller.signup);
  router.post('/auth/login', validationMiddleware(loginSchema), controller.login);

  return router;
}
