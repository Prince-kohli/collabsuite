import { Router } from 'express';
import {
  createDoc,
  getWorkspaceDocsTree,
  getDocById,
  updateDoc,
  archiveDoc
} from '../controllers/doc.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createDocSchema, updateDocSchema } from '../validations/doc.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/docs
 * @desc    Create a document or nested sub-document
 * @access  Private
 */
router.post('/', validate(createDocSchema), createDoc);

/**
 * @route   GET /api/v1/docs/workspace/:workspaceId/tree
 * @desc    Get document tree hierarchy for Notion sidebar
 * @access  Private
 */
router.get('/workspace/:workspaceId/tree', getWorkspaceDocsTree);

/**
 * @route   GET /api/v1/docs/:id
 * @desc    Get single document details
 * @access  Private
 */
router.get('/:id', getDocById);

/**
 * @route   PATCH /api/v1/docs/:id
 * @desc    Update document content (Auto-save)
 * @access  Private
 */
router.patch('/:id', validate(updateDocSchema), updateDoc);

/**
 * @route   DELETE /api/v1/docs/:id
 * @desc    Archive document
 * @access  Private
 */
router.delete('/:id', archiveDoc);

export default router;