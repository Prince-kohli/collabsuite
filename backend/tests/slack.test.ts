import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Slack Endpoints Integration Tests', () => {
  let accessToken: string;
  let workspaceId: string;
  let channelId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    const email = `slack.tester.${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Slack Tester',
      email,
      password: 'Password123!'
    });
    accessToken = regRes.body.data.accessToken;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Slack Workspace' });
    workspaceId = wsRes.body.data.workspace._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
  });

  it('POST /api/v1/slack/channels - Should create a channel', async () => {
    const res = await request(app)
      .post('/api/v1/slack/channels')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ workspaceId, name: 'general', topic: 'Team chat' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    channelId = res.body.data.channel._id;
  });

  it('GET /api/v1/slack/workspace/:workspaceId/channels - Should list channels', async () => {
    const res = await request(app)
      .get(`/api/v1/slack/workspace/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.channels)).toBe(true);
  });

  it('POST /api/v1/slack/messages - Should send a message', async () => {
    const res = await request(app)
      .post('/api/v1/slack/messages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ channelId, content: 'Hello team' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/slack/channels/:channelId/messages - Should fetch messages', async () => {
    const res = await request(app)
      .get(`/api/v1/slack/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.messages)).toBe(true);
  });
});