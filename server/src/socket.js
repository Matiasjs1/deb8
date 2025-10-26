import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import Debate from './models/debate.model.js'

// In-memory message store (MVP). For production, persist to Mongo.
const messagesStore = new Map() // debateId -> [{ userId, username, content, ts }]

// Keep a module-scoped reference to io so other modules (controllers)
// can emit application-wide events.
let ioRef = null
export function getIO() {
  return ioRef
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...v] = part.trim().split('=')
    if (!key) return acc
    acc[decodeURIComponent(key)] = decodeURIComponent(v.join('='))
    return acc
  }, {})
}

export function setupSockets(server) {
  const isProd = process.env.NODE_ENV === 'production'
  const io = new Server(server, isProd ? {} : {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  })

  // Expose globally
  ioRef = io

  // Auth middleware using JWT from cookies
  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.request.headers.cookie || '')
      const token = cookies['token']
      if (!token) return next(new Error('No token'))
      const user = jwt.verify(token, process.env.TOKEN_SECRET)
      socket.user = user // { id: ... }
      next()
    } catch (err) {
      next(new Error('Unauthorized'))
    }
  })

  // Voice rooms state: debateId -> Map(userId -> socketId)
  const voiceRooms = new Map()

  io.on('connection', (socket) => {
    // Join a debate room
    socket.on('join_room', async ({ debateId }, cb) => {
      try {
        if (!debateId) throw new Error('debateId requerido')
        const debate = await Debate.findById(debateId)
          .populate('author', 'username')
          .populate('participants.user', 'username')
        if (!debate) throw new Error('Debate no encontrado')
        if (debate.status === 'Cerrado') throw new Error('Debate cerrado')
        if (debate.format !== 'Texto') throw new Error('Formato no soportado')

        // Verify participant
        const isParticipant = debate.participants.some(p => {
          const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
          return uid === socket.user.id
        })
        if (!isParticipant) throw new Error('No eres participante de este debate')

        socket.join(debateId)
        // Send last messages if any
        const history = messagesStore.get(debateId) || []
        cb && cb({ ok: true, history, debate: {
          id: debate.id,
          title: debate.title,
          mode: debate.mode,
          status: debate.status,
          participants: debate.participants.map(p => ({ id: p.user.id, username: p.user.username }))
        } })
        socket.to(debateId).emit('system', { type: 'user_joined', userId: socket.user.id })
      } catch (error) {
        cb && cb({ ok: false, error: error.message })
      }
    })

    // Leave a debate room
    socket.on('leave_room', ({ debateId }) => {
      if (debateId) {
        socket.leave(debateId)
        socket.to(debateId).emit('system', { type: 'user_left', userId: socket.user.id })
      }
    })

    // Typing indicator
    socket.on('typing', ({ debateId, typing }) => {
      if (debateId) {
        socket.to(debateId).emit('typing', { userId: socket.user.id, typing: !!typing })
      }
    })

    // Send a message
    socket.on('send_message', async ({ debateId, content }, cb) => {
      try {
        if (!debateId || !content || !content.trim()) throw new Error('Mensaje inválido')
        const debate = await Debate.findById(debateId).populate('participants.user', 'username')
        if (!debate) throw new Error('Debate no encontrado')
        const isParticipant = debate.participants.some(p => {
          const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
          return uid === socket.user.id
        })
        if (!isParticipant) throw new Error('No eres participante')

        const userEntry = debate.participants.find(p => {
          const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
          return uid === socket.user.id
        })
        const msg = {
          userId: socket.user.id,
          username: userEntry?.user?.username || 'Usuario',
          content: content.trim(),
          ts: Date.now()
        }
        const arr = messagesStore.get(debateId) || []
        arr.push(msg)
        // Keep last N messages
        if (arr.length > 500) arr.shift()
        messagesStore.set(debateId, arr)

        io.to(debateId).emit('message', msg)
        cb && cb({ ok: true })
      } catch (error) {
        cb && cb({ ok: false, error: error.message })
      }
    })

    // --- WebRTC signaling for Voice debates ---
    socket.on('rtc_join', async ({ debateId }, cb) => {
      try {
        if (!debateId) throw new Error('debateId requerido')
        const debate = await Debate.findById(debateId)
          .populate('participants.user', 'username')
        if (!debate) throw new Error('Debate no encontrado')
        if (debate.status === 'Cerrado') throw new Error('Debate cerrado')
        if (debate.format !== 'Voz') throw new Error('Este debate no es de voz')

        const isParticipant = debate.participants.some(p => {
          const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
          return uid === socket.user.id
        })
        if (!isParticipant) throw new Error('No eres participante de este debate')

        socket.join(debateId)

        let roomMap = voiceRooms.get(debateId)
        if (!roomMap) {
          roomMap = new Map()
          voiceRooms.set(debateId, roomMap)
        }
        // Register user -> socket
        roomMap.set(socket.user.id, socket.id)

        // Build peers list excluding self
        const peers = []
        for (const [uid, sid] of roomMap.entries()) {
          if (uid !== socket.user.id) {
            const pInfo = debate.participants.find(p => (p.user?._id || p.user).toString() === uid)
            peers.push({ userId: uid, socketId: sid, username: pInfo?.user?.username || 'Usuario' })
          }
        }
        cb && cb({ ok: true, peers })

        // Notify others of new peer
        socket.to(debateId).emit('rtc_peer_joined', { userId: socket.user.id })
      } catch (error) {
        cb && cb({ ok: false, error: error.message })
      }
    })

    socket.on('rtc_leave', ({ debateId }) => {
      if (!debateId) return
      socket.leave(debateId)
      const roomMap = voiceRooms.get(debateId)
      if (roomMap) {
        roomMap.delete(socket.user.id)
        if (roomMap.size === 0) voiceRooms.delete(debateId)
      }
      socket.to(debateId).emit('rtc_peer_left', { userId: socket.user.id })
    })

    socket.on('rtc_offer', ({ debateId, targetUserId, description }) => {
      const roomMap = voiceRooms.get(debateId)
      if (!roomMap) return
      const targetSocketId = roomMap.get(targetUserId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('rtc_offer', { fromUserId: socket.user.id, description })
      }
    })

    socket.on('rtc_answer', ({ debateId, targetUserId, description }) => {
      const roomMap = voiceRooms.get(debateId)
      if (!roomMap) return
      const targetSocketId = roomMap.get(targetUserId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('rtc_answer', { fromUserId: socket.user.id, description })
      }
    })

    socket.on('rtc_ice', ({ debateId, targetUserId, candidate }) => {
      const roomMap = voiceRooms.get(debateId)
      if (!roomMap) return
      const targetSocketId = roomMap.get(targetUserId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('rtc_ice', { fromUserId: socket.user.id, candidate })
      }
    })

    socket.on('disconnect', () => {
      // Cleanup from all voice rooms
      for (const [debateId, roomMap] of voiceRooms.entries()) {
        if (roomMap.get(socket.user?.id) === socket.id) {
          roomMap.delete(socket.user.id)
          if (roomMap.size === 0) {
            voiceRooms.delete(debateId)
          }
          socket.to(debateId).emit('rtc_peer_left', { userId: socket.user.id })
        }
      }
    })
  })
}
