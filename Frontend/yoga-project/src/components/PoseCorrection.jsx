import React from 'react';
import './PoseCorrection.css';

const PoseCorrection = ({ isVisible, message, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="pose-correction-overlay">
      <div className="pose-correction-card">
        <div className="correction-header">
          <h3>Pose Adjustment Needed</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="correction-content">
          <p>{message}</p>
        </div>
        <div className="correction-actions">
          <button className="btn acknowledge-btn" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoseCorrection;