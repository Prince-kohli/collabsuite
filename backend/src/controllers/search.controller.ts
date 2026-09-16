import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';

export const globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const queryText = (req.query.q as string) || '';

    if (!queryText.trim()) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Search query empty',
        data: { cards: [], docs: [], messages: [] }
      });
      return;
    }

    const results = await SearchService.globalSearch(workspaceId, queryText);

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