import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { ConflictError, UnauthorizedError, BadRequestError } from '../errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt.util';
import { logger } from '../utils/logger';

/**
 * Register a new user account.
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const user = await User.create({ name, email, password });

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info(`User registered successfully: ${user.email}`);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user and return tokens.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info(`User logged in successfully: ${user.email}`);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User logged in successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue a new access token using a valid refresh token.
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      throw new BadRequestError('Refresh token required');
    }

    const payload = await verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({ userId: payload.userId, email: payload.email });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke session and logout user.
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await revokeRefreshToken(req.user.userId);
    }

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User context missing');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};