import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// 1. Mock background queues so production code is NOT touched
jest.mock('../src/queues/audit.queue', () => ({
  auditQueue: { add: jest.fn() },
  auditWorker: null,
  enqueueAuditLog: jest.fn(),
}));

jest.mock('../src/queues/notification.queue', () => ({
  notificationQueue: { add: jest.fn() },
  notificationWorker: null,
  enqueueNotificationEmail: jest.fn(),
}));

import app from '../src/app';
import { User } from '../src/models/user.model';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Auth Service & Endpoints Tests', () => {
  const testEmail = `auth_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let accessToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();
  });

  afterAll(async () => {
    // Cleanup test user and database connections
    await User.deleteOne({ email: testEmail });
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors in test teardown
    }
  });

  it('1. Register - Should create user and send OTP', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Auth Tester',
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('2. Verify OTP - Should mark email as verified', async () => {
    const user = await User.findOne({ email: testEmail });
    expect(user).not.toBeNull();

    const res = await request(app).post('/api/v1/auth/verify-otp').send({
      email: testEmail,
      otp: user?.emailVerificationOtp,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('3. Login - Should authenticate user and return access token', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    accessToken = res.body.data.accessToken;
  });

  it('4. Get Profile - Should retrieve authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('5. Forgot Password - Should generate password reset OTP', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({
      email: testEmail,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('6. Reset Password - Should update password with valid OTP', async () => {
    const user = await User.findOne({ email: testEmail });
    expect(user?.passwordResetOtp).toBeDefined();

    const res = await request(app).post('/api/v1/auth/reset-password').send({
      email: testEmail,
      otp: user?.passwordResetOtp,
      newPassword: 'NewPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('7. Logout - Should logout user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});