import { User, IUser } from '../models/user.model';
import { ConflictError, UnauthorizedError, BadRequestError } from '../errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt.util';
import { logger } from '../utils/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * Register a new user account.
   */
  public static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const user = await User.create({ name, email, password });
    const payload = { userId: user._id.toString(), email: user.email };

    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    logger.info(`User registered successfully: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      tokens: { accessToken, refreshToken }
    };
  }

  /**
   * Authenticate user credentials and return tokens.
   */
  public static async login(email: string, password: string): Promise<AuthResponse> {
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

    logger.info(`User logged in successfully: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      tokens: { accessToken, refreshToken }
    };
  }

  /**
   * Issue a new access token using a refresh token.
   */
  public static async refreshAccessToken(token: string): Promise<string> {
    if (!token) {
      throw new BadRequestError('Refresh token required');
    }

    const payload = await verifyRefreshToken(token);
    return generateAccessToken({ userId: payload.userId, email: payload.email });
  }

  /**
   * Revoke user session from Redis.
   */
  public static async logout(userId: string): Promise<void> {
    await revokeRefreshToken(userId);
  }

  /**
   * Get user profile details by ID.
   */
  public static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }
}