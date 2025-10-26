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

  io.on('connection', (socket) => {
    // Join a debate room (texto)
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

    // Join a voice debate room
    socket.on('join_voice_room', async ({ debateId }, cb) => {
      try {
        if (!debateId) throw new Error('debateId requerido')
        const debate = await Debate.findById(debateId)
          .populate('author', 'username')
          .populate('participants.user', 'username')
        if (!debate) throw new Error('Debate no encontrado')
        if (debate.status === 'Cerrado') throw new Error('Debate cerrado')
        if (debate.format !== 'Voz') throw new Error('Este debate no es de voz')

        // Verify participant
        const isParticipant = debate.participants.some(p => {
          const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
          return uid === socket.user.id
        })
        if (!isParticipant) throw new Error('No eres participante de este debate')

        socket.join(debateId)
        
        // Get all sockets in the room
        const socketsInRoom = await io.in(debateId).fetchSockets()
        const otherUsers = socketsInRoom
          .filter(s => s.id !== socket.id)
          .map(s => ({ 
            socketId: s.id, 
            userId: s.user.id,
            username: debate.participants.find(p => {
              const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
              return uid === s.user.id
            })?.user?.username || 'Usuario'
          }))

        cb && cb({ 
          ok: true, 
          debate: {
            id: debate.id,
            title: debate.title,
            mode: debate.mode,
            status: debate.status,
            participants: debate.participants.map(p => ({ id: p.user._id || p.user, username: p.user.username }))
          },
          otherUsers
        })

        // Notify others that a new user joined
        socket.to(debateId).emit('voice_user_joined', { 
          socketId: socket.id,
          userId: socket.user.id,
          username: debate.participants.find(p => {
            const uid = (p.user && p.user._id) ? p.user._id.toString() : (p.user ? p.user.toString() : '')
            return uid === socket.user.id
          })?.user?.username || 'Usuario'
        })
      } catch (error) {
        cb && cb({ ok: false, error: error.message })
      }
    })

    // WebRTC signaling for voice debates
    socket.on('webrtc_offer', ({ debateId, targetSocketId, offer }) => {
      socket.to(targetSocketId).emit('webrtc_offer', {
        fromSocketId: socket.id,
        offer
      })
    })

    socket.on('webrtc_answer', ({ debateId, targetSocketId, answer }) => {
      socket.to(targetSocketId).emit('webrtc_answer', {
        fromSocketId: socket.id,
        answer
      })
    })

    socket.on('webrtc_ice_candidate', ({ debateId, targetSocketId, candidate }) => {
      socket.to(targetSocketId).emit('webrtc_ice_candidate', {
        fromSocketId: socket.id,
        candidate
      })
    })

    // Voice room leave
    socket.on('leave_voice_room', ({ debateId }) => {
      if (debateId) {
        socket.to(debateId).emit('voice_user_left', { socketId: socket.id, userId: socket.user.id })
        socket.leave(debateId)
      }
    })

    // Voice status updates
    socket.on('voice_speaking', ({ debateId, isSpeaking }) => {
      console.log('🎤 [SERVER] voice_speaking recibido:', socket.id, isSpeaking)
      if (debateId) {
        socket.to(debateId).emit('user_speaking', { socketId: socket.id, userId: socket.user.id, isSpeaking })
        console.log('📡 [SERVER] Emitiendo user_speaking a sala:', debateId)
      }
    })

    socket.on('voice_muted', ({ debateId, isMuted }) => {
      console.log('🔇 [SERVER] voice_muted recibido:', socket.id, isMuted)
      if (debateId) {
        socket.to(debateId).emit('user_muted', { socketId: socket.id, userId: socket.user.id, isMuted })
        console.log('📡 [SERVER] Emitiendo user_muted a sala:', debateId)
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

    socket.on('disconnect', () => {
      // No-op; rooms auto-clean on disconnect
    })
  })
}
