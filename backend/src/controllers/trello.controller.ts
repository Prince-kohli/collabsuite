import { Request, Response, NextFunction } from 'express';
import { TrelloService } from '../services/trello.service';

/**
 * Controller handler to create a new board.
 */
export const createBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId, title, description } = req.body;
    const board = await TrelloService.createBoard(workspaceId, title, description);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Board created successfully',
      data: { board }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to get board details.
 */
export const getBoardDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await TrelloService.getBoardDetails(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Board details retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to create a list.
 */
export const createList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { boardId, title, position } = req.body;
    const list = await TrelloService.createList(boardId, title, position);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'List created successfully',
      data: { list }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to create a card.
 */
export const createCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { listId, boardId, title, description, assignees, labels, dueDate } = req.body;
    const card = await TrelloService.createCard(listId, boardId, title, description, assignees, labels, dueDate);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Card created successfully',
      data: { card }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to move or reorder a card.
 */
export const moveCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { targetListId, newPosition } = req.body;
    const card = await TrelloService.moveCard(id, targetListId, newPosition);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Card moved successfully',
      data: { card }
    });
  } catch (error) {
    next(error);
  }
};