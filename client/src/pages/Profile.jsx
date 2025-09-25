import { useState, useEffect } from 'react'
import { userRequest, removeToken } from '../api/auth.js'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/LocaleProvider.jsx'
import './Profile.css'

function Profile() {
  const { t } = useI18n()
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
        setError(err.response?.data?.message || t('profile.error'))
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
      <div className="profile-container dark">
        <div className="loading">{t('profile.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-container dark">
        <div className="error">{t('profile.error')}: {error}</div>
      </div>
    )
  }

  return (
    <div className="profile-container dark">
      <div className="profile-card dark">
        <div className="profile-header">
          <button className="icon-btn back-btn" onClick={() => navigate(-1)} aria-label={t('common.back')} title={t('common.back')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 17l-5-5 5-5"/>
              <path d="M4 12h12"/>
              <rect x="17" y="6" width="3" height="12" rx="1"/>
            </svg>
          </button>
          <h1 className="profile-title">{t('profile.title')}</h1>
        </div>

        {user && (
          <div className="profile-info">
            <div className="profile-field">
              <label>{t('profile.id')}:</label>
              <span>{user.id}</span>
            </div>
            <div className="profile-field">
              <label>{t('profile.username')}:</label>
              <span>{user.username}</span>
            </div>
            <div className="profile-field">
              <label>{t('profile.email')}:</label>
              <span>{user.email}</span>
            </div>
            <div className="profile-field">
              <label>{t('profile.created_at')}:</label>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="profile-field">
              <label>{t('profile.updated_at')}:</label>
              <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        {/* No bottom back button as requested */}
      </div>
    </div>
  )
}

export default Profile