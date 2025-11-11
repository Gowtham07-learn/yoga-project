import React from 'react';

const ScoreScreen = ({ score, level, classification, feedback, tips, poseName, perJoint = [], onNext, onRetry, onExit }) => {
  return (
    <section id="scoreScreen">
      <div className="card score">
        <div className="score-title">Level {level} — {poseName}</div>
        <div className="score-number">{score}</div>
        <div className="classification" style={{ background: classification.color }}>
          {classification.label}
        </div>
        <div className="muted" style={{ marginTop: '8px' }}>
          <strong>Summary:</strong> {feedback}
        </div>
        {tips && (
          <div className="muted" style={{ marginTop: '6px', whiteSpace: 'pre-line' }}>
            <strong>What to improve:</strong>
            <div>{tips}</div>
          </div>
        )}

        {perJoint.length > 0 && (
          <div className="muted" style={{ marginTop: '10px' }}>
            <div style={{ fontWeight: 700, color: '#245d43' }}>Per-joint averages</div>
            <div style={{ display: 'grid', gap: '4px' }}>
              {perJoint.map(j => (
                <div key={j.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>{j.name}</div>
                  <div>avg {j.avgAngle}° (Δ {j.avgDiff}°, target {j.target}°)</div>
                </div>
              ))}
            </div>
          </div>
        )}

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