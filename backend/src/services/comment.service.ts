import { Comment, IComment } from '../models/comment.model';
import { Card } from '../models/card.model';
import { Activity } from '../models/activity.model';
import { NotFoundError } from '../errors/AppError';
import { NotificationService } from './notification.service';
import { emitToCard } from '../sockets/socket.handler';
import { logger } from '../utils/logger';

export class CommentService {
  /**
   * Extract @mention patterns like @email or raw ObjectIds from content (simple approach).
   * Frontend should also send mentions: string[] of userIds.
   */
  public static async addComment(
    cardId: string,
    userId: string,
    content: string,
    mentionIds: string[] = [],
    link?: string
  ): Promise<IComment> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

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

    // Live comment to card room
    emitToCard(cardId, 'comment:new', populated);

    // Activity log
    await Activity.create({
      workspaceId: card.boardId, // temporary; prefer board.workspaceId if available
      boardId: card.boardId,
      cardId: card._id,
      userId,
      action: 'comment_added',
      details: `Commented on card "${card.title}"`
    }).catch(() => {
      // non-blocking
    });

    // Notify mentioned users
    for (const mentionedUserId of uniqueMentions) {
      await NotificationService.createNotification({
        userId: mentionedUserId,
        senderId: userId,
        type: 'mention',
        title: 'You were mentioned',
        message: `You were mentioned in a comment on card "${card.title}"`,
        link: link || undefined,
        sendEmail: true
      });
    }

    // Notify assignees (except actor and already mentioned)
    const assigneeIds = (card.assignees || []).map((id) => id.toString());
    for (const assigneeId of assigneeIds) {
      if (assigneeId === userId || uniqueMentions.includes(assigneeId)) continue;
      await NotificationService.createNotification({
        userId: assigneeId,
        senderId: userId,
        type: 'comment',
        title: 'New comment on your card',
        message: `New comment on "${card.title}"`,
        link: link || undefined,
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
      throw new NotFoundError('Comment not found'); // hide auth detail; or use ForbiddenError if you have it
    }

    const cardId = comment.cardId.toString();
    await Comment.findByIdAndDelete(commentId);
    emitToCard(cardId, 'comment:deleted', { commentId });
  }
}