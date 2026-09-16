import { Channel, IChannel } from '../models/channel.model';
import { Message, IMessage } from '../models/message.model';
import { NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface CursorPaginatedMessages {
  messages: IMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class SlackService {
  /**
   * Create a new workspace channel.
   */
  public static async createChannel(
    workspaceId: string,
    createdBy: string,
    name: string,
    topic?: string,
    isPrivate: boolean = false
  ): Promise<IChannel> {
    const channel = await Channel.create({
      workspaceId,
      name,
      topic,
      isPrivate,
      members: [createdBy]
    });

    logger.info(`Channel created: #${channel.name} (${channel._id}) in workspace ${workspaceId}`);
    return channel;
  }

  /**
   * Get all workspace channels accessible by the user.
   */
  public static async getWorkspaceChannels(workspaceId: string, userId: string): Promise<IChannel[]> {
    return Channel.find({
      workspaceId,
      $or: [{ isPrivate: false }, { members: userId }]
    }).sort({ name: 1 });
  }

  /**
   * Save and return a new chat message.
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

    const message = await Message.create({
      channelId,
      senderId,
      content,
      attachments
    });

    await message.populate('senderId', 'name email avatar');
    logger.info(`Message sent in channel ${channelId} by user ${senderId}`);

    return message;
  }

  /**
   * Retrieve channel messages using Cursor-Based Pagination for high performance.
   */
  public static async getChannelMessages(
    channelId: string,
    limit: number = 30,
    cursor?: string
  ): Promise<CursorPaginatedMessages> {
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
      messages.pop(); // Remove the extra item used for checking pagination availability
    }

    const nextCursor = hasMore && messages.length > 0 ? messages[messages.length - 1]._id.toString() : null;

    return {
      messages: messages.reverse(), // Return chronological order for UI display
      nextCursor,
      hasMore
    };
  }
}