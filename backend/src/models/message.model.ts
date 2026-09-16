import { Schema, model, Document, Types } from 'mongoose';

export interface IMessageAttachment {
  name: string;
  url: string;
  size: number;
}

export interface IReaction {
  emoji: string;
  users: Types.ObjectId[];
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  attachments: IMessageAttachment[];
  reactions: IReaction[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    attachments: [
      {
        name: String,
        url: String,
        size: Number
      }
    ],
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        ]
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for ultra-fast cursor pagination on chat messages
messageSchema.index({ channelId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);