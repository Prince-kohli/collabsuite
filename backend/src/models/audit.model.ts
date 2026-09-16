import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);