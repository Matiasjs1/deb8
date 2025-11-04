import { Router } from 'express'
import validateToken from '../middlewares/validateToken.js'
import { deleteMe } from '../controllers/user.controller.js'

const router = Router()

router.use(validateToken)
router.delete('/me', deleteMe)

export default router
