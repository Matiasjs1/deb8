import mongoose from 'mongoose'

const debateArchiveSchema = new mongoose.Schema({
  originalDebateId: { type: mongoose.Schema.Types.ObjectId, index: true },
  title: String,
  description: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maxParticipants: Number,
  currentParticipants: Number,
  duration: Number,
  format: { type: String },
  mode: { type: String },
  tags: [String],
  status: String,
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  deletedAt: { type: Date, default: Date.now },
  deleteReason: { type: String, default: 'user_deleted' }
}, { timestamps: false, collection: 'debates_archive' })

export default mongoose.model('DebateArchive', debateArchiveSchema)
