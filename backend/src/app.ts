import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { NotFoundError } from './errors/AppError';
import { swaggerSpec } from './config/swagger';

import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import trelloRoutes from './routes/trello.routes';
import docRoutes from './routes/doc.routes';
import slackRoutes from './routes/slack.routes';
import searchRoutes from './routes/search.routes';
import notificationRoutes from './routes/notification.routes';

// Start background workers
import './queues/audit.queue';
import './queues/notification.queue';

const app: Application = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploaded files (Attachments / Avatars)
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Interactive Swagger OpenAPI Documentation UI Endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'CollabSuite API service is operational',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/trello', trelloRoutes);
app.use('/api/v1/docs', docRoutes);
app.use('/api/v1/slack', slackRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

app.use(errorHandler);

export default app;