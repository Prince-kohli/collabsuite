import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { redisClient } from '../config/redis';
import { UnauthorizedError } from '../errors/AppError';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generates an Access Token for the user.
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: config.jwt.accessExpiry as any };
  return jwt.sign(payload, config.jwt.accessSecret as Secret, options);
};

/**
 * Generates a Refresh Token and stores it in Redis with TTL.
 */
export const generateRefreshToken = async (payload: TokenPayload): Promise<string> => {
  const options: SignOptions = { expiresIn: config.jwt.refreshExpiry as any };
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret as Secret, options);

  // Store refresh token in Redis with 7 days TTL (604800 seconds)
  const redisKey = `refresh_token:${payload.userId}`;
  await redisClient.set(redisKey, refreshToken, 'EX', 604800);

  return refreshToken;
};

/**
 * Verifies an Access Token.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.accessSecret as Secret) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

/**
 * Verifies a Refresh Token against Redis session store.
 */
export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret as Secret) as TokenPayload;
    const redisKey = `refresh_token:${payload.userId}`;
    const storedToken = await redisClient.get(redisKey);

    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedError('Refresh token revoked or expired session');
    }

    return payload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or revoked refresh token');
  }
};

/**
 * Revokes a user session by deleting the refresh token from Redis.
 */
export const revokeRefreshToken = async (userId: string): Promise<void> => {
  const redisKey = `refresh_token:${userId}`;
  await redisClient.del(redisKey);
};