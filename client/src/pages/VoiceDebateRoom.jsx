import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDebate, joinDebate as joinDebateAPI, leaveDebate as leaveDebateAPI, deleteDebate as deleteDebateAPI } from '../api/debates.js'
import { userRequest } from '../api/auth.js'
import { connectSocket, getSocket, joinVoiceDebateRoom, leaveVoiceDebateRoom } from '../api/socket.js'
import './VoiceDebateRoom.css'

export default function VoiceDebateRoom() {
  const { id: debateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [debate, setDebate] = useState(null)
  const [user, setUser] = useState(null)
  
  const [participants, setParticipants] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [speakingUsers, setSpeakingUsers] = useState(new Set()) // socketIds of users currently speaking
  const [mutedUsers, setMutedUsers] = useState(new Set()) // socketIds of muted users

  const localStreamRef = useRef(null)
  const peerConnectionsRef = useRef({}) // socketId -> RTCPeerConnection
  const remoteStreamsRef = useRef({}) // socketId -> MediaStream
  const audioElementsRef = useRef({}) // socketId -> HTMLAudioElement
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const speakingTimeoutRef = useRef(null)

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    const init = async () => {
      try {
        // Get user info
        const u = await userRequest()
        setUser(u.data)
        
        // Load debate details
        const res = await getDebate(debateId)
        const d = res.data.debate
        setDebate(d)
        
        if (d.format !== 'Voz') {
          alert('Este debate no es de voz.')
          navigate('/home')
          return
        }

        // Join debate via API
        try {
          await joinDebateAPI(debateId)
        } catch (_) {
          // ignore if already participant
        }

        // Connect to socket
        connectSocket()
        joinVoiceDebateRoom(debateId, (resp) => {
          if (!resp?.ok) {
            alert(resp?.error || 'Error al unirse al debate de voz')
            navigate('/home')
            return
          }
          
          if (resp.debate) {
            setDebate((prev) => ({ 
              ...prev, 
              ...resp.debate, 
              participants: resp.debate.participants?.map(p => ({ 
                user: { _id: p.id, username: p.username } 
              })) 
            }))
          }

          // Initialize participants list
          const allParticipants = [
            { socketId: 'local', userId: u.data._id, username: u.data.username, isLocal: true },
            ...(resp.otherUsers || []).map(user => ({ ...user, isLocal: false }))
          ]
          setParticipants(allParticipants)
          setLoading(false)
        })

        const s = getSocket()
        
        // Handle new user joining
        s.on('voice_user_joined', async ({ socketId, userId, username }) => {
          setParticipants(prev => {
            if (prev.some(p => p.socketId === socketId)) return prev
            return [...prev, { socketId, userId, username, isLocal: false }]
          })
          
          // If we have local stream, create offer for new user
          if (localStreamRef.current) {
            await createPeerConnection(socketId, true)
          }
        })

        // Handle user leaving
        s.on('voice_user_left', ({ socketId }) => {
          setParticipants(prev => prev.filter(p => p.socketId !== socketId))
          closePeerConnection(socketId)
        })

        // WebRTC signaling handlers
        s.on('webrtc_offer', async ({ fromSocketId, offer }) => {
          await handleOffer(fromSocketId, offer)
        })

        s.on('webrtc_answer', async ({ fromSocketId, answer }) => {
          await handleAnswer(fromSocketId, answer)
        })

        s.on('webrtc_ice_candidate', async ({ fromSocketId, candidate }) => {
          await handleIceCandidate(fromSocketId, candidate)
        })

        s.on('debate_deleted', ({ _id }) => {
          if (String(_id) === String(debateId)) {
            alert('El debate ha sido eliminado por su creador.')
            navigate('/home')
          }
        })

        // Handle speaking status updates
        s.on('user_speaking', ({ socketId, isSpeaking }) => {
          console.log('🎤 Usuario hablando:', socketId, isSpeaking)
          setSpeakingUsers(prev => {
            const next = new Set(prev)
            if (isSpeaking) {
              next.add(socketId)
            } else {
              next.delete(socketId)
            }
            return next
          })
        })

        // Handle muted status updates
        s.on('user_muted', ({ socketId, isMuted }) => {
          console.log('🔇 Usuario muteado:', socketId, isMuted)
          setMutedUsers(prev => {
            const next = new Set(prev)
            if (isMuted) {
              next.add(socketId)
            } else {
              next.delete(socketId)
            }
            return next
          })
        })

      } catch (err) {
        console.error(err)
        alert('Error cargando el debate')
        navigate('/home')
      }
    }
    init()

    return () => {
      stopAudio()
      leaveVoiceDebateRoom(debateId)
      const s = getSocket()
      if (s) {
        s.off('voice_user_joined')
        s.off('voice_user_left')
        s.off('webrtc_offer')
        s.off('webrtc_answer')
        s.off('webrtc_ice_candidate')
        s.off('debate_deleted')
        s.off('user_speaking')
        s.off('user_muted')
      }
    }
  }, [debateId, navigate])

  const createPeerConnection = async (socketId, isInitiator) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionsRef.current[socketId] = pc

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current)
        })
      }

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        remoteStreamsRef.current[socketId] = remoteStream
        
        // Create or update audio element
        if (!audioElementsRef.current[socketId]) {
          const audio = new Audio()
          audio.srcObject = remoteStream
          audio.autoplay = true
          audioElementsRef.current[socketId] = audio
        } else {
          audioElementsRef.current[socketId].srcObject = remoteStream
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const s = getSocket()
          s.emit('webrtc_ice_candidate', {
            debateId,
            targetSocketId: socketId,
            candidate: event.candidate
          })
        }
      }

      // If initiator, create and send offer
      if (isInitiator) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        const s = getSocket()
        s.emit('webrtc_offer', {
          debateId,
          targetSocketId: socketId,
          offer: pc.localDescription
        })
      }

      return pc
    } catch (error) {
      console.error('Error creating peer connection:', error)
    }
  }

  const handleOffer = async (fromSocketId, offer) => {
    try {
      let pc = peerConnectionsRef.current[fromSocketId]
      if (!pc) {
        pc = await createPeerConnection(fromSocketId, false)
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      const s = getSocket()
      s.emit('webrtc_answer', {
        debateId,
        targetSocketId: fromSocketId,
        answer: pc.localDescription
      })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (fromSocketId, answer) => {
    try {
      const pc = peerConnectionsRef.current[fromSocketId]
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      }
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (fromSocketId, candidate) => {
    try {
      const pc = peerConnectionsRef.current[fromSocketId]
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  const closePeerConnection = (socketId) => {
    const pc = peerConnectionsRef.current[socketId]
    if (pc) {
      pc.close()
      delete peerConnectionsRef.current[socketId]
    }

    const audio = audioElementsRef.current[socketId]
    if (audio) {
      audio.pause()
      audio.srcObject = null
      delete audioElementsRef.current[socketId]
    }

    delete remoteStreamsRef.current[socketId]
  }

  const detectSpeaking = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const threshold = 15 // Adjust this value to change sensitivity

    const isSpeaking = average > threshold

    // Debug log
    if (isSpeaking && !isMuted) {
      console.log('🎤 Detectado audio local, nivel:', average)
    }

    // Update local speaking state
    setSpeakingUsers(prev => {
      const next = new Set(prev)
      if (isSpeaking && !isMuted) {
        next.add('local')
      } else {
        next.delete('local')
      }
      return next
    })

    // Notify others
    const s = getSocket()
    if (s && !isMuted) {
      if (isSpeaking) {
        console.log('📡 Emitiendo voice_speaking a otros usuarios')
        s.emit('voice_speaking', { debateId, isSpeaking: true })
        
        // Clear previous timeout
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current)
        }
        
        // Set timeout to stop speaking indicator
        speakingTimeoutRef.current = setTimeout(() => {
          s.emit('voice_speaking', { debateId, isSpeaking: false })
        }, 500)
      }
    }

    // Continue monitoring
    if (audioEnabled) {
      requestAnimationFrame(detectSpeaking)
    }
  }

  const startAudio = async () => {
    try {
      setIsConnecting(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      })
      
      localStreamRef.current = stream
      setAudioEnabled(true)
      setIsConnecting(false)

      // Setup audio analysis for speaking detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Start detecting speaking
      detectSpeaking()

      // Create peer connections with all existing participants
      const otherParticipants = participants.filter(p => !p.isLocal)
      for (const participant of otherParticipants) {
        await createPeerConnection(participant.socketId, true)
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.')
      setIsConnecting(false)
    }
  }

  const stopAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Clear speaking timeout
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current)
    }

    // Close all peer connections
    Object.keys(peerConnectionsRef.current).forEach(socketId => {
      closePeerConnection(socketId)
    })

    setSpeakingUsers(new Set())
    setAudioEnabled(false)
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        const newMutedState = !audioTrack.enabled
        setIsMuted(newMutedState)
        
        console.log('🔇 Cambiando estado de mute:', newMutedState)
        
        // Notify others about mute status
        const s = getSocket()
        if (s) {
          console.log('📡 Emitiendo voice_muted a otros usuarios:', newMutedState)
          s.emit('voice_muted', { debateId, isMuted: newMutedState })
        }

        // Update local muted users set
        setMutedUsers(prev => {
          const next = new Set(prev)
          if (newMutedState) {
            next.add('local')
          } else {
            next.delete('local')
          }
          return next
        })

        // Clear speaking state when muted
        if (newMutedState) {
          setSpeakingUsers(prev => {
            const next = new Set(prev)
            next.delete('local')
            return next
          })
          if (s) {
            s.emit('voice_speaking', { debateId, isSpeaking: false })
          }
        }
      }
    }
  }

  const handleLeave = async () => {
    try {
      await leaveDebateAPI(debateId)
    } catch (_) {
      // ignore API error
    }
    stopAudio()
    leaveVoiceDebateRoom(debateId)
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

  if (loading) {
    return (
      <div style={{ padding: 24 }}>Cargando debate...</div>
    )
  }

  const isAuthor = debate?.author?._id === user?._id || debate?.author === user?._id

  return (
    <div className="voice-debate-container">
      <div className="voice-debate-main">
        <div className="voice-debate-header">
          <div>
            <div className="debate-title">{debate.title}</div>
            <div className="debate-description">{debate.description}</div>
          </div>
          <div className="header-actions">
            <div className="debate-mode">Modo: {debate.mode}</div>
            <button onClick={handleLeave} title="Salir del debate" className="icon-btn exit-btn" aria-label="Salir">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 17l-5-5 5-5"/>
                <path d="M4 12h12"/>
                <path d="M20 19V5a2 2 0 0 0-2-2h-6"/>
              </svg>
            </button>
            {isAuthor && (
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

        <div className="voice-participants-grid">
          {participants.map((participant) => {
            const isSpeaking = speakingUsers.has(participant.socketId)
            const isMutedUser = mutedUsers.has(participant.socketId)
            
            return (
              <div 
                key={participant.socketId} 
                className={`voice-participant ${participant.isLocal ? 'local' : ''} ${isSpeaking ? 'speaking' : ''}`}
              >
                <div className="participant-avatar">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="participant-name">
                  {participant.username}
                  {participant.isLocal && ' (Tú)'}
                </div>
                <div className="participant-status">
                  {isMutedUser ? (
                    <span className="status-muted">🔇 Silenciado</span>
                  ) : isSpeaking ? (
                    <span className="status-speaking">🎤 Hablando</span>
                  ) : (
                    <span className="status-idle">🎤 Conectado</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="voice-controls">
          {!audioEnabled ? (
            <button 
              onClick={startAudio} 
              disabled={isConnecting}
              className="btn-primary voice-control-btn"
            >
              {isConnecting ? 'Conectando...' : '🎤 Activar Micrófono'}
            </button>
          ) : (
            <div className="active-controls">
              <button 
                onClick={toggleMute} 
                className={`btn-control ${isMuted ? 'muted' : ''}`}
                title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button 
                onClick={stopAudio} 
                className="btn-danger voice-control-btn"
              >
                Desconectar Audio
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="voice-sidebar">
        <div className="sidebar-header">Participantes</div>
        <div className="sidebar-content">
          {debate.participants?.map((p) => (
            <div key={p.user?._id || p.user?.id} className="sidebar-participant">
              {p.user?.username || 'Usuario'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
