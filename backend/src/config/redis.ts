import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';


export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
  maxRetriesPerRequest: null
});

/**
 * Connects to Redis cache server.
 */
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
  }

  redisClient.on('error', (err) => {
    logger.error('Redis client error occurred', { error: err.message });
  });
};