import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Workspace Endpoints Integration Tests', () => {
  let accessToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    const uniqueEmail = `workspace.tester.${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Workspace Tester',
        email: uniqueEmail,
        password: 'Password123!'
      });

    accessToken = regRes.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
  });

  it('POST /api/v1/workspaces - Should create workspace when authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Engineering Workspace',
        description: 'Testing workspace creation'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workspace.name).toBe('Engineering Workspace');
  });

  it('POST /api/v1/workspaces - Should deny workspace creation without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .send({
        name: 'Unauthorized Workspace'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/workspaces - Should list user workspaces', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.workspaces)).toBe(true);
  });
});