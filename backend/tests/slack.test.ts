import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// 1. Mock Socket Handler so socket emissions don't throw errors in test
jest.mock('../src/sockets/socket.handler', () => ({
  getIO: () => ({
    to: () => ({
      emit: jest.fn(),
    }),
  }),
  emitToUser: jest.fn(),
}));

// 2. Mock Background Queues
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
import { Channel } from '../src/models/channel.model';
import { Message } from '../src/models/message.model';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Slack Service & Endpoints Tests', () => {
  const user1Email = `slack_owner_${Date.now()}@example.com`;
  const user2Email = `slack_member_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let user1Token: string;
  let user2Id: string;
  let workspaceId: string;
  let channelId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    // Setup User 1 (Channel Creator)
    await request(app).post('/api/v1/auth/register').send({
      name: 'Slack Creator',
      email: user1Email,
      password: testPassword,
    });
    const u1 = await User.findOne({ email: user1Email });
    if (u1) {
      await request(app).post('/api/v1/auth/verify-otp').send({
        email: user1Email,
        otp: u1.emailVerificationOtp,
      });
    }
    const u1Login = await request(app).post('/api/v1/auth/login').send({
      email: user1Email,
      password: testPassword,
    });
    user1Token = u1Login.body.data.accessToken;

    // Setup User 2 (Member)
    await request(app).post('/api/v1/auth/register').send({
      name: 'Slack Peer',
      email: user2Email,
      password: testPassword,
    });
    const u2 = await User.findOne({ email: user2Email });
    if (u2) {
      await request(app).post('/api/v1/auth/verify-otp').send({
        email: user2Email,
        otp: u2.emailVerificationOtp,
      });
      user2Id = u2._id.toString();
    }

    // Create a Workspace and add User 2 as a member
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Slack Testing Workspace' });
    workspaceId = wsRes.body.data.workspace._id;

    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: user2Email, role: 'member' });
  });

  afterAll(async () => {
    // Cleanup Database
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    if (workspaceId) {
      await Workspace.findByIdAndDelete(workspaceId);
      await Channel.deleteMany({ workspaceId });
      await Message.deleteMany({});
    }
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors
    }
  });

  it('1. Create Channel - Should create a new channel in workspace', async () => {
    const res = await request(app)
      .post('/api/v1/slack/channels')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        workspaceId,
        name: 'testing-channel',
        topic: 'Integration tests channel',
        isPrivate: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.channel.name).toBe('testing-channel');

    channelId = res.body.data.channel._id;
  });

  it('2. Get Workspace Channels - Should list channels for workspace', async () => {
    const res = await request(app)
      .get(`/api/v1/slack/workspace/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.channels)).toBe(true);
    expect(res.body.data.channels.length).toBeGreaterThan(0);
  });

  it('3. Add Member to Channel - Should add user 2 to channel', async () => {
    const res = await request(app)
      .post(`/api/v1/slack/channels/${channelId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        memberId: user2Id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('4. Send Message - Should broadcast message in channel', async () => {
    const res = await request(app)
      .post('/api/v1/slack/messages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        channelId,
        content: 'Hello Slack Test Message!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.content).toBe('Hello Slack Test Message!');
  });

  it('5. Get Channel Messages - Should return messages with cursor pagination', async () => {
    const res = await request(app)
      .get(`/api/v1/slack/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.messages)).toBe(true);
    expect(res.body.data.messages.length).toBeGreaterThan(0);
  });

  it('6. Create or Get DM - Should open a DM channel between two users', async () => {
    const res = await request(app)
      .post('/api/v1/slack/dms')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        workspaceId,
        targetUserId: user2Id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.channel.type).toBe('dm');
  });

  it('7. Remove Member from Channel - Should remove user 2 from channel', async () => {
    const res = await request(app)
      .delete(`/api/v1/slack/channels/${channelId}/members/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('8. Delete Channel - Should delete channel and associated messages', async () => {
    const res = await request(app)
      .delete(`/api/v1/slack/channels/${channelId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});