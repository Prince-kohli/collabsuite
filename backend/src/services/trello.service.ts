import mongoose from 'mongoose';
import { Board, IBoard } from '../models/board.model';
import { List, IList } from '../models/list.model';
import { Card, ICard } from '../models/card.model';
import { Activity, IActivity } from '../models/activity.model';
import { NotFoundError } from '../errors/AppError';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class TrelloService {
  private static async invalidateBoardCache(boardId: string): Promise<void> {
    await redisClient.del(`board_cache:${boardId}`);
  }

  public static async createBoard(workspaceId: string, title: string, description?: string): Promise<IBoard> {
    const boardCount = await Board.countDocuments({ workspaceId });
    return await Board.create({
      workspaceId,
      title,
      description,
      position: boardCount
    });
  }

  public static async getWorkspaceBoards(workspaceId: string): Promise<IBoard[]> {
    return Board.find({ workspaceId, isArchived: false }).sort({ createdAt: -1 });
  }

  public static async getBoardDetails(boardId: string): Promise<{ board: IBoard; lists: IList[]; cards: ICard[] }> {
    const cacheKey = `board_cache:${boardId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    const lists = await List.find({ boardId }).sort({ position: 1 });
    const cards = await Card.find({ boardId })
      .sort({ position: 1 })
      .populate('assignees', 'name email avatar');

    const result = { board, lists, cards };
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
  }

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
      description: description || '',
      assignees: assignees || [],
      labels: labels || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      position: cardCount
    });

    await this.invalidateBoardCache(boardId);
    return card;
  }

  /**
   * Update card details, notify newly assigned users, and log activity.
   */
  public static async updateCard(
    cardId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      labels?: string[];
      dueDate?: string | null;
      assignees?: string[];
    }
  ): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const previousAssignees = card.assignees.map((a) => a.toString());

    if (updates.title !== undefined) card.title = updates.title;
    if (updates.description !== undefined) card.description = updates.description;
    if (updates.labels !== undefined) card.labels = updates.labels;
    if (updates.dueDate !== undefined) {
      card.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
    }

    if (updates.assignees !== undefined) {
      card.assignees = updates.assignees.map((id) => new mongoose.Types.ObjectId(id));
      
      // Notify newly assigned users
      const newlyAssigned = updates.assignees.filter((id) => !previousAssignees.includes(id));
      for (const assignedUserId of newlyAssigned) {
        await NotificationService.createNotification({
          userId: assignedUserId,
          senderId: userId,
          type: 'card_assign',
          title: 'Assigned to Card',
          message: `You were assigned to card "${card.title}"`,
          sendEmail: true
        });
      }
    }

    await card.save();
    await card.populate('assignees', 'name email avatar');

    // Audit Log Activity
    const board = await Board.findById(card.boardId).select('workspaceId');
    if (board) {
      await Activity.create({
        workspaceId: board.workspaceId,
        boardId: card.boardId,
        cardId: card._id,
        userId,
        action: 'card_updated',
        details: `Updated card details for "${card.title}"`
      }).catch(() => {});
    }

    await this.invalidateBoardCache(card.boardId.toString());
    return card;
  }

  /**
   * Add attachment file reference to card.
   */
  public static async addAttachment(
    cardId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const attachmentUrl = `/uploads/${file.filename}`;

    card.attachments.push({
      name: file.originalname,
      url: attachmentUrl,
      size: file.size,
      uploadedAt: new Date()
    });

    await card.save();
    await card.populate('assignees', 'name email avatar');

    const board = await Board.findById(card.boardId).select('workspaceId');
    if (board) {
      await Activity.create({
        workspaceId: board.workspaceId,
        boardId: card.boardId,
        cardId: card._id,
        userId,
        action: 'attachment_added',
        details: `Uploaded file "${file.originalname}" to card "${card.title}"`
      }).catch(() => {});
    }

    await this.invalidateBoardCache(card.boardId.toString());
    return card;
  }

  /**
   * Remove attachment from card.
   */
  public static async removeAttachment(
    cardId: string,
    attachmentId: string
  ): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    card.attachments = card.attachments.filter(
      (att: any) => att._id.toString() !== attachmentId
    );

    await card.save();
    await card.populate('assignees', 'name email avatar');
    await this.invalidateBoardCache(card.boardId.toString());

    return card;
  }

  /**
   * Get card activity audit trail.
   */
  public static async getCardActivities(cardId: string): Promise<IActivity[]> {
    return Activity.find({ cardId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('userId', 'name email avatar');
  }

  public static async moveCard(cardId: string, targetListId: string, newPosition: number): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const currentListId = card.listId.toString();
    const boardId = card.boardId.toString();

    let session: mongoose.ClientSession | null = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      if (currentListId === targetListId) {
        await Card.updateMany(
          { listId: currentListId, position: { $gte: newPosition } },
          { $inc: { position: 1 } },
          { session }
        );
        card.position = newPosition;
        await card.save({ session });
      } else {
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
    } catch (err: any) {
      if (session) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
      }

      if (err.message && err.message.includes('Transaction numbers are only allowed')) {
        if (currentListId === targetListId) {
          await Card.updateMany(
            { listId: currentListId, position: { $gte: newPosition } },
            { $inc: { position: 1 } }
          );
          card.position = newPosition;
          await card.save();
        } else {
          await Card.updateMany(
            { listId: currentListId, position: { $gt: card.position } },
            { $inc: { position: -1 } }
          );

          await Card.updateMany(
            { listId: targetListId, position: { $gte: newPosition } },
            { $inc: { position: 1 } }
          );

          card.listId = new mongoose.Types.ObjectId(targetListId);
          card.position = newPosition;
          await card.save();
        }
      } else {
        throw err;
      }
    }

    await this.invalidateBoardCache(boardId);
    logger.info(`Card ${cardId} moved to list ${targetListId} at position ${newPosition}`);

    return card;
  }

  public static async deleteCard(cardId: string): Promise<void> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    const boardId = card.boardId.toString();
    await Card.findByIdAndDelete(cardId);
    await this.invalidateBoardCache(boardId);
  }

  public static async deleteList(listId: string): Promise<void> {
    const list = await List.findById(listId);
    if (!list) {
      throw new NotFoundError('List not found');
    }
    const boardId = list.boardId.toString();
    await Card.deleteMany({ listId });
    await List.findByIdAndDelete(listId);
    await this.invalidateBoardCache(boardId);
  }

  public static async deleteBoard(boardId: string): Promise<void> {
    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }
    await Card.deleteMany({ boardId });
    await List.deleteMany({ boardId });
    await Board.findByIdAndDelete(boardId);
    await this.invalidateBoardCache(boardId);
  }


    /**
   * Update Board Title and Description.
   */
  public static async updateBoard(boardId: string, updates: { title?: string; description?: string }): Promise<IBoard> {
    const board = await Board.findByIdAndUpdate(boardId, updates, { new: true });
    if (!board) {
      throw new NotFoundError('Board not found');
    }
    await this.invalidateBoardCache(boardId);
    return board;
  }

  /**
   * Update List Title.
   */
  public static async updateList(listId: string, title: string): Promise<IList> {
    const list = await List.findByIdAndUpdate(listId, { title }, { new: true });
    if (!list) {
      throw new NotFoundError('List not found');
    }
    await this.invalidateBoardCache(list.boardId.toString());
    return list;
  }
}

