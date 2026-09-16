import { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';
import { AppError } from '../errors/AppError';


/**
 * Global centralized error handling middleware.
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message
    });
    return;
  }

  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error occurred'
      : err.message
  });
};