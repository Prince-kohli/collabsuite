import { Router } from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  addMember
} from '../controllers/workspace.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createWorkspaceSchema, addMemberSchema } from '../validations/workspace.validation';

const router = Router();

// All workspace routes require basic authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post('/', validate(createWorkspaceSchema), createWorkspace);

/**
 * @route   GET /api/v1/workspaces
 * @desc    Get all workspaces accessible by the logged-in user
 * @access  Private
 */
router.get('/', getUserWorkspaces);

/**
 * @route   GET /api/v1/workspaces/:id
 * @desc    Get single workspace details with members
 * @access  Private (Owner, Admin, Member, Viewer)
 */
router.get('/:id', requireWorkspaceRole(['owner', 'admin', 'member', 'viewer']), getWorkspaceById);

/**
 * @route   POST /api/v1/workspaces/:id/members
 * @desc    Invite/add member to workspace
 * @access  Private (Owner, Admin)
 */
router.post(
  '/:id/members',
  requireWorkspaceRole(['owner', 'admin']),
  validate(addMemberSchema),
  addMember
);

export default router;