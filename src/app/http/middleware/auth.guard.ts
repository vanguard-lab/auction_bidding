import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export function createAuthGuard(jwtSecret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header.',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verify(token, jwtSecret) as { sub: string };
      req.user = { id: decoded.sub };
      next();
    } catch {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token.',
      });
    }
  };
}
