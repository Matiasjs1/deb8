import React from 'react';
import { useI18n } from '../i18n/LocaleProvider.jsx';

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="footer-left">
        <span>{t('footer.contact')}</span>
        <span>{t('footer.support')}</span>
      </div>
      <div className="footer-center">
        <span>{t('footer.copyright')}</span>
      </div>
      <div className="footer-right">
        <span>{t('footer.social')}</span>
        <div className="social-icons">
          {/* YouTube */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" d="M2 8s.5-2 2.5-2h15S22 6 22 8v8s-.5 2-2.5 2h-15S2 18 2 16V8z" />
            <path vectorEffect="non-scaling-stroke" d="M10 9l5 3-5 3V9z" />
          </svg>
          {/* Facebook */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
          {/* Twitter */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
          </svg>
        </div>
      </div>
    </footer>
  );
}

export default Footer;