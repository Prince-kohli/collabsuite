import { Types } from 'mongoose';
import { Channel, IChannel } from '../models/channel.model';
import { Message, IMessage } from '../models/message.model';
import { Workspace, WorkspaceRole } from '../models/workspace.model';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { getIO } from '../sockets/socket.handler';

// Import Notification Service for handling in-app & socket notifications
import { NotificationService } from './notification.service';

export interface CursorPaginatedMessages {
  messages: IMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class SlackService {
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

  public static async createChannel(
    workspaceId: string,
    createdBy: string,
    name: string,
    topic?: string,
    isPrivate: boolean = false,
    memberIds: string[] = []
  ): Promise<IChannel> {
    await this.getMemberRole(workspaceId, createdBy);

    let initialMembers: string[] = [];

    if (isPrivate) {
      initialMembers = Array.from(new Set([createdBy, ...memberIds.filter(Boolean)]));
      for (const mid of initialMembers) {
        await this.getMemberRole(workspaceId, mid);
      }
    } else {
      // For public channels, add workspace members by default
      const workspace = await Workspace.findById(workspaceId);
      const allWorkspaceMembers = workspace ? workspace.members.map((m) => m.userId.toString()) : [];
      initialMembers = Array.from(
        new Set([createdBy, ...allWorkspaceMembers, ...memberIds.filter(Boolean)])
      );
    }

    const channel = await Channel.create({
      workspaceId,
      name,
      topic: topic || '',
      isPrivate,
      type: 'channel',
      createdBy,
      members: initialMembers
    });

    await channel.populate('members', 'name email avatar');
    await channel.populate('createdBy', 'name email avatar');

    logger.info(`Channel created: #${channel.name} (${channel._id}) by ${createdBy}`);
    return channel;
  }

  public static async createOrGetDM(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string
  ): Promise<IChannel> {
    if (currentUserId === targetUserId) {
      throw new BadRequestError('Cannot start a DM with yourself');
    }

    await this.getMemberRole(workspaceId, currentUserId);
    await this.getMemberRole(workspaceId, targetUserId);

    const sorted = [currentUserId, targetUserId].sort();
    const dmName = `dm-${sorted[0]}-${sorted[1]}`;

    const existing = await Channel.findOne({
      workspaceId,
      type: 'dm',
      name: dmName
    }).populate('members', 'name email avatar');

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

    await channel.populate('members', 'name email avatar');

    logger.info(`DM created between ${currentUserId} and ${targetUserId}`);
    return channel;
  }

  public static async getWorkspaceChannels(
    workspaceId: string,
    userId: string
  ): Promise<IChannel[]> {
    await this.getMemberRole(workspaceId, userId);

    // Only return channels where the user is an active member
    return Channel.find({
      workspaceId,
      members: userId
    })
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ type: 1, name: 1 });
  }

  public static async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

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

    await this.getMemberRole(channel.workspaceId.toString(), senderId);

    // Strictly check if sender is a member of the channel
    const isMember = channel.members.some((m) => m.toString() === senderId.toString());
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    const message = await Message.create({
      channelId,
      senderId,
      content,
      attachments
    });

    await message.populate('senderId', 'name email avatar');
    const senderName = (message.senderId as any)?.name || 'User';

    // Broadcast chat message to active channel room
    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:new', message);
    } catch (err) {
      logger.error('Socket emit failed for message', err);
    }

    // Process real-time notifications in background
    process.nextTick(async () => {
      try {
        const title = channel.type === 'dm' 
          ? `New DM from ${senderName}` 
          : `New message in #${channel.name}`;
          
        const link = `/workspaces/${channel.workspaceId}/channels/${channel._id}`;
        
        // Target ONLY active channel members (excluding sender)
        const targets = channel.members.filter((m) => m.toString() !== senderId.toString());

        for (const targetId of targets) {
          await NotificationService.createNotification({
            userId: targetId.toString(),
            senderId: senderId,
            type: 'message',
            title,
            message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
            link,
            sendEmail: false
          });
        }
      } catch (err) {
        logger.error('Failed to send slack notifications', err);
      }
    });

    logger.info(`Message sent in channel ${channelId} by user ${senderId}`);
    return message;
  }

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

    await this.getMemberRole(channel.workspaceId.toString(), userId);

    // Strictly check membership for reading messages
    const isMember = channel.members.some((m) => m.toString() === userId.toString());
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
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

  public static async removeChannelMember(
    channelId: string,
    userId: string,
    memberIdToRemove: string
  ): Promise<IChannel> {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    if (channel.type === 'dm') {
      throw new BadRequestError('Cannot remove members from a direct message');
    }

    const workspace = await Workspace.findById(channel.workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const userMembership = workspace.members.find((m) => m.userId.toString() === userId);
    if (!userMembership) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    const isWorkspaceOwner = userMembership.role === 'owner' || workspace.ownerId.toString() === userId;
    const channelCreatorId = channel.createdBy.toString();
    const isChannelCreator = channelCreatorId === userId;

    if (!isWorkspaceOwner && !isChannelCreator) {
      throw new ForbiddenError('Only the workspace owner or channel creator can remove members from this group');
    }

    if (memberIdToRemove === userId) {
      throw new BadRequestError('Use the leave channel option instead of removing yourself');
    }

    channel.members = (channel.members as any[]).filter(
      (m) => (m._id ? m._id.toString() : m.toString()) !== memberIdToRemove
    );

    await channel.save();
    await channel.populate('members', 'name email avatar');
    await channel.populate('createdBy', 'name email avatar');

    // Sync member list and tell removed user to leave this channel room
    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('channel:members_updated', channel);
      io.to(`user:${memberIdToRemove}`).emit('channel:member_removed', {
        channelId,
        workspaceId: channel.workspaceId.toString(),
      });
    } catch (err) {
      logger.error('Socket emit failed for channel member remove', err);
    }

    return channel;
  }

  public static async addChannelMember(
    channelId: string,
    userId: string,
    memberIdToAdd: string
  ): Promise<IChannel> {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    if (channel.type === 'dm') {
      throw new BadRequestError('Cannot add members to a direct message');
    }

    const workspace = await Workspace.findById(channel.workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const userMembership = workspace.members.find((m) => m.userId.toString() === userId);
    if (!userMembership) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    const isWorkspaceOwner = userMembership.role === 'owner' || workspace.ownerId.toString() === userId;
    const channelCreatorId = channel.createdBy.toString();
    const isChannelCreator = channelCreatorId === userId;

    if (!isWorkspaceOwner && !isChannelCreator) {
      throw new ForbiddenError('Only the workspace owner or channel creator can add members to this group');
    }

    const targetInWorkspace = workspace.members.some(
      (m) => m.userId.toString() === memberIdToAdd
    );
    if (!targetInWorkspace) {
      throw new BadRequestError('User is not a member of this workspace');
    }

    const alreadyMember = (channel.members as any[]).some(
      (m) => (m._id ? m._id.toString() : m.toString()) === memberIdToAdd
    );

    if (!alreadyMember) {
      channel.members.push(new Types.ObjectId(memberIdToAdd));
      await channel.save();
    }

    await channel.populate('members', 'name email avatar');
    await channel.populate('createdBy', 'name email avatar');

    // Notify other clients so member dropdown stays in sync
    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('channel:members_updated', channel);
    } catch (err) {
      logger.error('Socket emit failed for channel member add', err);
    }

    return channel;
  }
}