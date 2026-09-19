import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

jest.mock('../src/sockets/socket.handler', () => ({
  getIO: () => ({
    to: () => ({ emit: jest.fn() }),
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
import { Notification } from '../src/models/notification.model';
import { NotificationService } from '../src/services/notification.service';
import { connectDatabase } from '../src/config/db';
import { connectRedis, redisClient } from '../src/config/redis';

describe('Notification Service & Endpoints Tests', () => {
  const testerEmail = `notif_tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  let accessToken: string;
  let userId: string;
  let notifId: string;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();

    // Setup Test User
    await request(app).post('/api/v1/auth/register').send({
      name: 'Notif Tester',
      email: testerEmail,
      password: testPassword,
    });
    const user = await User.findOne({ email: testerEmail });
    if (user) {
      await request(app).post('/api/v1/auth/verify-otp').send({
        email: testerEmail,
        otp: user.emailVerificationOtp,
      });
      userId = user._id.toString();
    }
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testerEmail,
      password: testPassword,
    });
    accessToken = loginRes.body.data.accessToken;

    // Create mock notification
    const createdNotif = await NotificationService.createNotification({
      userId,
      type: 'system',
      title: 'Welcome to CollabSuite',
      message: 'System test notification',
      sendEmail: false,
    });
    if (createdNotif) {
      notifId = createdNotif._id.toString();
    }
  });

  afterAll(async () => {
    await User.deleteOne({ email: testerEmail });
    await Notification.deleteMany({ userId });
    await mongoose.connection.close();
    try {
      await redisClient.quit();
    } catch (err) {
      // Ignore disconnect errors
    }
  });

  it('1. Get User Notifications - Should fetch user notification list', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(res.body.data.notifications.length).toBeGreaterThan(0);
  });

  it('2. Mark As Read - Should mark notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('3. Mark All As Read - Should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('4. Delete One Notification - Should delete single notification', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifications/${notifId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('5. Clear All Notifications - Should clear notifications via service', async () => {
    await NotificationService.clearAll(userId);
    const userNotifs = await Notification.find({ userId });
    expect(userNotifs.length).toBe(0);
  });
});