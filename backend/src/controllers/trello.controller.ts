import { Request, Response, NextFunction } from 'express';
import { TrelloService } from '../services/trello.service';
import { BadRequestError } from '../errors/AppError';

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

export const getWorkspaceBoards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'workspaceId query parameter is required'
      });
      return;
    }

    const boards = await TrelloService.getWorkspaceBoards(workspaceId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workspace boards retrieved successfully',
      data: { boards }
    });
  } catch (error) {
    next(error);
  }
};

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

export const deleteBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await TrelloService.deleteBoard(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

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

export const deleteList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await TrelloService.deleteList(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'List deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

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

export const updateCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updates = req.body;

    const card = await TrelloService.updateCard(id, userId, updates);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Card updated successfully',
      data: { card }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const card = await TrelloService.addAttachment(id, userId, req.file);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Attachment uploaded successfully',
      data: { card }
    });
  } catch (error) {
    next(error);
  }
};

export const removeAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, attachmentId } = req.params;
    const card = await TrelloService.removeAttachment(id, attachmentId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Attachment removed successfully',
      data: { card }
    });
  } catch (error) {
    next(error);
  }
};

export const getCardActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const activities = await TrelloService.getCardActivities(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Card activities retrieved successfully',
      data: { activities }
    });
  } catch (error) {
    next(error);
  }
};

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

export const deleteCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await TrelloService.deleteCard(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const board = await TrelloService.updateBoard(id, { title, description });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Board updated successfully',
      data: { board }
    });
  } catch (error) {
    next(error);
  }
};

export const updateList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const list = await TrelloService.updateList(id, title);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'List updated successfully',
      data: { list }
    });
  } catch (error) {
    next(error);
  }
};