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

// Invite: only member or viewer
export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address required'),
    role: z.enum(['member', 'viewer'], {
      errorMap: () => ({ message: 'Role must be member or viewer' })
    })
  })
});

// Role update: owner can assign owner | member | viewer
export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['owner', 'member', 'viewer'], {
      errorMap: () => ({ message: 'Role must be owner, member, or viewer' })
    })
  })
});