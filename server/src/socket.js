import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import Debate from './models/debate.model.js'

// In-memory message store (MVP). For production, persist to Mongo.
const messagesStore = new Map() // debateId -> [{ userId, username, content, ts }]

// Turn system state per debate
// debateId -> { speakingUserId, turnEndsAt, queue: [userId], moderatorId, turnTimer }
const turnStates = new Map()

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

// Turn system helpers
function getTurnState(debateId) {
  if (!turnStates.has(debateId)) {
    turnStates.set(debateId, {
      speakingUserId: null,
      turnEndsAt: null,
      queue: [],
      moderatorId: null,
      turnTimer: null
    })
  }
  return turnStates.get(debateId)
}

function emitTurnState(io, debateId) {
  const state = getTurnState(debateId)
  io.to(debateId).emit('turn_state', {
    debateId,
    speakingUserId: state.speakingUserId,
    turnEndsAt: state.turnEndsAt,
    queue: state.queue,
    moderatorId: state.moderatorId
  })
}

function startTurn(io, debateId, userId, durationSeconds = 60) {
  const state = getTurnState(debateId)
  
  // Clear any existing timer
  if (state.turnTimer) {
    clearTimeout(state.turnTimer)
  }
  
  state.speakingUserId = userId
  state.turnEndsAt = new Date(Date.now() + durationSeconds * 1000).toISOString()
  
  // Set timer to auto-end turn
  state.turnTimer = setTimeout(() => {
    endTurn(io, debateId)
  }, durationSeconds * 1000)
  
  emitTurnState(io, debateId)
}

function endTurn(io, debateId) {
  const state = getTurnState(debateId)
  
  if (state.turnTimer) {
    clearTimeout(state.turnTimer)
    state.turnTimer = null
  }
  
  state.speakingUserId = null
  state.turnEndsAt = null
  
  emitTurnState(io, debateId)
}

function grantNextInQueue(io, debateId) {
  const state = getTurnState(debateId)
  
  if (state.queue.length > 0) {
    const nextUserId = state.queue.shift()
    startTurn(io, debateId, nextUserId)
  } else {
    endTurn(io, debateId)
  }
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
        
        // Initialize turn state if needed
        const turnState = getTurnState(debateId)
        if (!turnState.moderatorId && debate.author) {
          turnState.moderatorId = debate.author._id ? debate.author._id.toString() : debate.author.toString()
        }
        
        // Send last messages if any
        const history = messagesStore.get(debateId) || []
        cb && cb({ ok: true, history, debate: {
          id: debate.id,
          title: debate.title,
          mode: debate.mode,
          status: debate.status,
          author: debate.author,
          participants: debate.participants.map(p => ({ id: p.user.id, username: p.user.username }))
        }, turnState: {
          speakingUserId: turnState.speakingUserId,
          turnEndsAt: turnState.turnEndsAt,
          queue: turnState.queue,
          moderatorId: turnState.moderatorId
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

    // Turn system events
    socket.on('request_speak', async ({ debateId }) => {
      try {
        if (!debateId) return
        const debate = await Debate.findById(debateId)
        if (!debate) return
        
        const state = getTurnState(debateId)
        const userId = socket.user.id
        
        // Check if user is already in queue or speaking
        if (state.speakingUserId === userId) return
        if (state.queue.includes(userId)) return
        
        if (debate.mode === 'Por turnos') {
          // Auto-grant if no one is speaking
          if (!state.speakingUserId) {
            startTurn(io, debateId, userId)
          } else {
            // Add to queue
            state.queue.push(userId)
            io.to(debateId).emit('queue_updated', { debateId, queue: state.queue })
          }
        } else if (debate.mode === 'Moderado') {
          // Add to queue for moderator approval
          state.queue.push(userId)
          io.to(debateId).emit('queue_updated', { debateId, queue: state.queue })
        }
      } catch (error) {
        console.error('Error in request_speak:', error)
      }
    })
    
    socket.on('cancel_request', async ({ debateId }) => {
      try {
        if (!debateId) return
        const state = getTurnState(debateId)
        const userId = socket.user.id
        
        // Remove from queue
        const index = state.queue.indexOf(userId)
        if (index > -1) {
          state.queue.splice(index, 1)
          io.to(debateId).emit('queue_updated', { debateId, queue: state.queue })
        }
      } catch (error) {
        console.error('Error in cancel_request:', error)
      }
    })
    
    socket.on('moderator_grant', async ({ debateId, userId: targetUserId }) => {
      try {
        if (!debateId || !targetUserId) return
        const debate = await Debate.findById(debateId)
        if (!debate) return
        
        const state = getTurnState(debateId)
        const moderatorId = socket.user.id
        
        // Verify moderator
        if (state.moderatorId !== moderatorId) return
        
        // Remove from queue if present
        const index = state.queue.indexOf(targetUserId)
        if (index > -1) {
          state.queue.splice(index, 1)
        }
        
        // Grant turn
        startTurn(io, debateId, targetUserId)
      } catch (error) {
        console.error('Error in moderator_grant:', error)
      }
    })
    
    socket.on('moderator_revoke', async ({ debateId }) => {
      try {
        if (!debateId) return
        const debate = await Debate.findById(debateId)
        if (!debate) return
        
        const state = getTurnState(debateId)
        const moderatorId = socket.user.id
        
        // Verify moderator
        if (state.moderatorId !== moderatorId) return
        
        endTurn(io, debateId)
      } catch (error) {
        console.error('Error in moderator_revoke:', error)
      }
    })
    
    socket.on('moderator_next', async ({ debateId }) => {
      try {
        if (!debateId) return
        const debate = await Debate.findById(debateId)
        if (!debate) return
        
        const state = getTurnState(debateId)
        const moderatorId = socket.user.id
        
        // Verify moderator
        if (state.moderatorId !== moderatorId) return
        
        grantNextInQueue(io, debateId)
      } catch (error) {
        console.error('Error in moderator_next:', error)
      }
    })

    socket.on('disconnect', () => {
      // No-op; rooms auto-clean on disconnect
    })
  })
}
