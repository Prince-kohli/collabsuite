import { Router } from 'express';
import {
  createDoc,
  getWorkspaceDocsTree,
  getDocById,
  updateDoc,
  archiveDoc
} from '../controllers/doc.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createDocSchema, updateDocSchema } from '../validations/doc.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/docs
 * @desc    Create a document or nested sub-document
 * @access  Private (Owner, Member)
 */
router.post(
  '/',
  requireWorkspaceRole(['owner', 'member']),
  validate(createDocSchema),
  createDoc
);

/**
 * @route   GET /api/v1/docs/workspace/:workspaceId/tree
 * @desc    Get document tree hierarchy for Notion sidebar
 * @access  Private (Owner, Member, Viewer)
 */
router.get(
  '/workspace/:workspaceId/tree',
  requireWorkspaceRole(['owner', 'member', 'viewer']),
  getWorkspaceDocsTree
);

/**
 * @route   GET /api/v1/docs/:id
 * @desc    Get single document details
 * @access  Private (Owner, Member, Viewer)
 */
router.get('/:id', getDocById);

/**
 * @route   PATCH /api/v1/docs/:id
 * @desc    Update document content (Auto-save)
 * @access  Private (Owner, Member)
 */
router.patch('/:id', validate(updateDocSchema), updateDoc);

/**
 * @route   DELETE /api/v1/docs/:id
 * @desc    Archive document
 * @access  Private (Owner, Member)
 */
router.delete('/:id', archiveDoc);

export default router;