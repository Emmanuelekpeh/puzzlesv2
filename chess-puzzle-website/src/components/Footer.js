import React, { useEffect } from 'react';
import './Footer.css';

const Footer = () => {
  useEffect(() => {
    try {
      if (window.adsbygoogle && process.env.NODE_ENV !== 'development') {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // Fail silently
    }
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact</a>
        </div>
        <div className="social-icons">
          <a href="mailto:contact@example.com" aria-label="Email">📧</a>
          <a href="https://github.com" aria-label="GitHub" target="_blank" rel="noopener noreferrer">💻</a>
          <a href="https://discord.gg" aria-label="Discord" target="_blank" rel="noopener noreferrer">💬</a>
        </div>
      </div>
      <div className="footer-ads">
        {/* AdSense Responsive Display Ad */}
        <ins className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-1667500375389649"
          data-ad-slot="1025876245"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </div>
    </footer>
  );
};

export default Footer;
