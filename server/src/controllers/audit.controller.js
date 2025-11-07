import AuditLog from '../models/auditLog.model.js'
import { catchAsync } from '../utils/catchAsync.js'

export const listAuditLogs = catchAsync(async (req, res, next) => {
  const {
    action,
    userId,
    targetType,
    targetId,
    from,
    to,
    page = 1,
    limit = 20
  } = req.query

  const filter = {}
  if (action) filter.action = action
  if (userId) filter.userId = userId
  if (targetType) filter.targetType = targetType
  if (targetId) filter.targetId = targetId
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = new Date(from)
    if (to) filter.createdAt.$lte = new Date(to)
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    AuditLog.countDocuments(filter)
  ])

  res.status(200).json({
    status: 'success',
    results: items.length,
    page: pageNum,
    total,
    data: { logs: items }
  })
})
