import mongoose from 'mongoose'

const debateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxParticipants: {
        type: Number,
        required: true,
        min: 2,
        max: 10
    },
    currentParticipants: {
        type: Number,
        default: 1
    },
    duration: {
        type: Number,
        required: true,
        min: 5,
        max: 120
    },
    format: {
        type: String,
        enum: ['Voz', 'Texto'],
        required: true
    },
    mode: {
        type: String,
        enum: ['Libre', 'Por turnos', 'Moderado'],
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['Abierto', 'En progreso', 'Cerrado'],
        default: 'Abierto'
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
})

export default mongoose.model('Debate', debateSchema)
