import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDebate, joinDebate as joinDebateAPI, leaveDebate as leaveDebateAPI, deleteDebate as deleteDebateAPI } from '../api/debates.js'
import { userRequest } from '../api/auth.js'
import { connectSocket, getSocket, joinDebateRoom, leaveDebateRoom, sendDebateMessage, setTyping, rtcJoin, rtcLeave, rtcSendOffer, rtcSendAnswer, rtcSendIce } from '../api/socket.js'
import './DebateRoom.css'

export default function DebateRoom() {
  const { id: debateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [debate, setDebate] = useState(null)
  const [user, setUser] = useState(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())

  // Voice state
  const localStreamRef = useRef(null)
  const pcsRef = useRef(new Map()) // userId -> RTCPeerConnection
  const [remoteStreams, setRemoteStreams] = useState({}) // userId -> MediaStream
  const [micOn, setMicOn] = useState(true)

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
        // Ensure user is participant (server enforces but we call join API to add if needed)
        try {
          await joinDebateAPI(debateId)
        } catch (_) {
          // ignore if already participant or full; socket will error if not allowed
        }

        connectSocket()

        if (d.format === 'Texto') {
          joinDebateRoom(debateId, (resp) => {
            if (!resp?.ok) {
              alert(resp?.error || 'Error al unirse al debate')
              navigate('/home')
              return
            }
            if (Array.isArray(resp.history)) setMessages(resp.history)
            if (resp.debate) {
              setDebate((prev) => ({ ...prev, ...resp.debate, participants: resp.debate.participants?.map(p => ({ user: { _id: p.id, username: p.username } })) }))
            }
            setLoading(false)
          })
        } else if (d.format === 'Voz') {
          // Voice: get media first
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          localStreamRef.current = stream
          // default mic on
          stream.getAudioTracks().forEach(t => t.enabled = true)

          // Join RTC room and get current peers
          rtcJoin(debateId, (resp) => {
            if (!resp?.ok) {
              alert(resp?.error || 'No se pudo entrar a la sala de voz')
              navigate('/home')
              return
            }
            setLoading(false)
            const peers = resp.peers || []
            // Create offers to existing peers
            peers.forEach(p => {
              createAndOfferToPeer(p.userId)
            })
          })

          // Wire signaling listeners
          const s = getSocket()
          s.on('rtc_peer_joined', ({ userId }) => {
            // New peer joined, we initiate offer
            createAndOfferToPeer(userId)
          })
          s.on('rtc_peer_left', ({ userId }) => {
            const pc = pcsRef.current.get(userId)
            if (pc) {
              pc.close()
              pcsRef.current.delete(userId)
            }
            setRemoteStreams(prev => {
              const next = { ...prev }
              delete next[userId]
              return next
            })
          })
          s.on('rtc_offer', async ({ fromUserId, description }) => {
            const pc = await ensurePeerConnection(fromUserId)
            await pc.setRemoteDescription(description)
            // Ensure local tracks
            attachLocalTracks(pc)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            rtcSendAnswer(debateId, fromUserId, pc.localDescription)
          })
          s.on('rtc_answer', async ({ fromUserId, description }) => {
            const pc = await ensurePeerConnection(fromUserId)
            await pc.setRemoteDescription(description)
          })
          s.on('rtc_ice', async ({ fromUserId, candidate }) => {
            const pc = await ensurePeerConnection(fromUserId)
            if (candidate) {
              try { await pc.addIceCandidate(candidate) } catch (_) {}
            }
          })
        }

        const s = getSocket()
        // Common events
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
        s.on('participants_update', (payload) => {
          if (!payload || payload.debateId !== debateId) return
          setDebate((prev) => ({
            ...prev,
            participants: (payload.participants || []).map(p => ({ user: { _id: p.user, username: p.username } })),
            currentParticipants: payload.currentParticipants ?? prev?.currentParticipants
          }))
        })
        s.on('debate_deleted', ({ _id }) => {
          if (String(_id) === String(debateId)) {
            alert('El debate ha sido eliminado por su creador.')
            navigate('/home')
          }
        })
      } catch (err) {
        console.error(err)
        alert('Error cargando el debate')
        navigate('/home')
      }
    }
    init()

    return () => {
      // Leave text room if any
      leaveDebateRoom(debateId)
      // Leave voice room and cleanup
      try { rtcLeave(debateId) } catch (_) {}
      for (const pc of pcsRef.current.values()) {
        try { pc.close() } catch (_) {}
      }
      pcsRef.current.clear()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
      const s = getSocket()
      if (s) {
        s.off('message')
        s.off('typing')
        s.off('system')
        s.off('participants_update')
        s.off('debate_deleted')
        s.off('rtc_peer_joined')
        s.off('rtc_peer_left')
        s.off('rtc_offer')
        s.off('rtc_answer')
        s.off('rtc_ice')
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

  const handleLeave = async () => {
    try {
      await leaveDebateAPI(debateId)
    } catch (_) {
      // ignore API error
    }
    leaveDebateRoom(debateId)
    try { rtcLeave(debateId) } catch (_) {}
    navigate('/home')
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este debate? Esta acción no se puede deshacer.')) return
    try {
      await deleteDebateAPI(debateId)
      navigate('/home')
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar el debate')
    }
  }

  // --- WebRTC helpers ---
  function createPeerConnection(targetUserId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    pc.onicecandidate = (e) => {
      if (e.candidate) rtcSendIce(debateId, targetUserId, e.candidate)
    }
    pc.ontrack = (e) => {
      const [stream] = e.streams
      if (stream) {
        setRemoteStreams(prev => ({ ...prev, [targetUserId]: stream }))
      }
    }
    pcsRef.current.set(targetUserId, pc)
    return pc
  }

  function attachLocalTracks(pc) {
    const stream = localStreamRef.current
    if (!stream) return
    const senders = pc.getSenders()
    const hasAudio = senders.some(s => s.track && s.track.kind === 'audio')
    if (!hasAudio) {
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream))
    }
  }

  async function ensurePeerConnection(targetUserId) {
    let pc = pcsRef.current.get(targetUserId)
    if (!pc) pc = createPeerConnection(targetUserId)
    return pc
  }

  async function createAndOfferToPeer(targetUserId) {
    const pc = await ensurePeerConnection(targetUserId)
    attachLocalTracks(pc)
    const offer = await pc.createOffer({ offerToReceiveAudio: true })
    await pc.setLocalDescription(offer)
    rtcSendOffer(debateId, targetUserId, pc.localDescription)
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>Cargando debate...</div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 20px)', padding: 10, gap: 12 }}>
      <div style={{ flex: 3, border: '1px solid #222', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{debate.title}</div>
            <div style={{ color: '#9aa' }}>{debate.description}</div>
          </div>
          <div className="room-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#9aa' }}>Modo: {debate.mode}</div>
            {debate.format === 'Voz' && (
              <button onClick={() => {
                const stream = localStreamRef.current
                if (!stream) return
                const enabled = !micOn
                stream.getAudioTracks().forEach(t => (t.enabled = enabled))
                setMicOn(enabled)
              }} title={micOn ? 'Silenciar micrófono' : 'Activar micrófono'} className="icon-btn" aria-label="Mic">
                {micOn ? '🎙️' : '🔇'}
              </button>
            )}
            <button onClick={handleLeave} title="Salir del debate" className="icon-btn exit-btn" aria-label="Salir">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 17l-5-5 5-5"/>
                <path d="M4 12h12"/>
                <path d="M20 19V5a2 2 0 0 0-2-2h-6"/>
              </svg>
            </button>
            {(() => {
              const authorId = debate?.author?._id || debate?.author?.id || debate?.author
              const userId = user?._id || user?.id
              return !!(authorId && userId && String(authorId) === String(userId))
            })() && (
              <button onClick={handleDelete} title="Eliminar debate" className="icon-btn trash-btn" aria-label="Eliminar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        {debate.format === 'Texto' ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#6cc' }}>{user?._id && m.userId === user._id ? 'Yo' : m.username}</div>
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
          </>
        ) : (
          // Voice UI
          <div style={{ flex: 1, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start', overflowY: 'auto' }}>
            <div style={{ border: '1px solid #17324d', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Mi audio</div>
              <audio
                controls
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el && localStreamRef.current) el.srcObject = localStreamRef.current
                }}
                style={{ width: '100%' }} />
              <div style={{ fontSize: 12, color: '#9aa', marginTop: 6 }}>{micOn ? 'Micrófono activo' : 'Micrófono silenciado'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {Object.entries(remoteStreams).map(([uid, stream]) => (
                <div key={uid} style={{ border: '1px solid #17324d', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Participante {uid.slice(-4)}</div>
                  <audio controls autoPlay playsInline ref={(el) => { if (el) el.srcObject = stream }} style={{ width: '100%' }} />
                </div>
              ))}
              {Object.keys(remoteStreams).length === 0 && (
                <div style={{ color: '#9aa' }}>Esperando a otros participantes...</div>
              )}
            </div>
          </div>
        )}
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
