import { Schema, model, Document, Types } from 'mongoose';

export interface IChannel extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  topic?: string;
  isPrivate: boolean;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      lowercase: true,
      maxlength: [80, 'Channel name cannot exceed 80 characters']
    },
    topic: {
      type: String,
      maxlength: [250, 'Topic cannot exceed 250 characters'],
      default: ''
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Ensure unique channel name within a workspace
channelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const Channel = model<IChannel>('Channel', channelSchema);