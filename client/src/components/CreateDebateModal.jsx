import React, { useState } from 'react';
import { createDebate } from '../api/debates.js';
import './CreateDebateModal.css';

function CreateDebateModal({ isOpen, onClose, onDebateCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxParticipants: 4,
    duration: 30,
    format: 'Voz',
    mode: 'Libre',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await createDebate(formData);

      onDebateCreated(response.data.debate);
      onClose();
      setFormData({
        title: '',
        description: '',
        maxParticipants: 4,
        duration: 30,
        format: 'Voz',
        mode: 'Libre',
        tags: []
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear el debate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Nuevo Debate</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="debate-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Título del Debate *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Ej: ¿Cuál es la mejor temporada?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Describe el tema del debate..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxParticipants">Máximo de Participantes</label>
              <select
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>

              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duración (minutos)</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
              >
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={25}>25 min</option>
                <option value={30}>30 min</option>
                <option value={35}>35 min</option>
                <option value={40}>40 min</option>
                <option value={45}>45 min</option>
                <option value={50}>50 min</option>
                <option value={55}>55 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="format">Formato</label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
              >
                <option value="Voz">Voz</option>
                <option value="Texto">Texto</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mode">Modo</label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleInputChange}
              >
                <option value="Libre">Libre</option>
                <option value="Por turnos">Por turnos</option>
                <option value="Moderado">Moderado</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Etiquetas</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Agregar etiqueta..."
              />
              <button type="button" onClick={handleAddTag} className="add-tag-btn">
                +
              </button>
            </div>
            <div className="tags-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Debate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDebateModal;
