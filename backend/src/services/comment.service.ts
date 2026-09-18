import { Comment, IComment } from '../models/comment.model';
import { Card } from '../models/card.model';
import { Board } from '../models/board.model';
import { Activity } from '../models/activity.model';
import { NotFoundError } from '../errors/AppError';
import { NotificationService } from './notification.service';
import { emitToCard } from '../sockets/socket.handler';
import { logger } from '../utils/logger';

export class CommentService {
  public static async addComment(
    cardId: string,
    userId: string,
    content: string,
    mentionIds: string[] = [],
    _customLink?: string
  ): Promise<IComment> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const board = await Board.findById(card.boardId).select('workspaceId');
    const notificationLink = board
      ? `/workspaces/${board.workspaceId}/boards/${card.boardId}?cardId=${card._id}`
      : undefined;

    const uniqueMentions = [...new Set(mentionIds.filter((id) => id && id !== userId))];

    const comment = await Comment.create({
      cardId,
      userId,
      content,
      mentions: uniqueMentions
    });

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name email avatar')
      .populate('mentions', 'name email avatar');

    emitToCard(cardId, 'comment:new', populated);

    if (board) {
      await Activity.create({
        workspaceId: board.workspaceId,
        boardId: card.boardId,
        cardId: card._id,
        userId,
        action: 'comment_added',
        details: `Commented on card "${card.title}"`
      }).catch(() => {});
    }

    // Notify mentioned users
    for (const mentionedUserId of uniqueMentions) {
      await NotificationService.createNotification({
        userId: mentionedUserId,
        senderId: userId,
        type: 'mention',
        title: 'You were mentioned',
        message: `You were mentioned in a comment on card "${card.title}"`,
        link: notificationLink,
        sendEmail: true
      });
    }

    // Notify assignees
    const assigneeIds = (card.assignees || []).map((id) => id.toString());
    for (const assigneeId of assigneeIds) {
      if (assigneeId === userId || uniqueMentions.includes(assigneeId)) continue;
      await NotificationService.createNotification({
        userId: assigneeId,
        senderId: userId,
        type: 'comment',
        title: 'New comment on your card',
        message: `New comment on "${card.title}"`,
        link: notificationLink,
        sendEmail: true
      });
    }

    logger.info(`Comment added on card ${cardId} by user ${userId}`);
    return populated as IComment;
  }

  public static async getCardComments(cardId: string): Promise<IComment[]> {
    return Comment.find({ cardId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email avatar')
      .populate('mentions', 'name email avatar');
  }

  public static async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new NotFoundError('Comment not found');
    }

    const cardId = comment.cardId.toString();
    await Comment.findByIdAndDelete(commentId);
    emitToCard(cardId, 'comment:deleted', { commentId });
  }
}