import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDebate, joinDebate as joinDebateAPI } from '../api/debates.js'
import { userRequest } from '../api/auth.js'
import { connectSocket, getSocket, joinDebateRoom, leaveDebateRoom, sendDebateMessage, setTyping } from '../api/socket.js'

export default function DebateRoom() {
  const { id: debateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [debate, setDebate] = useState(null)
  const [user, setUser] = useState(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())

  const endRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Ensure user is authenticated
        const u = await userRequest()
        setUser(u.data)
        // Load debate details
        const res = await getDebate(debateId)
        const d = res.data.debate
        setDebate(d)
        if (d.format !== 'Texto') {
          alert('Este debate no es de texto. Aún no soportado en esta vista.')
          navigate('/home')
          return
        }
        // Ensure user is participant (server enforces but we call join API to add if needed)
        try {
          await joinDebateAPI(debateId)
        } catch (_) {
          // ignore if already participant or full; socket will error if not allowed
        }

        connectSocket()
        joinDebateRoom(debateId, (resp) => {
          if (!resp?.ok) {
            alert(resp?.error || 'Error al unirse al debate')
            navigate('/home')
            return
          }
          if (Array.isArray(resp.history)) setMessages(resp.history)
          setLoading(false)
        })

        const s = getSocket()
        s.on('message', (msg) => {
          setMessages((prev) => [...prev, msg])
        })
        s.on('typing', ({ userId, typing }) => {
          setTypingUsers((prev) => {
            const next = new Set(prev)
            if (typing) next.add(userId)
            else next.delete(userId)
            return next
          })
        })
        s.on('system', (evt) => {
          // Could handle join/leave notifications
        })
      } catch (err) {
        console.error(err)
        alert('Error cargando el debate')
        navigate('/home')
      }
    }
    init()

    return () => {
      leaveDebateRoom(debateId)
      const s = getSocket()
      if (s) {
        s.off('message')
        s.off('typing')
        s.off('system')
      }
    }
  }, [debateId, navigate])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const txt = input.trim()
    if (!txt) return
    sendDebateMessage(debateId, txt, (resp) => {
      if (!resp?.ok) alert(resp?.error || 'No se pudo enviar el mensaje')
    })
    setInput('')
    setTyping(debateId, false)
  }

  const handleTyping = (val) => {
    setInput(val)
    setTyping(debateId, true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setTyping(debateId, false), 1200)
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>Cargando debate...</div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 20px)', padding: 10, gap: 12 }}>
      <div style={{ flex: 3, border: '1px solid #222', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{debate.title}</div>
            <div style={{ color: '#9aa' }}>{debate.description}</div>
          </div>
          <div style={{ color: '#9aa' }}>Modo: {debate.mode}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#6cc' }}>{m.username}</div>
              <div style={{ background: '#0c1622', border: '1px solid #17324d', display: 'inline-block', padding: '6px 10px', borderRadius: 6 }}>{m.content}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #222' }}>
          {typingUsers.size > 0 && (
            <div style={{ fontSize: 12, color: '#9aa', marginBottom: 6 }}>
              Alguien está escribiendo...
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
              placeholder="Escribe tu mensaje"
              style={{ flex: 1, padding: '10px 12px', background: '#0b1520', color: 'white', border: '1px solid #17324d', borderRadius: 6 }}
            />
            <button onClick={handleSend} style={{ padding: '10px 16px', background: '#00d4ff', color: '#05101a', border: 0, borderRadius: 6, fontWeight: 700 }}>Enviar</button>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, border: '1px solid #222', borderRadius: 8 }}>
        <div style={{ padding: 12, borderBottom: '1px solid #222', fontWeight: 700 }}>Participantes</div>
        <div style={{ padding: 12 }}>
          {debate.participants?.map((p) => (
            <div key={p.user?._id || p.user?.id} style={{ marginBottom: 8 }}>
              {p.user?.username || 'Usuario'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
