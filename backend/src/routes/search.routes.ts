import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/search/workspace/:workspaceId
 * @desc    Global search across cards, docs, and messages via MongoDB Aggregation Pipelines
 * @access  Private
 */
router.get('/workspace/:workspaceId', globalSearch);

export default router;