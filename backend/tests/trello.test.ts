import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Trello Endpoints Integration Tests', () => {
  let accessToken: string;
  let workspaceId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    const email = `trello.tester.${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Trello Tester',
      email,
      password: 'Password123!'
    });
    accessToken = regRes.body.data.accessToken;

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Trello Workspace' });
    workspaceId = wsRes.body.data.workspace._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
  });

  it('POST /api/v1/trello/boards - Should create a board', async () => {
    const res = await request(app)
      .post('/api/v1/trello/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ workspaceId, title: 'Sprint Board' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    boardId = res.body.data.board._id;
  });

  it('POST /api/v1/trello/lists - Should create a list', async () => {
    const res = await request(app)
      .post('/api/v1/trello/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ boardId, title: 'To Do' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    listId = res.body.data.list._id;
  });

  it('POST /api/v1/trello/cards - Should create a card', async () => {
    const res = await request(app)
      .post('/api/v1/trello/cards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ listId, boardId, title: 'Implement Auth' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    cardId = res.body.data.card._id;
  });

  it('GET /api/v1/trello/boards/:id - Should fetch board details', async () => {
    const res = await request(app)
      .get(`/api/v1/trello/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.board._id).toBe(boardId);
  });

  it('PATCH /api/v1/trello/cards/:id/move - Should move card', async () => {
    const res = await request(app)
      .patch(`/api/v1/trello/cards/${cardId}/move`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetListId: listId, newPosition: 0 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});