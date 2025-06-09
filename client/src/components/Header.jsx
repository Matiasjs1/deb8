import React from 'react';

function Header({ onToggleSidebar }) {
  return (
    <header className="header">
      <div className="logo">deb8</div>
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Buscar un debate" 
          className="search-input"
        />
        <button className="search-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>
      <button className="hamburger" onClick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>
  );
}

export default Header;