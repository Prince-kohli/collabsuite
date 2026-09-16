import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';


/**
 * Connects to MongoDB database.
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Reconnecting...');
  });
};