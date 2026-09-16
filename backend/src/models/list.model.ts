import { Schema, model, Document, Types } from 'mongoose';

export interface IList extends Document {
  _id: Types.ObjectId;
  boardId: Types.ObjectId;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
      maxlength: [100, 'List title cannot exceed 100 characters']
    },
    position: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const List = model<IList>('List', listSchema);