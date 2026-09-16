import { Router } from 'express';
import {
  createChannel,
  getWorkspaceChannels,
  sendMessage,
  getChannelMessages
} from '../controllers/slack.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createChannelSchema, sendMessageSchema } from '../validations/slack.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/slack/channels
 * @desc    Create a new channel
 * @access  Private
 */
router.post('/channels', validate(createChannelSchema), createChannel);

/**
 * @route   GET /api/v1/slack/workspace/:workspaceId/channels
 * @desc    Get user accessible channels in a workspace
 * @access  Private
 */
router.get('/workspace/:workspaceId/channels', getWorkspaceChannels);

/**
 * @route   POST /api/v1/slack/messages
 * @desc    Send a new chat message
 * @access  Private
 */
router.post('/messages', validate(sendMessageSchema), sendMessage);

/**
 * @route   GET /api/v1/slack/channels/:channelId/messages
 * @desc    Get channel messages with cursor pagination
 * @access  Private
 */
router.get('/channels/:channelId/messages', getChannelMessages);

export default router;