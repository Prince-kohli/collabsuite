import { Router } from 'express';
import {
  createBoard,
  getWorkspaceBoards,
  getBoardDetails,
  createList,
  createCard,
  moveCard
} from '../controllers/trello.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createBoardSchema,
  createListSchema,
  createCardSchema,
  moveCardSchema
} from '../validations/trello.validation';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/trello/boards?workspaceId=...
 * @desc    Get all boards in a workspace
 * @access  Private
 */
router.get('/boards', getWorkspaceBoards);

/**
 * @route   POST /api/v1/trello/boards
 * @desc    Create a new board in a workspace
 * @access  Private
 */
router.post('/boards', validate(createBoardSchema), createBoard);

/**
 * @route   GET /api/v1/trello/boards/:id
 * @desc    Get board details with lists and cards (Redis Cached)
 * @access  Private
 */
router.get('/boards/:id', getBoardDetails);

/**
 * @route   POST /api/v1/trello/lists
 * @desc    Create a new list in a board
 * @access  Private
 */
router.post('/lists', validate(createListSchema), createList);

/**
 * @route   POST /api/v1/trello/cards
 * @desc    Create a new card in a list
 * @access  Private
 */
router.post('/cards', validate(createCardSchema), createCard);

/**
 * @route   PATCH /api/v1/trello/cards/:id/move
 * @desc    Move/reorder a card across lists using MongoDB ACID transaction
 * @access  Private
 */
router.patch('/cards/:id/move', validate(moveCardSchema), moveCard);

export default router;