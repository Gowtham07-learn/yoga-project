import React from 'react';

const ExploreScreen = ({ levels = [], onSelectPose, onBack }) => {
  return (
    <section className="explore">
      <div className="explore-header">
        <div>
          <h2>Explore Poses</h2>
          <p>Discover each āsana, review alignment cues, and start a focused practice instantly.</p>
        </div>
        <button className="btn" onClick={onBack}>Back to Home</button>
      </div>

      <div className="explore-grid">
        {levels.map((level, idx) => (
          <button
            key={level.id}
            className="pose-card"
            onClick={() => onSelectPose(idx)}
          >
            <div className="pose-card-image">
              <img src={level.image} alt={level.name} />
            </div>
            <div className="pose-card-body">
              <div className="pose-card-pill">Level {level.id}</div>
              <h3>{level.name}</h3>
              <p>{level.desc}</p>
              <div className="pose-card-meta">
                <span>{Object.keys(level.angles).length} key angles</span>
                <span>Hold for 30s</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ExploreScreen;

