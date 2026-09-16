import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Controller handler for user registration.
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const result = await AuthService.register(name, email, password);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler for user login.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User logged in successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to refresh access token.
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const accessToken = await AuthService.refreshAccessToken(token);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Access token refreshed successfully',
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to logout user.
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await AuthService.logout(req.user.userId);
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
 * Controller handler to fetch current user profile.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User context missing');
    }

    const user = await AuthService.getProfile(req.user.userId);

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