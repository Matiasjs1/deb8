import { Router } from 'express'
import validateToken from '../middlewares/validateToken.js'
import { listAuditLogs } from '../controllers/audit.controller.js'

const router = Router()

router.use(validateToken)
router.get('/logs', listAuditLogs)

export default router
