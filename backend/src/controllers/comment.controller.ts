import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: cardId } = req.params;
    const { content, mentions, link } = req.body;
    const userId = req.user!.userId;

    const comment = await CommentService.addComment(
      cardId,
      userId,
      content,
      mentions || [],
      link
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

export const getCardComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: cardId } = req.params;
    const comments = await CommentService.getCardComments(cardId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comments retrieved successfully',
      data: { comments }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await CommentService.deleteComment(id, userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};