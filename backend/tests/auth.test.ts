import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Auth Endpoints Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();
    await User.deleteMany({ email: 'test.user@example.com' });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test.user@example.com' });
    await mongoose.connection.close();
    await redisClient.quit();
  });

  const testUser = {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'Password123!',
  };

  it('POST /api/v1/auth/register - Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('POST /api/v1/auth/register - Should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login - Should reject login when email is not verified', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/verify-email - Should verify email address with valid token', async () => {
    const dbUser = await User.findOne({ email: testUser.email });
    expect(dbUser).not.toBeNull();
    const token = dbUser?.emailVerificationToken;

    const res = await request(app)
      .get('/api/v1/auth/verify-email')
      .query({ token });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const verifiedUser = await User.findOne({ email: testUser.email });
    expect(verifiedUser?.isEmailVerified).toBe(true);
  });

  it('POST /api/v1/auth/login - Should authenticate valid credentials after email verification', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('POST /api/v1/auth/login - Should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});