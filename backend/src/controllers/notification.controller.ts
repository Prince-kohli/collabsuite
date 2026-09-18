import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { BadRequestError } from '../errors/AppError';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const data = await NotificationService.getUserNotifications(userId, page, limit);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Notifications retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};