import mongoose from 'mongoose';
import { Board, IBoard } from '../models/board.model';
import { List, IList } from '../models/list.model';
import { Card, ICard } from '../models/card.model';
import { NotFoundError } from '../errors/AppError';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export class TrelloService {
  /**
   * Helper function to invalidate Redis board cache.
   */
  private static async invalidateBoardCache(boardId: string): Promise<void> {
    await redisClient.del(`board_cache:${boardId}`);
  }

  /**
   * Create a new board inside a workspace.
   */
  public static async createBoard(workspaceId: string, title: string, description?: string): Promise<IBoard> {
    const boardCount = await Board.countDocuments({ workspaceId });
    return await Board.create({
      workspaceId,
      title,
      description,
      position: boardCount
    });
  }

  /**
   * Get board details with nested lists and cards (Cached in Redis).
   */
  public static async getBoardDetails(boardId: string): Promise<{ board: IBoard; lists: IList[]; cards: ICard[] }> {
    const cacheKey = `board_cache:${boardId}`;

    // 1. Check Redis Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 2. Database Fetch
    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    const lists = await List.find({ boardId }).sort({ position: 1 });
    const cards = await Card.find({ boardId }).sort({ position: 1 }).populate('assignees', 'name email avatar');

    const result = { board, lists, cards };

    // 3. Cache in Redis for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
  }

  /**
   * Create a new list in a board.
   */
  public static async createList(boardId: string, title: string, position?: number): Promise<IList> {
    const listCount = await List.countDocuments({ boardId });
    const listPosition = position !== undefined ? position : listCount;

    const list = await List.create({
      boardId,
      title,
      position: listPosition
    });

    await this.invalidateBoardCache(boardId);
    return list;
  }

  /**
   * Create a new card inside a list.
   */
  public static async createCard(
    listId: string,
    boardId: string,
    title: string,
    description?: string,
    assignees?: string[],
    labels?: string[],
    dueDate?: string
  ): Promise<ICard> {
    const cardCount = await Card.countDocuments({ listId });

    const card = await Card.create({
      listId,
      boardId,
      title,
      description,
      assignees: assignees || [],
      labels: labels || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      position: cardCount
    });

    await this.invalidateBoardCache(boardId);
    return card;
  }

  /**
   * Move or reorder a card using MongoDB ACID Transactions.
   */
  public static async moveCard(cardId: string, targetListId: string, newPosition: number): Promise<ICard> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const card = await Card.findById(cardId).session(session);
      if (!card) {
        throw new NotFoundError('Card not found');
      }

      const currentListId = card.listId.toString();
      const boardId = card.boardId.toString();

      if (currentListId === targetListId) {
        // Reordering within same list
        await Card.updateMany(
          { listId: currentListId, position: { $gte: newPosition } },
          { $inc: { position: 1 } },
          { session }
        );
        card.position = newPosition;
        await card.save({ session });
      } else {
        // Moving to a different list
        await Card.updateMany(
          { listId: currentListId, position: { $gt: card.position } },
          { $inc: { position: -1 } },
          { session }
        );

        await Card.updateMany(
          { listId: targetListId, position: { $gte: newPosition } },
          { $inc: { position: 1 } },
          { session }
        );

        card.listId = new mongoose.Types.ObjectId(targetListId);
        card.position = newPosition;
        await card.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      await this.invalidateBoardCache(boardId);
      logger.info(`Card ${cardId} moved to list ${targetListId} at position ${newPosition}`);

      return card;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}