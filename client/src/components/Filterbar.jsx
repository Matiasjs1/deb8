import React, { useState, useEffect } from 'react';

function FilterBar({ selectedFilters, onFilterSelect, onApplyFilters }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterValues, setFilterValues] = useState({
    Tiempo: { min: '', max: '' },
    Modo: [],
    Formato: [],
    Personas: { min: '', max: '' },
    Temática: []
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({});

  const filters = ['Tiempo', 'Modo', 'Formato', 'Personas', 'Temática'];

  const filterOptions = {
    Modo: ['Por turnos', 'Libre', 'Moderado', 'Rápido'],
    Formato: ['Texto', 'Voz'],
    Temática: ['Política', 'Ciencia', 'Tecnología', 'Filosofía', 'Economía', 'Sociedad', 'Cultura', 'Deportes', 'Entretenimiento', 'Educación', 'Moral', 'Comida']
  };

  useEffect(() => {
    // Guardar valores iniciales para detectar cambios
    setInitialValues(JSON.parse(JSON.stringify(filterValues)));
  }, []);

  useEffect(() => {
    // Detectar si hay cambios comparando con valores iniciales
    const hasChanged = JSON.stringify(filterValues) !== JSON.stringify(initialValues);
    setHasChanges(hasChanged);
  }, [filterValues, initialValues]);

  const handleFilterClick = (filter) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
  };

  const handleInputChange = (filter, field, value) => {
    setFilterValues(prev => ({
      ...prev,
      [filter]: {
        ...prev[filter],
        [field]: value
      }
    }));
  };

  const handleMultiSelectChange = (filter, option) => {
    setFilterValues(prev => ({
      ...prev,
      [filter]: prev[filter].includes(option)
        ? prev[filter].filter(item => item !== option)
        : [...prev[filter], option]
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filterValues);
    setInitialValues(JSON.parse(JSON.stringify(filterValues)));
    setActiveFilter(null);
  };

  const handleClearFilters = () => {
    const clearedValues = {
      Tiempo: { min: '', max: '' },
      Modo: [],
      Formato: [],
      Personas: { min: '', max: '' },
      Temática: []
    };
    setFilterValues(clearedValues);
    setInitialValues(clearedValues);
    onApplyFilters(clearedValues);
    setActiveFilter(null);
  };

  const renderFilterContent = (filter) => {
    switch (filter) {
      case 'Tiempo':
        return (
          <div className="filter-dropdown-content">
            <h4>Duración del debate</h4>
            <div className="time-inputs">
              <div className="input-group">
                <label>Mínimo (min)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filterValues.Tiempo.min}
                  onChange={(e) => handleInputChange('Tiempo', 'min', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Máximo (min)</label>
                <input
                  type="number"
                  placeholder="120"
                  value={filterValues.Tiempo.max}
                  onChange={(e) => handleInputChange('Tiempo', 'max', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'Personas':
        return (
          <div className="filter-dropdown-content">
            <h4>Número de participantes</h4>
            <div className="time-inputs">
              <div className="input-group">
                <label>Mínimo</label>
                <input
                  type="number"
                  placeholder="1"
                  value={filterValues.Personas.min}
                  onChange={(e) => handleInputChange('Personas', 'min', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Máximo</label>
                <input
                  type="number"
                  placeholder="4"
                  value={filterValues.Personas.max}
                  onChange={(e) => handleInputChange('Personas', 'max', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'Modo':
      case 'Formato':
      case 'Temática':
        return (
          <div className="filter-dropdown-content">
            <h4>Seleccionar {filter.toLowerCase()}</h4>
            <div className="checkbox-group">
              {filterOptions[filter].map(option => (
                <label key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filterValues[filter].includes(option)}
                    onChange={() => handleMultiSelectChange(filter, option)}
                  />
                  <span className="checkmark"></span>
                  {option}
                  {filter === 'Formato' && (
                    <span className="format-icon">
                      {option === 'Texto' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      )}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="filter-bar">
      <div className="filter-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </div>
      
      <div className="filter-container">
        <div className="filter-tags">
          {filters.map(filter => (
            <div key={filter} className="filter-wrapper">
              <button
                className={`filter-tag ${activeFilter === filter ? 'filter-tag-active' : ''} ${
                  (filter === 'Tiempo' && (filterValues.Tiempo.min || filterValues.Tiempo.max)) ||
                  (filter === 'Personas' && (filterValues.Personas.min || filterValues.Personas.max)) ||
                  (['Modo', 'Formato', 'Temática'].includes(filter) && filterValues[filter].length > 0)
                    ? 'filter-tag-selected' : ''
                }`}
                onClick={() => handleFilterClick(filter)}
              >
                {filter}
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`dropdown-arrow ${activeFilter === filter ? 'dropdown-arrow-up' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>
              
              {activeFilter === filter && (
                <div className="filter-dropdown">
                  {renderFilterContent(filter)}
                </div>
              )}
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="filter-actions">
            <button className="filter-apply-btn" onClick={handleApplyFilters}>
              Filtrar
            </button>
            <button className="filter-clear-btn" onClick={handleClearFilters}>
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;