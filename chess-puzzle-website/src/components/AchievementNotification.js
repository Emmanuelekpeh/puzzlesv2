import React, { useEffect, useState } from 'react';
import './AchievementNotification.css';

const AchievementNotification = ({ achievement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 100);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`achievement-notification ${visible ? 'visible' : ''}`}
      onClick={handleClick}
    >
      <div className="achievement-content">
        <div className="achievement-badge">✓</div>
        <div className="achievement-details">
          <div className="achievement-title">Achievement Unlocked</div>
          <div className="achievement-name">{achievement.name}</div>
          <div className="achievement-description">{achievement.description}</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
