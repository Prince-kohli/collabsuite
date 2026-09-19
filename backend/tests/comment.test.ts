import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

jest.mock('../src/sockets/socket.handler', () => ({
  getIO: () => ({
    to: () => ({ emit: jest.fn() }),
  }),
  emitToUser: jest.fn(),
  emitToCard: jest.fn(),
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
import { Comment } from '../src/models/comment.model';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Comment Service & Endpoints Tests', () => {
  const testerEmail = `comment_tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let accessToken: string;
  let workspaceId: string;
  let boardId: string;
  let listId: string;
  let cardId: string;
  let commentId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    // Setup Test User
    await request(app).post('/api/v1/auth/register').send({
      name: 'Comment Tester',
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

    // Create Workspace, Board, List & Card
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Comment Workspace' });
    workspaceId = wsRes.body.data.workspace._id;

    const boardRes = await request(app)
      .post('/api/v1/trello/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ workspaceId, title: 'Comment Board' });
    boardId = boardRes.body.data.board._id;

    const listRes = await request(app)
      .post('/api/v1/trello/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ boardId, title: 'To Do' });
    listId = listRes.body.data.list._id;

    const cardRes = await request(app)
      .post('/api/v1/trello/cards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ listId, boardId, title: 'Card For Comments' });
    cardId = cardRes.body.data.card._id;
  });

  afterAll(async () => {
    await User.deleteOne({ email: testerEmail });
    if (workspaceId) {
      await Workspace.findByIdAndDelete(workspaceId);
      await Board.deleteMany({ workspaceId });
      await List.deleteMany({ boardId });
      await Card.deleteMany({ boardId });
      await Comment.deleteMany({ cardId });
    }
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors
    }
  });

  it('1. Add Comment - Should add a comment to the card', async () => {
    const res = await request(app)
      .post(`/api/v1/trello/cards/${cardId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'This is a test comment.' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.content).toBe('This is a test comment.');

    commentId = res.body.data.comment._id;
  });

  it('2. Get Card Comments - Should fetch all comments for the card', async () => {
    const res = await request(app)
      .get(`/api/v1/trello/cards/${cardId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
    expect(res.body.data.comments.length).toBeGreaterThan(0);
  });

  it('3. Delete Comment - Should remove comment from card', async () => {
    const res = await request(app)
      .delete(`/api/v1/trello/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});