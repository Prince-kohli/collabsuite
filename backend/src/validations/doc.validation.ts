import { z } from 'zod';

export const createDocSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    title: z.string().optional(),
    parentDocId: z.string().optional().nullable()
  })
});

export const updateDocSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    isPublic: z.boolean().optional(),
    icon: z.string().optional(),
    coverImage: z.string().optional()
  })
});