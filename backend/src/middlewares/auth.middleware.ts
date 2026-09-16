import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { verifyAccessToken } from '../utils/jwt.util';

/**
 * Authentication middleware to verify JWT access tokens on protected routes.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    next(new UnauthorizedError('Authentication token missing'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};