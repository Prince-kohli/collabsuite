import { Schema, model, Document, Types } from 'mongoose';

export interface IDocument extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  authorId: Types.ObjectId;
  parentDocId?: Types.ObjectId | null;
  title: string;
  content: string;
  isPublic: boolean;
  isArchived: boolean;
  icon?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parentDocId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      default: 'Untitled'
    },
    content: {
      type: String,
      default: ''
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: ''
    },
    coverImage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const DocModel = model<IDocument>('Document', documentSchema);