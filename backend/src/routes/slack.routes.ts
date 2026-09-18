import { Router } from 'express';
import {
  createChannel,
  createOrGetDM,
  getWorkspaceChannels,
  deleteChannel,
  sendMessage,
  getChannelMessages
} from '../controllers/slack.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createChannelSchema,
  createDMSchema,
  sendMessageSchema
} from '../validations/slack.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/slack/channels
 * @desc    Create a new channel
 * @access  Private (Owner, Member)
 */
router.post(
  '/channels',
  requireWorkspaceRole(['owner', 'member']),
  validate(createChannelSchema),
  createChannel
);

/**
 * @route   POST /api/v1/slack/dms
 * @desc    Create or get existing DM
 * @access  Private (Owner, Member)
 */
router.post(
  '/dms',
  requireWorkspaceRole(['owner', 'member']),
  validate(createDMSchema),
  createOrGetDM
);

/**
 * @route   GET /api/v1/slack/workspace/:workspaceId/channels
 * @desc    List accessible channels + DMs
 * @access  Private (Owner, Member, Viewer)
 */
router.get(
  '/workspace/:workspaceId/channels',
  requireWorkspaceRole(['owner', 'member', 'viewer']),
  getWorkspaceChannels
);

/**
 * @route   DELETE /api/v1/slack/channels/:channelId
 * @desc    Delete channel (owner or creator)
 * @access  Private
 */
router.delete('/channels/:channelId', deleteChannel);

/**
 * @route   POST /api/v1/slack/messages
 * @desc    Send message
 * @access  Private (RBAC inside service)
 */
router.post('/messages', validate(sendMessageSchema), sendMessage);

/**
 * @route   GET /api/v1/slack/channels/:channelId/messages
 * @desc    Cursor paginated messages
 * @access  Private
 */
router.get('/channels/:channelId/messages', getChannelMessages);

export default router;