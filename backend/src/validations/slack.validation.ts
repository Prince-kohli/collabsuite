import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'workspaceId is required'),
    name: z
      .string()
      .min(1, 'Channel name is required')
      .max(80)
      .regex(/^[a-z0-9-_]+$/, 'Channel name must be lowercase letters, numbers, - or _'),
    topic: z.string().max(250).optional(),
    isPrivate: z.boolean().optional(),
    memberIds: z.array(z.string()).optional()
  })
});

export const createDMSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'workspaceId is required'),
    targetUserId: z.string().min(1, 'targetUserId is required')
  })
});

export const sendMessageSchema = z.object({
  body: z.object({
    channelId: z.string().min(1, 'channelId is required'),
    content: z.string().min(1, 'Message content is required').max(5000),
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

export const addChannelMemberSchema = z.object({
  body: z.object({
    memberId: z.string().min(1, 'memberId is required')
  })
});

export const removeChannelMemberSchema = z.object({
  params: z.object({
    channelId: z.string().min(1, 'channelId is required'),
    memberId: z.string().min(1, 'memberId is required')
  })
});