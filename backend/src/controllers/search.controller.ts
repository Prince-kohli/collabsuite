import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';

export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const queryText = (req.query.q as string) || '';
    const userId = req.user!.userId;

    if (!queryText.trim()) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Search query empty',
        data: { cards: [], docs: [], messages: [], results: [] }
      });
      return;
    }

    // Ignore very short queries to reduce noise
    if (queryText.trim().length < 2) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Query too short',
        data: { cards: [], docs: [], messages: [], results: [] }
      });
      return;
    }

    const results = await SearchService.globalSearch(
      workspaceId,
      queryText.trim(),
      userId
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Global search completed successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};