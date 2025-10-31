import React from 'react';
import { useI18n } from '../i18n/LocaleProvider.jsx';

function Header({ onToggleSidebar, user, loadingUser, searchTerm, onSearchChange, onSearchSubmit }) {
  const { t } = useI18n();
  
  return (
    <header className="header">
      <div className="logo">deb8</div>
      <form className="search-container" onSubmit={(e) => { e.preventDefault(); onSearchSubmit && onSearchSubmit(); }}>
        <input 
          type="text" 
          placeholder={t('common.search_placeholder')} 
          className="search-input"
          value={searchTerm || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        <button type="submit" className="search-button" onClick={(e) => { e.preventDefault(); onSearchSubmit && onSearchSubmit(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </form>
      {/*Hola usuario
      <div className="user-info">
        {loadingUser ? (
          <span>{t('common.loading')}</span>
        ) : user ? (
          <span>{t('common.hello')}, {user.username}</span>
        ) : (
          <span>{t('common.not_logged_in')}</span>
        )}
      </div>
      */}
      <div className="user-info">
        {loadingUser ? (
          <span>{t('common.loading')}</span>
        ) : user ? (
          <span>{t('common.hello')}, {user.username}</span>
        ) : (
          <span>{t('common.not_logged_in')}</span>
        )}
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