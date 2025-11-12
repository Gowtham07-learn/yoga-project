import React from 'react';

const ScoreScreen = ({
  score,
  level,
  classification,
  feedback,
  tips,
  poseName,
  perJoint = [],
  onNext,
  onRetry,
  onExit,
  nextLabel = 'Next Level',
  showNext = true
}) => {
  return (
    <section id="scoreScreen">
      <div className="card score">
        <div className="score-title">Level {level} — {poseName}</div>
        <div className="score-number">{score}</div>
        <div className="classification" style={{ background: classification.color }}>
          {classification.label}
        </div>
        <div className="score-summary" style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <strong style={{ color: 'var(--accent-text)', fontSize: '16px' }}>Summary:</strong>
          <div style={{ marginTop: '8px', color: 'var(--accent-text)', lineHeight: '1.6' }}>{feedback}</div>
        </div>
        {tips && (
          <div className="score-tips" style={{ marginTop: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', whiteSpace: 'pre-line' }}>
            <strong style={{ color: 'var(--accent-text)', fontSize: '16px' }}>What to improve:</strong>
            <div style={{ marginTop: '8px', color: 'var(--accent-text)', lineHeight: '1.6' }}>{tips}</div>
          </div>
        )}

        {perJoint.length > 0 && (
          <div className="score-per-joint" style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', width: '100%' }}>
            <div style={{ fontWeight: 800, color: 'var(--accent-text)', fontSize: '16px', marginBottom: '12px' }}>Per-joint averages</div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {perJoint.map((j, idx) => (
                <div key={j.key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '10px 12px',
                  background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(5px)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
                }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--accent-text)' }}>{j.name}</div>
                  <div style={{ color: 'var(--accent-text)', fontSize: '14px' }}>avg {j.avgAngle}° (Δ {j.avgDiff}°, target {j.target}°)</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="score-actions">
          {showNext && (
            <button className="next-btn" onClick={onNext}>{nextLabel}</button>
          )}
          <button className="btn" onClick={onRetry}>Try Again</button>
          <button className="btn" onClick={onExit}>Exit</button>
        </div>
      </div>
    </section>
  );
};

export default ScoreScreen;