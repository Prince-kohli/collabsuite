import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/db';
import { connectRedis } from './config/redis';
import { initializeSocketIO } from './sockets/socket.handler';
import { logger } from './utils/logger';

// Catch Uncaught Exceptions and print FULL stack trace before exit
process.on('uncaughtException', (error: Error) => {
  console.error('=== BACKEND CRASH ERROR STACK ===');
  console.error(error);
  logger.error('Uncaught Exception detected', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('=== UNHANDLED REJECTION STACK ===');
  console.error(reason);
  logger.error('Unhandled Rejection detected', { error: reason });
  process.exit(1);
});

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

startServer();