import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/db';
import { connectRedis } from './config/redis';
import { initializeSocketIO } from './sockets/socket.handler';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize real-time Socket.io server
export const io = initializeSocketIO(server);

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();

  server.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  });
};

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection detected', { error: reason });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception detected', { error });
  process.exit(1);
});

startServer();