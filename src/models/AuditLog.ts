import mongoose, { Schema, Model, Document } from "mongoose";
import { UserRole } from "@/types";

export interface IAuditLogDocument extends Document {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: {
      type: String,
      enum: ["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN", "INVENTORY_MANAGER"],
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    beforeSnapshot: { type: Schema.Types.Mixed },
    afterSnapshot: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ timestamp: -1 });

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
