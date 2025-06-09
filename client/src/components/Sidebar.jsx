import React from 'react';

function Sidebar({ isOpen, onClose }) {
  const menuItems = [
    { label: 'Cuenta', icon: '👤' },
    { label: 'Ajustes', icon: '⚙️' },
    { label: 'Cerrar Sesión', icon: '🚪' }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="sidebar-content">
        {menuItems.map((item, index) => (
          <div key={index} className="sidebar-item">
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;