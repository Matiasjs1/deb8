import React from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteDebate } from '../api/debates.js';
import './DebateCard.css';

function DebateCard({ debate, currentUser }) {
  const navigate = useNavigate();
  const goToDebate = () => navigate(`/debates/${debate._id}`)
  const authorId = debate?.author?._id || debate?.author?.id || debate?.author
  const currentUserId = currentUser?._id || currentUser?.id
  const sameId = !!(currentUserId && authorId && String(authorId) === String(currentUserId))
  const sameUsername = !!(currentUser?.username && debate?.author?.username && String(currentUser.username) === String(debate.author.username))
  const isAuthor = sameId || sameUsername

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este debate?')) return;
    try {
      await deleteDebate(debate._id);
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar el debate');
    }
  }
  return (
    <div className="debate-card" onClick={goToDebate} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <h3 className="debate-title">{debate.title}</h3>
        <div className="card-actions">
          <div className="participants">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>{debate.currentParticipants}/{debate.maxParticipants}</span>
          </div>
          {isAuthor && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(e);
              }}
              title="Eliminar debate"
              className="trash-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
      <div className="card-footer">
        <div className="author-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>{debate.author?.username || 'Usuario'}</span>
        </div>
        <div className="duration">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span>{debate.duration} min</span>
        </div>
        <div className="format-indicator">
          {debate.format === 'Texto' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
        </div>
        <div className="tags">
          {debate.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DebateCard;