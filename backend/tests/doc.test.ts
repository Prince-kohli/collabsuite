import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Docs Endpoints Integration Tests', () => {
  let accessToken: string;
  let workspaceId: string;
  let docId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    const email = `doc.tester.${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Doc Tester',
      email,
      password: 'Password123!'
    });
    accessToken = regRes.body.data.accessToken;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Docs Workspace' });
    workspaceId = wsRes.body.data.workspace._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
  });

  it('POST /api/v1/docs - Should create a document', async () => {
    const res = await request(app)
      .post('/api/v1/docs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ workspaceId, title: 'Product Spec' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    docId = res.body.data.doc._id;
  });

  it('GET /api/v1/docs/workspace/:workspaceId/tree - Should return docs tree', async () => {
    const res = await request(app)
      .get(`/api/v1/docs/workspace/${workspaceId}/tree`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tree)).toBe(true);
  });

  it('GET /api/v1/docs/:id - Should fetch document', async () => {
    const res = await request(app)
      .get(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /api/v1/docs/:id - Should update document', async () => {
    const res = await request(app)
      .patch(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Spec', content: 'Hello world' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});