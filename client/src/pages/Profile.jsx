import { useState, useEffect } from 'react'
import { userRequest, removeToken } from '../api/auth.js'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userRequest()
        setUser(res.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(err.response?.data?.message || 'Error al cargar el perfil')
        setLoading(false)
        
        // Si hay un error de autenticación, redirigir al login
        if (err.response?.status === 401) {
          removeToken()
          navigate('/')
        }
      }
    }

    fetchProfile()
  }, [navigate])

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Cargando perfil...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error">Error: {error}</div>
        <button onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Mi Perfil</h1>
        {user && (
          <div className="profile-info">
            <div className="profile-field">
              <label>ID:</label>
              <span>{user.id}</span>
            </div>
            <div className="profile-field">
              <label>Usuario:</label>
              <span>{user.username}</span>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            <div className="profile-field">
              <label>Fecha de creación:</label>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="profile-field">
              <label>Última actualización:</label>
              <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        <div className="profile-actions">
          <button onClick={() => navigate('/home')} className="back-btn">
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile 