import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config/env';
import { AuditLog } from '../models/audit.model';
import { logger } from '../utils/logger';

const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password
};

export const auditQueue = new Queue('audit-logs-queue', {
  connection: redisConnection
});

export const auditWorker = new Worker(
  'audit-logs-queue',
  async (job: Job) => {
    const { workspaceId, actorId, action, entityType, entityId, details } = job.data;

    await AuditLog.create({
      workspaceId,
      actorId,
      action,
      entityType,
      entityId,
      details
    });

    logger.debug(`Background worker processed audit log for action: ${action}`);
  },
  { connection: redisConnection }
);

auditWorker.on('failed', (job, err) => {
  logger.error(`Audit worker job ${job?.id} failed with error: ${err.message}`);
});