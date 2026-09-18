import { Notification, INotification, NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';
import { enqueueNotificationEmail } from '../queues/notification.queue';
import { emitToUser } from '../sockets/socket.handler';
import { logger } from '../utils/logger';

interface CreateNotificationInput {
  userId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  sendEmail?: boolean;
}

export class NotificationService {
  /**
   * Create in-app notification, push via socket, and optionally email via BullMQ.
   */
  public static async createNotification(input: CreateNotificationInput): Promise<INotification | null> {
    // Do not notify yourself
    if (input.senderId && input.senderId === input.userId) {
      return null;
    }

    const notification = await Notification.create({
      userId: input.userId,
      senderId: input.senderId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      isRead: false
    });

    const populated = await Notification.findById(notification._id)
      .populate('senderId', 'name email avatar')
      .lean();

    emitToUser(input.userId, 'notification:new', populated || notification);

    if (input.sendEmail !== false) {
      try {
        const receiver = await User.findById(input.userId).select('email name');
        if (receiver?.email) {
          await enqueueNotificationEmail({
            toEmail: receiver.email,
            title: input.title,
            message: input.message,
            link: input.link
          });
        }
      } catch (error) {
        logger.error('Failed to enqueue notification email', { error });
      }
    }

    return notification;
  }

  /**
   * Get paginated notifications for a user.
   */
  public static async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ notifications: INotification[]; unreadCount: number; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name email avatar'),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    return { notifications, unreadCount, total };
  }

  /**
   * Mark single notification as read.
   */
  public static async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for user.
   */
  public static async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }
}