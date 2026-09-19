import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Mock background queues so production code is NOT touched
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
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Workspace Service & Endpoints Tests', () => {
  const ownerEmail = `ws_owner_${Date.now()}@example.com`;
  const memberEmail = `ws_member_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let ownerToken: string;
  let memberId: string;
  let workspaceId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    // 1. Setup Workspace Owner User
    await request(app).post('/api/v1/auth/register').send({
      name: 'WS Owner',
      email: ownerEmail,
      password: testPassword,
    });
    const ownerUser = await User.findOne({ email: ownerEmail });
    if (ownerUser) {
      await request(app).post('/api/v1/auth/verify-otp').send({
        email: ownerEmail,
        otp: ownerUser.emailVerificationOtp,
      });
    }
    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: ownerEmail,
      password: testPassword,
    });
    ownerToken = ownerLogin.body.data.accessToken;

    // 2. Setup Secondary Member User
    await request(app).post('/api/v1/auth/register').send({
      name: 'WS Member',
      email: memberEmail,
      password: testPassword,
    });
    const memberUser = await User.findOne({ email: memberEmail });
    if (memberUser) {
      await request(app).post('/api/v1/auth/verify-otp').send({
        email: memberEmail,
        otp: memberUser.emailVerificationOtp,
      });
      memberId = memberUser._id.toString();
    }
  });

  afterAll(async () => {
    // Cleanup test users & created workspace
    await User.deleteMany({ email: { $in: [ownerEmail, memberEmail] } });
    if (workspaceId) {
      await Workspace.findByIdAndDelete(workspaceId);
    }
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors
    }
  });

  it('1. Create Workspace - Should create a new workspace (Owner)', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Test Workspace',
        description: 'Workspace for unit testing',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workspace.name).toBe('Test Workspace');

    workspaceId = res.body.data.workspace._id;
  });

  it('2. Create Workspace - Should deny creation without auth token', async () => {
    const res = await request(app).post('/api/v1/workspaces').send({
      name: 'Unauthorized Workspace',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. Get User Workspaces - Should list workspaces for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.workspaces)).toBe(true);
    expect(res.body.data.workspaces.length).toBeGreaterThan(0);
  });

  it('4. Get Workspace by ID - Should return single workspace details', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workspace._id).toBe(workspaceId);
    expect(res.body.data.currentUserRole).toBe('owner');
  });

  it('5. Update Workspace - Should update workspace name and description', async () => {
    const res = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Updated Workspace Name',
        description: 'Updated Description',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workspace.name).toBe('Updated Workspace Name');
  });

  it('6. Add Member - Should invite user to workspace', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: memberEmail,
        role: 'member',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('7. Update Member Role - Should change member role to viewer', async () => {
    const res = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        role: 'viewer',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('8. Remove Member - Should remove member from workspace', async () => {
    const res = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('9. Delete Workspace - Should delete workspace and resources (Owner)', async () => {
    const res = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});