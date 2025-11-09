import React from 'react';

const ScoreScreen = ({ score, level, classification, feedback, onNext, onRetry, onExit }) => {
  return (
    <section id="scoreScreen">
      <div className="card score">
        <div className="score-title">Level {level} — Score</div>
        <div className="score-number">{score}</div>
        <div className="classification" style={{ background: classification.color }}>
          {classification.label}
        </div>
        <div className="muted">{feedback}</div>

        <div className="score-actions">
          <button className="next-btn" onClick={onNext}>Next Level</button>
          <button className="btn" onClick={onRetry}>Retry Level</button>
          <button className="btn" onClick={onExit}>Exit</button>
        </div>
      </div>
    </section>
  );
};

export default ScoreScreen;