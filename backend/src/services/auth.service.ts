import { User, IUser } from '../models/user.model';
import { ConflictError, UnauthorizedError, BadRequestError } from '../errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt.util';
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/email.util';
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
    isEmailVerified: boolean;
  };
  tokens?: AuthTokens;
}

export class AuthService {
  /**
   * Helper method to generate a 6-digit numeric OTP.
   */
  private static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Register a new user and send 6-digit OTP email.
   */
  public static async register(name: string, email: string, password: string): Promise<{ message: string; email: string }> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const otp = this.generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpires: otpExpires,
    });

    await sendOtpEmail(user.email, user.name, otp);
    logger.info(`User registered and OTP email sent: ${user.email}`);

    return {
      message: 'Registration successful. Please check your email for 6-digit OTP.',
      email: user.email,
    };
  }

  /**
   * Verify 6-digit OTP code submitted by user.
   */
  public static async verifyOtp(email: string, otp: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email is already verified. Please log in.');
    }

    if (
      !user.emailVerificationOtp ||
      user.emailVerificationOtp !== otp ||
      !user.emailVerificationOtpExpires ||
      user.emailVerificationOtpExpires < new Date()
    ) {
      throw new BadRequestError('Invalid or expired OTP code');
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    logger.info(`OTP verified successfully for: ${user.email}`);
  }

  /**
   * Resend 6-digit OTP to user email.
   */
  public static async resendOtp(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError('User with this email does not exist');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email is already verified');
    }

    const otp = this.generateOtp();
    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOtpEmail(user.email, user.name, otp);
    logger.info(`OTP email resent to: ${user.email}`);
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

    if (!user.isEmailVerified) {
      throw new UnauthorizedError('Please verify your email OTP before logging in');
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
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  public static async refreshAccessToken(token: string): Promise<string> {
    if (!token) {
      throw new BadRequestError('Refresh token required');
    }
    const payload = await verifyRefreshToken(token);
    return generateAccessToken({ userId: payload.userId, email: payload.email });
  }

  public static async logout(userId: string): Promise<void> {
    await revokeRefreshToken(userId);
  }

  public static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }

    /**
   * Start password reset: generate OTP and email it.
   * Always returns success message (do not leak whether email exists).
   */
  public static async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Generic response to avoid email enumeration
    const generic = {
      message: 'If an account exists with this email, a reset OTP has been sent.'
    };

    if (!user) {
      return generic;
    }

    if (!user.isEmailVerified) {
      throw new BadRequestError('Please verify your email before resetting password');
    }

    const otp = this.generateOtp();
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, user.name, otp);
    logger.info(`Password reset OTP sent to: ${user.email}`);

    return generic;
  }

  /**
   * Verify reset OTP and set a new password.
   */
  public static async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password'
    );

    if (!user) {
      throw new BadRequestError('Invalid email or OTP');
    }

    if (
      !user.passwordResetOtp ||
      user.passwordResetOtp !== otp ||
      !user.passwordResetOtpExpires ||
      user.passwordResetOtpExpires < new Date()
    ) {
      throw new BadRequestError('Invalid or expired reset OTP');
    }

    user.password = newPassword;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    await user.save();

    // Invalidate existing refresh sessions after password change
    await revokeRefreshToken(user._id.toString());

    logger.info(`Password reset successful for: ${user.email}`);
  }
}