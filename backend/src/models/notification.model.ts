import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 
  | 'mention' 
  | 'card_assign' 
  | 'comment' 
  | 'workspace_invite' 
  | 'system';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // Receiver
  senderId?: Types.ObjectId; // Who triggered it
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string; // URL to redirect when clicked
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      required: true,
      enum: ['mention', 'card_assign', 'comment', 'workspace_invite', 'system']
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for fetching unread notifications quickly
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);