import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { NotFoundError } from './errors/AppError';
import authRoutes from './routes/auth.routes';

const app: Application = express();

// Security and parser middlewares
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Endpoints
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'CollabSuite API service is operational',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRoutes);

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

export default app;