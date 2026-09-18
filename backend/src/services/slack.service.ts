import { Channel, IChannel } from '../models/channel.model';
import { Message, IMessage } from '../models/message.model';
import { Workspace, WorkspaceRole } from '../models/workspace.model';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { getIO } from '../sockets/socket.handler';

export interface CursorPaginatedMessages {
  messages: IMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class SlackService {
  /**
   * Resolve workspace membership and role for a user.
   */
  private static async getMemberRole(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceRole> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const member = workspace.members.find((m) => m.userId.toString() === userId);
    if (!member) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    return member.role;
  }

  /**
   * Ensure user can write (Owner or Member). Viewers are blocked.
   */
  private static assertCanWrite(role: WorkspaceRole): void {
    if (role === 'viewer') {
      throw new ForbiddenError('Viewers have read-only access in Slack');
    }
  }

  /**
   * Create a new workspace channel (public or private).
   */
  public static async createChannel(
    workspaceId: string,
    createdBy: string,
    name: string,
    topic?: string,
    isPrivate: boolean = false
  ): Promise<IChannel> {
    const role = await this.getMemberRole(workspaceId, createdBy);
    this.assertCanWrite(role);

    const channel = await Channel.create({
      workspaceId,
      name,
      topic: topic || '',
      isPrivate,
      type: 'channel',
      createdBy,
      members: [createdBy]
    });

    logger.info(`Channel created: #${channel.name} (${channel._id}) by ${createdBy}`);
    return channel;
  }

  /**
   * Create or reuse a 1-on-1 DM channel between two workspace members.
   */
  public static async createOrGetDM(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string
  ): Promise<IChannel> {
    if (currentUserId === targetUserId) {
      throw new BadRequestError('Cannot start a DM with yourself');
    }

    const role = await this.getMemberRole(workspaceId, currentUserId);
    this.assertCanWrite(role);

    // Target must also be a workspace member
    await this.getMemberRole(workspaceId, targetUserId);

    // Deterministic DM name so duplicates are avoided
    const sorted = [currentUserId, targetUserId].sort();
    const dmName = `dm-${sorted[0]}-${sorted[1]}`;

    const existing = await Channel.findOne({
      workspaceId,
      type: 'dm',
      name: dmName
    });

    if (existing) {
      return existing;
    }

    const channel = await Channel.create({
      workspaceId,
      name: dmName,
      topic: 'Direct Message',
      isPrivate: true,
      type: 'dm',
      createdBy: currentUserId,
      members: [currentUserId, targetUserId]
    });

    logger.info(`DM created between ${currentUserId} and ${targetUserId}`);
    return channel;
  }

  /**
   * Get workspace channels accessible by the user.
   * Public channels + private/DM where user is a member.
   */
  public static async getWorkspaceChannels(
    workspaceId: string,
    userId: string
  ): Promise<IChannel[]> {
    // Must be workspace member (any role including viewer)
    await this.getMemberRole(workspaceId, userId);

    return Channel.find({
      workspaceId,
      $or: [
        { type: 'channel', isPrivate: false },
        { members: userId }
      ]
    }).sort({ type: 1, name: 1 });
  }

  /**
   * Delete/archive channel — Workspace Owner OR channel creator only.
   */
  public static async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // DMs should not be deleted via this flow (optional hard rule)
    if (channel.type === 'dm') {
      throw new ForbiddenError('Direct message threads cannot be deleted');
    }

    const role = await this.getMemberRole(channel.workspaceId.toString(), userId);
    const isCreator = channel.createdBy.toString() === userId;
    const isWorkspaceOwner = role === 'owner';

    if (!isWorkspaceOwner && !isCreator) {
      throw new ForbiddenError('Only the workspace owner or channel creator can delete this channel');
    }

    await Message.deleteMany({ channelId: channel._id });
    await Channel.findByIdAndDelete(channelId);

    logger.info(`Channel deleted: ${channelId} by ${userId}`);
  }

  /**
   * Save message, enforce RBAC, broadcast via socket.
   */
  public static async sendMessage(
    channelId: string,
    senderId: string,
    content: string,
    attachments: any[] = []
  ): Promise<IMessage> {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    const role = await this.getMemberRole(channel.workspaceId.toString(), senderId);
    this.assertCanWrite(role);

    // Private / DM: sender must be a channel member
    if (channel.isPrivate || channel.type === 'dm') {
      const isMember = channel.members.some((m) => m.toString() === senderId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this channel');
      }
    }

    const message = await Message.create({
      channelId,
      senderId,
      content,
      attachments
    });

    await message.populate('senderId', 'name email avatar');

    // Realtime broadcast to channel room
    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:new', message);
    } catch {
      // Socket may not be ready in tests — ignore
    }

    logger.info(`Message sent in channel ${channelId} by user ${senderId}`);
    return message;
  }

  /**
   * Cursor-based message pagination.
   */
  public static async getChannelMessages(
    channelId: string,
    userId: string,
    limit: number = 30,
    cursor?: string
  ): Promise<CursorPaginatedMessages> {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Must belong to workspace
    await this.getMemberRole(channel.workspaceId.toString(), userId);

    if (channel.isPrivate || channel.type === 'dm') {
      const isMember = channel.members.some((m) => m.toString() === userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this channel');
      }
    }

    const query: any = { channelId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('senderId', 'name email avatar');

    let hasMore = false;
    if (messages.length > limit) {
      hasMore = true;
      messages.pop();
    }

    const nextCursor =
      hasMore && messages.length > 0 ? messages[messages.length - 1]._id.toString() : null;

    return {
      messages: messages.reverse(),
      nextCursor,
      hasMore
    };
  }
}