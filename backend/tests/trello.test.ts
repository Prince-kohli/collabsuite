import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Mock background queues and socket handler to prevent open handles during tests
jest.mock('../src/sockets/socket.handler', () => ({
  getIO: () => ({
    to: () => ({
      emit: jest.fn(),
    }),
  }),
  emitToUser: jest.fn(),
}));

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
import { Workspace } from '../src/models/workspace.model';
import { Board } from '../src/models/board.model';
import { List } from '../src/models/list.model';
import { Card } from '../src/models/card.model';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Trello Service & Endpoints Tests', () => {
  const testerEmail = `trello_tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let accessToken: string;
  let workspaceId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    // Setup Test User
    await request(app).post('/api/v1/auth/register').send({
      name: 'Trello Tester',
      email: testerEmail,
      password: testPassword,
    });
    const user = await User.findOne({ email: testerEmail });
    if (user) {
      await request(app).post('/api/v1/auth/verify-otp').send({
        email: testerEmail,
        otp: user.emailVerificationOtp,
      });
    }
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testerEmail,
      password: testPassword,
    });
    accessToken = loginRes.body.data.accessToken;

    // Create a Workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Trello Testing Workspace' });
    workspaceId = wsRes.body.data.workspace._id;
  });

  afterAll(async () => {
    // Cleanup database
    await User.deleteOne({ email: testerEmail });
    if (workspaceId) {
      await Workspace.findByIdAndDelete(workspaceId);
      await Board.deleteMany({ workspaceId });
      await List.deleteMany({});
      await Card.deleteMany({});
    }
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors
    }
  });

  it('1. Create Board - Should create a new Trello board', async () => {
    const res = await request(app)
      .post('/api/v1/trello/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ workspaceId, title: 'Sprint Board', description: 'Kanban Sprint Board' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.board.title).toBe('Sprint Board');

    boardId = res.body.data.board._id;
  });

  it('2. Get Workspace Boards - Should list all boards in workspace', async () => {
    const res = await request(app)
      .get(`/api/v1/trello/boards?workspaceId=${workspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.boards)).toBe(true);
    expect(res.body.data.boards.length).toBeGreaterThan(0);
  });

  it('3. Get Board Details - Should return board with lists and cards', async () => {
    const res = await request(app)
      .get(`/api/v1/trello/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.board._id).toBe(boardId);
  });

  it('4. Update Board - Should update board title and description', async () => {
    const res = await request(app)
      .patch(`/api/v1/trello/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Sprint Board', description: 'Updated Description' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.board.title).toBe('Updated Sprint Board');
  });

  it('5. Create List - Should create a new column/list', async () => {
    const res = await request(app)
      .post('/api/v1/trello/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ boardId, title: 'In Progress' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.list.title).toBe('In Progress');

    listId = res.body.data.list._id;
  });

  it('6. Update List - Should update list title', async () => {
    const res = await request(app)
      .patch(`/api/v1/trello/lists/${listId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Doing' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.list.title).toBe('Doing');
  });

  it('7. Create Card - Should create a card in list', async () => {
    const res = await request(app)
      .post('/api/v1/trello/cards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ listId, boardId, title: 'Setup CI/CD Pipeline', description: 'Configure GitHub Actions' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card.title).toBe('Setup CI/CD Pipeline');

    cardId = res.body.data.card._id;
  });

  it('8. Update Card - Should update card details', async () => {
    const res = await request(app)
      .patch(`/api/v1/trello/cards/${cardId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Setup GitHub Actions CI/CD', description: 'Updated description', labels: ['DevOps'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.card.title).toBe('Setup GitHub Actions CI/CD');
  });

  it('9. Move Card - Should move card position', async () => {
    const res = await request(app)
      .patch(`/api/v1/trello/cards/${cardId}/move`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetListId: listId, newPosition: 0 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('10. Get Card Activities - Should fetch card audit activities', async () => {
    const res = await request(app)
      .get(`/api/v1/trello/cards/${cardId}/activities`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.activities)).toBe(true);
  });

  it('11. Delete Card - Should delete specified card', async () => {
    const res = await request(app)
      .delete(`/api/v1/trello/cards/${cardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('12. Delete List - Should delete list and its cards', async () => {
    const res = await request(app)
      .delete(`/api/v1/trello/lists/${listId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('13. Delete Board - Should delete board and its resources', async () => {
    const res = await request(app)
      .delete(`/api/v1/trello/boards/${boardId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});