import { Schema, model, Document, Types } from 'mongoose';

export interface ICardAttachment {
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface ICard extends Document {
  _id: Types.ObjectId;
  listId: Types.ObjectId;
  boardId: Types.ObjectId;
  title: string;
  description?: string;
  assignees: Types.ObjectId[];
  labels: string[];
  dueDate?: Date;
  position: number;
  attachments: ICardAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    listId: {
      type: Schema.Types.ObjectId,
      ref: 'List',
      required: true,
      index: true
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      maxlength: [200, 'Card title cannot exceed 200 characters']
    },
    description: {
      type: String,
      default: ''
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    dueDate: {
      type: Date
    },
    position: {
      type: Number,
      required: true,
      default: 0
    },
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Card = model<ICard>('Card', cardSchema);