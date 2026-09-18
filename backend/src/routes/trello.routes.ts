import { Router } from 'express';
import {
  createBoard,
  getWorkspaceBoards,
  getBoardDetails,
  deleteBoard,
  createList,
  deleteList,
  createCard,
  updateCard,
  uploadAttachment,
  removeAttachment,
  getCardActivities,
  moveCard,
  deleteCard
} from '../controllers/trello.controller';
import { addComment, getCardComments, deleteComment } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/upload.util';
import {
  createBoardSchema,
  createListSchema,
  createCardSchema,
  updateCardSchema,
  moveCardSchema
} from '../validations/trello.validation';

const router = Router();

router.use(authenticate);

// Boards
router.get('/boards', getWorkspaceBoards);
router.post('/boards', validate(createBoardSchema), createBoard);
router.get('/boards/:id', getBoardDetails);
router.delete('/boards/:id', deleteBoard);

// Lists
router.post('/lists', validate(createListSchema), createList);
router.delete('/lists/:id', deleteList);

// Cards
router.post('/cards', validate(createCardSchema), createCard);
router.patch('/cards/:id', validate(updateCardSchema), updateCard);
router.patch('/cards/:id/move', validate(moveCardSchema), moveCard);
router.delete('/cards/:id', deleteCard);

// Card Attachments
router.post('/cards/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/cards/:id/attachments/:attachmentId', removeAttachment);

// Card Comments
router.get('/cards/:id/comments', getCardComments);
router.post('/cards/:id/comments', addComment);
router.delete('/comments/:id', deleteComment);

// Card Activity Log
router.get('/cards/:id/activities', getCardActivities);

export default router;