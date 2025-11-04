import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: Object },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'audit_logs' })

export default mongoose.model('AuditLog', auditLogSchema)
