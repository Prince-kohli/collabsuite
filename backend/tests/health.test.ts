import { describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';

// Mock background queues to prevent open handles
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

describe('Health Check API', () => {
  it('GET /api/v1/health - Should return 200 operational status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('CollabSuite API service is operational');
  });
});