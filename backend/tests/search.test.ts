import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Search Endpoints Integration Tests', () => {
  let accessToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    const email = `search.tester.${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Search Tester',
      email,
      password: 'Password123!'
    });
    accessToken = regRes.body.data.accessToken;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Search Workspace' });
    workspaceId = wsRes.body.data.workspace._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
  });

  it('GET /api/v1/search/workspace/:workspaceId - Should return empty search for blank query', async () => {
    const res = await request(app)
      .get(`/api/v1/search/workspace/${workspaceId}?q=`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/search/workspace/:workspaceId - Should run global search', async () => {
    const res = await request(app)
      .get(`/api/v1/search/workspace/${workspaceId}?q=test`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('cards');
    expect(res.body.data).toHaveProperty('docs');
    expect(res.body.data).toHaveProperty('messages');
  });
});