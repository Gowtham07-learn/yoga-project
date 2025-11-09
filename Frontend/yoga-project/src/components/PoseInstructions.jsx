import React from 'react';
import './PoseInstructions.css';

const PoseInstructions = ({ isVisible, message, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="pose-instruction-overlay">
      <div className="pose-instruction-card">
        <div className="instruction-header">
          <h3>Pose Adjustment Needed</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="instruction-content">
          <p>{message}</p>
        </div>
        <button className="acknowledge-btn" onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
};

export default PoseInstructions;