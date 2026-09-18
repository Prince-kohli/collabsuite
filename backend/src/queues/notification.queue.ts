import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config/env';
import { sendNotificationEmail } from '../utils/email.util';
import { logger } from '../utils/logger';

const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password
};

export const notificationQueue = new Queue('notification-email-queue', {
  connection: redisConnection
});

export const notificationWorker = new Worker(
  'notification-email-queue',
  async (job: Job) => {
    const { toEmail, title, message, link } = job.data;
    await sendNotificationEmail(toEmail, title, message, link);
    logger.debug(`Notification email job processed for: ${toEmail}`);
  },
  { connection: redisConnection }
);

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification worker job ${job?.id} failed: ${err.message}`);
});

/**
 * Enqueue notification email (non-blocking).
 */
export const enqueueNotificationEmail = async (data: {
  toEmail: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> => {
  await notificationQueue.add('send-notification-email', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50
  });
};