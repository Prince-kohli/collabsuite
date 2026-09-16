import { Schema, model, Document, Types } from 'mongoose';

export interface IBoard extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  description?: string;
  isArchived: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: [100, 'Board title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    position: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const Board = model<IBoard>('Board', boardSchema);