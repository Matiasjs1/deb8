import AuditLog from '../models/auditLog.model.js'

export async function logAction({ action, userId, targetType, targetId, metadata = {}, req = null }) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress
    const userAgent = req?.headers?.['user-agent']
    await AuditLog.create({ action, userId, targetType, targetId, metadata, ip, userAgent })
  } catch (err) {
    // Do not throw; logging should not break main flow
    console.error('Audit log error:', err?.message)
  }
}
