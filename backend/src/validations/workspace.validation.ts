import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
    description: z.string().max(500).optional()
  })
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional()
  })
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address required'),
    role: z.enum(['admin', 'member', 'viewer'], {
      errorMap: () => ({ message: 'Role must be admin, member, or viewer' })
    })
  })
});