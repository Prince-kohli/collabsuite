import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  deleteManyNotifications,
  deleteNotification
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

router.delete('/clear-all', clearAllNotifications);
router.post('/delete-many', deleteManyNotifications);
router.delete('/:id', deleteNotification);

export default router;