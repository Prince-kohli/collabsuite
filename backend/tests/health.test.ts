import request from 'supertest';
import app from '../src/app';

describe('GET /api/v1/health', () => {
  it('should return 200 operational status payload', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'CollabSuite API service is operational');
    expect(response.body).toHaveProperty('timestamp');
  });
});