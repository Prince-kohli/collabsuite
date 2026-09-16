import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    name: z.string().min(2, 'Channel name must be at least 2 characters').max(80),
    topic: z.string().max(250).optional(),
    isPrivate: z.boolean().optional()
  })
});

export const sendMessageSchema = z.object({
  body: z.object({
    channelId: z.string().min(1, 'Channel ID is required'),
    content: z.string().min(1, 'Message content cannot be empty'),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          size: z.number()
        })
      )
      .optional()
  })
});