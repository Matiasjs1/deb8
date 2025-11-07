import mongoose from 'mongoose'

const userArchiveSchema = new mongoose.Schema({
  originalUserId: { type: mongoose.Schema.Types.ObjectId, index: true },
  username: String,
  email: String,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: { type: Date, default: Date.now },
  deleteReason: { type: String, default: 'user_deleted' }
}, { timestamps: false, collection: 'users_archive' })

export default mongoose.model('UserArchive', userArchiveSchema)
