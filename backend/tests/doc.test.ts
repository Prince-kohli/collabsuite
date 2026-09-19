import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Mock background queues & socket
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
import { DocModel } from '../src/models/doc.model';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Doc Service & Endpoints Tests', () => {
  const testerEmail = `doc_tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let accessToken: string;
  let workspaceId: string;
  let docId: string;
  let childDocId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    // Setup Test User
    await request(app).post('/api/v1/auth/register').send({
      name: 'Doc Tester',
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

    // Create Workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Docs Testing Workspace' });
    workspaceId = wsRes.body.data.workspace._id;
  });

  afterAll(async () => {
    await User.deleteOne({ email: testerEmail });
    if (workspaceId) {
      await Workspace.findByIdAndDelete(workspaceId);
      await DocModel.deleteMany({ workspaceId });
    }
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors
    }
  });

  it('1. Create Root Document - Should create a new document in workspace', async () => {
    const res = await request(app)
      .post('/api/v1/docs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workspaceId,
        title: 'Product Requirements Document',
        icon: '📝',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doc.title).toBe('Product Requirements Document');

    docId = res.body.data.doc._id;
  });

  it('2. Get Workspace Docs Tree - Should return nested document tree', async () => {
    const res = await request(app)
      .get(`/api/v1/docs/workspace/${workspaceId}/tree`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tree)).toBe(true);
  });

  it('3. Get Doc by ID - Should return single document details', async () => {
    const res = await request(app)
      .get(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doc._id).toBe(docId);
  });

  it('4. Update Document - Should update title and rich-text content', async () => {
    const res = await request(app)
      .patch(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Updated PRD Specification',
        content: '<p>This is updated document content.</p>',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doc.title).toBe('Updated PRD Specification');
  });

  it('5. Create Child Document - Should create a sub-document nested under parent', async () => {
    const res = await request(app)
      .post('/api/v1/docs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workspaceId,
        title: 'API Specs Sub-Doc',
        parentDocId: docId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doc.parentDocId).toBe(docId);

    childDocId = res.body.data.doc._id;
  });

  it('6. Archive Child Document - Should archive child document', async () => {
    const res = await request(app)
      .delete(`/api/v1/docs/${childDocId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Document archived successfully');
  });

  it('7. Archive Parent Document - Should archive parent document', async () => {
    const res = await request(app)
      .delete(`/api/v1/docs/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Document archived successfully');
  });
});