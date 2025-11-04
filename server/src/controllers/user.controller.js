import User from '../models/user.model.js'
import Debate from '../models/debate.model.js'
import DebateArchive from '../models/debateArchive.model.js'
import { getIO } from '../socket.js'
import { logAction } from '../utils/logAction.js'
import appError from '../libs/appError.js'

export const deleteMe = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return next(new appError('Unauthorized', 401))

    // Find debates authored by user
    const debates = await Debate.find({ author: userId })

    if (debates.length > 0) {
      // Archive debates
      const archives = debates.map(d => ({
        originalDebateId: d._id,
        title: d.title,
        description: d.description,
        author: d.author,
        maxParticipants: d.maxParticipants,
        currentParticipants: d.currentParticipants,
        duration: d.duration,
        format: d.format,
        mode: d.mode,
        tags: d.tags,
        status: d.status,
        participants: d.participants,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        deletedAt: new Date(),
        deleteReason: 'user_deleted'
      }))
      await DebateArchive.insertMany(archives)

      // Delete debates
      const ids = debates.map(d => String(d._id))
      await Debate.deleteMany({ _id: { $in: ids } })

      // Emit events so rooms/clients close
      const io = getIO()
      if (io) {
        for (const idStr of ids) {
          io.emit('debate_deleted', { _id: idStr })
          io.to(idStr).emit('debate_deleted', { _id: idStr })
        }
      }

      await logAction({ action: 'debates_archived_and_deleted_by_user_delete', userId, targetType: 'User', targetId: userId, metadata: { debateCount: debates.length } , req })
    }

    // Delete user
    await User.findByIdAndDelete(userId)
    await logAction({ action: 'user_deleted', userId, targetType: 'User', targetId: userId, metadata: {}, req })

    res.status(204).json({ status: 'success', data: null })
  } catch (err) {
    next(err)
  }
}
