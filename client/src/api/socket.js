import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  return socket
}

export function connectSocket() {
  if (!socket || !socket.connected) {
    socket = io('http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinDebateRoom(debateId, cb) {
  const s = connectSocket()
  if (s.connected) {
    s.emit('join_room', { debateId }, cb)
  } else {
    s.on('connect', () => {
      s.emit('join_room', { debateId }, cb)
    })
  }
}

export function leaveDebateRoom(debateId) {
  if (!socket) return
  socket.emit('leave_room', { debateId })
}

export function sendDebateMessage(debateId, content, cb) {
  if (!socket) return cb && cb({ ok: false, error: 'Socket no conectado' })
  socket.emit('send_message', { debateId, content }, cb)
}

export function setTyping(debateId, typing) {
  if (!socket) return
  socket.emit('typing', { debateId, typing })
}
