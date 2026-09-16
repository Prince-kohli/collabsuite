import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slack.service';

export const createChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId, name, topic, isPrivate } = req.body;
    const userId = req.user!.userId;
    const channel = await SlackService.createChannel(workspaceId, userId, name, topic, isPrivate);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Channel created successfully',
      data: { channel }
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.userId;
    const channels = await SlackService.getWorkspaceChannels(workspaceId, userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workspace channels retrieved successfully',
      data: { channels }
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { channelId, content, attachments } = req.body;
    const senderId = req.user!.userId;
    const message = await SlackService.sendMessage(channelId, senderId, content, attachments);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

export const getChannelMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const cursor = req.query.cursor as string | undefined;

    const data = await SlackService.getChannelMessages(channelId, limit, cursor);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Channel messages retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};