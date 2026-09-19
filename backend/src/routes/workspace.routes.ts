import { Router } from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember
} from '../controllers/workspace.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema
} from '../validations/workspace.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/', getUserWorkspaces);

router.get(
  '/:id',
  requireWorkspaceRole(['owner', 'member', 'viewer']),
  getWorkspaceById
);

router.patch(
  '/:id',
  requireWorkspaceRole(['owner']),
  validate(updateWorkspaceSchema),
  updateWorkspace
);

router.delete(
  '/:id',
  requireWorkspaceRole(['owner']),
  deleteWorkspace
);

router.post(
  '/:id/members',
  requireWorkspaceRole(['owner']),
  validate(addMemberSchema),
  addMember
);

router.patch(
  '/:id/members/:memberId',
  requireWorkspaceRole(['owner']),
  validate(updateMemberRoleSchema),
  updateMemberRole
);

router.delete(
  '/:id/members/:memberId',
  requireWorkspaceRole(['owner']),
  removeMember
);

export default router;