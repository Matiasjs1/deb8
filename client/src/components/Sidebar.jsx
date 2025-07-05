import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userRequest, removeToken, isAuthenticated } from '../api/auth.js';

function Sidebar({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (isAuthenticated()) {
          const res = await userRequest();
          setUser(res.data);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
        // Si hay error de autenticación, limpiar token
        if (error.response?.status === 401) {
          removeToken();
        }
      } finally {
        setLoadingUser(false);
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const handleProfileClick = () => {
    navigate('/profile');
    onClose();
  };

  const handleLogout = () => {
    removeToken();
    navigate('/');
    onClose();
  };

  const menuItems = [
    { 
      label: 'Mi Perfil', 
      icon: '👤', 
      onClick: handleProfileClick,
      show: user !== null 
    },
    { 
      label: 'Ajustes', 
      icon: '⚙️', 
      onClick: () => console.log('Ajustes'),
      show: true 
    },
    { 
      label: 'Cerrar Sesión', 
      icon: '🚪', 
      onClick: handleLogout,
      show: user !== null 
    }
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
      
      {user && (
        <div className="sidebar-user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">{user.username}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      )}

      <div className="sidebar-content">
        {menuItems
          .filter(item => item.show)
          .map((item, index) => (
            <div key={index} className="sidebar-item" onClick={item.onClick}>
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Sidebar;