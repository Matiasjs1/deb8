import express from 'express'
import { validateToken } from '../middlewares/validateToken.js'
import {
    createDebate,
    getAllDebates,
    getDebate,
    joinDebate,
    leaveDebate,
    updateDebate,
    deleteDebate
} from '../controllers/debate.controller.js'

const router = express.Router()

// Rutas públicas
router.get('/', getAllDebates)
router.get('/:id', getDebate)

// Rutas protegidas (requieren autenticación)
router.use(validateToken)

router.post('/', createDebate)
router.patch('/:id/join', joinDebate)
router.patch('/:id/leave', leaveDebate)
router.patch('/:id', updateDebate)
router.delete('/:id', deleteDebate)

export default router
