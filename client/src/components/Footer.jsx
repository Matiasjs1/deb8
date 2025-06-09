import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span>Contacto</span>
        <span>Soporte</span>
      </div>
      <div className="footer-center">
        <span>deb8 © 2023</span>
      </div>
      <div className="footer-right">
        <span>Redes</span>
        <div className="social-icons">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <circle cx="8" cy="10" r="3"/>
            <path d="M16 16l-4-4"/>
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
          </svg>
        </div>
      </div>
    </footer>
  );
}

export default Footer;