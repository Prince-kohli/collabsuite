import { z } from 'zod';

export const createBoardSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    title: z.string().min(1, 'Board title is required').max(100),
    description: z.string().max(500).optional()
  })
});

export const createListSchema = z.object({
  body: z.object({
    boardId: z.string().min(1, 'Board ID is required'),
    title: z.string().min(1, 'List title is required').max(100),
    position: z.number().nonnegative().optional()
  })
});

export const createCardSchema = z.object({
  body: z.object({
    listId: z.string().min(1, 'List ID is required'),
    boardId: z.string().min(1, 'Board ID is required'),
    title: z.string().min(1, 'Card title is required').max(200),
    description: z.string().optional(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().optional()
  })
});

export const moveCardSchema = z.object({
  body: z.object({
    targetListId: z.string().min(1, 'Target List ID is required'),
    newPosition: z.number().nonnegative('Position must be 0 or greater')
  })
});

export const updateCardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional()
  })
});