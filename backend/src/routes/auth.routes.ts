import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validations/auth.validation';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return access/refresh tokens
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access token using a refresh token
 * @access  Public
 */
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Revoke user refresh token session
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get logged-in user profile details
 * @access  Private
 */
router.get('/me', authenticate, getMe);

export default router;