import Debate from '../models/debate.model.js'
import User from '../models/user.model.js'
import { catchAsync } from '../utils/catchAsync.js'
import appError from '../libs/appError.js'

export const createDebate = catchAsync(async (req, res, next) => {
    const { title, description, maxParticipants, duration, format, mode, tags } = req.body
    
    // Crear el debate
    const debate = await Debate.create({
        title,
        description,
        author: req.user.id,
        maxParticipants,
        duration,
        format,
        mode,
        tags: tags || []
    })

    // Agregar al autor como primer participante
    debate.participants.push({
        user: req.user.id
    })
    await debate.save()

    // Poblar información del autor
    await debate.populate('author', 'username')

    res.status(201).json({
        status: 'success',
        data: {
            debate
        }
    })
})

export const getAllDebates = catchAsync(async (req, res, next) => {
    const debates = await Debate.find({ status: 'Abierto' })
        .populate('author', 'username')
        .populate('participants.user', 'username')
        .sort({ createdAt: -1 })

    res.status(200).json({
        status: 'success',
        results: debates.length,
        data: {
            debates
        }
    })
})

export const getDebate = catchAsync(async (req, res, next) => {
    const debate = await Debate.findById(req.params.id)
        .populate('author', 'username')
        .populate('participants.user', 'username')

    if (!debate) {
        return next(new appError('No se encontró el debate', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            debate
        }
    })
})

export const joinDebate = catchAsync(async (req, res, next) => {
    const debate = await Debate.findById(req.params.id)

    if (!debate) {
        return next(new appError('No se encontró el debate', 404))
    }

    if (debate.status !== 'Abierto') {
        return next(new appError('Este debate no está abierto para unirse', 400))
    }

    // Verificar si el usuario ya está en el debate
    const isAlreadyParticipant = debate.participants.some(
        participant => participant.user.toString() === req.user.id
    )

    if (isAlreadyParticipant) {
        return next(new appError('Ya eres participante de este debate', 400))
    }

    // Verificar si hay espacio
    if (debate.currentParticipants >= debate.maxParticipants) {
        return next(new appError('El debate está lleno', 400))
    }

    // Agregar participante
    debate.participants.push({
        user: req.user.id
    })
    debate.currentParticipants += 1

    await debate.save()

    await debate.populate('author', 'username')
    await debate.populate('participants.user', 'username')

    res.status(200).json({
        status: 'success',
        data: {
            debate
        }
    })
})

export const leaveDebate = catchAsync(async (req, res, next) => {
    const debate = await Debate.findById(req.params.id)

    if (!debate) {
        return next(new appError('No se encontró el debate', 404))
    }

    // Verificar si el usuario es participante
    const participantIndex = debate.participants.findIndex(
        participant => participant.user.toString() === req.user.id
    )

    if (participantIndex === -1) {
        return next(new appError('No eres participante de este debate', 400))
    }

    // Remover participante
    debate.participants.splice(participantIndex, 1)
    debate.currentParticipants -= 1

    await debate.save()

    await debate.populate('author', 'username')
    await debate.populate('participants.user', 'username')

    res.status(200).json({
        status: 'success',
        data: {
            debate
        }
    })
})

export const updateDebate = catchAsync(async (req, res, next) => {
    const debate = await Debate.findById(req.params.id)

    if (!debate) {
        return next(new appError('No se encontró el debate', 404))
    }

    // Verificar si el usuario es el autor
    if (debate.author.toString() !== req.user.id) {
        return next(new appError('Solo el autor puede editar el debate', 403))
    }

    const updatedDebate = await Debate.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).populate('author', 'username')

    res.status(200).json({
        status: 'success',
        data: {
            debate: updatedDebate
        }
    })
})

export const deleteDebate = catchAsync(async (req, res, next) => {
    const debate = await Debate.findById(req.params.id)

    if (!debate) {
        return next(new appError('No se encontró el debate', 404))
    }

    // Verificar si el usuario es el autor
    if (debate.author.toString() !== req.user.id) {
        return next(new appError('Solo el autor puede eliminar el debate', 403))
    }

    await Debate.findByIdAndDelete(req.params.id)

    res.status(204).json({
        status: 'success',
        data: null
    })
})
