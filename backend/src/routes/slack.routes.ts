import { Router } from 'express';
import {
  createChannel,
  createOrGetDM,
  getWorkspaceChannels,
  deleteChannel,
  sendMessage,
  getChannelMessages,
  addChannelMember,
  removeChannelMember
} from '../controllers/slack.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createChannelSchema,
  createDMSchema,
  sendMessageSchema,
  addChannelMemberSchema,
  removeChannelMemberSchema
} from '../validations/slack.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/slack/channels
 * @desc    Create a new channel
 */
router.post(
  '/channels',
  requireWorkspaceRole(['owner', 'member', 'viewer']),
  validate(createChannelSchema),
  createChannel
);

/**
 * @route   POST /api/v1/slack/dms
 * @desc    Create or get existing DM
 */
router.post(
  '/dms',
  requireWorkspaceRole(['owner', 'member', 'viewer']),
  validate(createDMSchema),
  createOrGetDM
);

/**
 * @route   GET /api/v1/slack/workspace/:workspaceId/channels
 * @desc    List accessible channels + DMs
 */
router.get(
  '/workspace/:workspaceId/channels',
  requireWorkspaceRole(['owner', 'member', 'viewer']),
  getWorkspaceChannels
);

/**
 * @route   POST /api/v1/slack/messages
 * @desc    Send message
 */
router.post('/messages', validate(sendMessageSchema), sendMessage);

/**
 * @route   GET /api/v1/slack/channels/:channelId/messages
 * @desc    Cursor paginated messages
 */
router.get('/channels/:channelId/messages', getChannelMessages);

/**
 * @route   POST /api/v1/slack/channels/:channelId/members
 * @desc    Add a member to a channel
 */
router.post(
  '/channels/:channelId/members',
  validate(addChannelMemberSchema),
  addChannelMember
);

/**
 * @route   DELETE /api/v1/slack/channels/:channelId/members/:memberId
 * @desc    Remove a member from a channel
 */
router.delete(
  '/channels/:channelId/members/:memberId',
  validate(removeChannelMemberSchema),
  removeChannelMember
);

/**
 * @route   DELETE /api/v1/slack/channels/:channelId
 * @desc    Delete channel (owner or creator)
 */
router.delete('/channels/:channelId', deleteChannel);

export default router;