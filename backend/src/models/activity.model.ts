import { Schema, model, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  boardId?: Types.ObjectId;
  cardId?: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  details: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board'
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    }
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  }
);

export const Activity = model<IActivity>('Activity', activitySchema);