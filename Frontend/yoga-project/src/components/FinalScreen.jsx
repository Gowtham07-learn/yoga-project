import React, { useMemo } from 'react';

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(31, 122, 85, ${alpha})`;
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const labelOverrides = {
  Excellent: 'Outstanding',
  Good: 'Great Progress',
  Fair: 'Finding Balance',
  'Try Again': 'Just Beginning'
};

const messageMap = {
  Outstanding: 'Phenomenal consistency! You held your poses with strength and grace.',
  'Great Progress': 'Solid work! A few refinements will elevate your practice even further.',
  'Finding Balance': 'You are building momentum — keep refining your alignment each session.',
  'Just Beginning': 'Every expert starts here — your consistency will make magic!'
};

const iconMap = {
  Outstanding: '🌟',
  'Great Progress': '💪',
  'Finding Balance': '🧘',
  'Just Beginning': '🌱'
};

const FinalScreen = ({ score = 0, classification = {}, results = [], levels = [], onRestart, onDownload }) => {
  const displayLabel = labelOverrides[classification.label] || classification.label || 'Completed';
  const accentColor = classification.color || '#1f7a55';
  const accentSoft = hexToRgba(accentColor, 0.1);
  const accentTint = hexToRgba(accentColor, 0.18);
  const icon = iconMap[displayLabel] || '🧘';
  const message = messageMap[displayLabel] || 'Thank you for flowing with us today!';

  const { completedCount, bestScore } = useMemo(() => {
    const scored = results.filter((r) => r && typeof r.score === 'number');
    const best = scored.length ? Math.max(...scored.map((r) => r.score)) : null;
    return {
      completedCount: scored.length,
      bestScore: best
    };
  }, [results]);

  return (
    <section id="finalScreen">
      <div className="card final">
        <div className="final-heading">
          <div className="final-heading-icon">{icon}</div>
          <h2>Challenge Complete!</h2>
          <p>Here&apos;s how you performed across all levels</p>
        </div>

        <div
          className="final-summary-card"
          style={{ borderColor: accentTint, background: 'rgba(255, 255, 255, 0.95)' }}
        >
          <span className="final-summary-label">Total Score</span>
          <div className="final-summary-score">{score}</div>
          <div className="final-summary-classification" style={{ color: accentColor }}>
            {displayLabel}
          </div>
          <p className="final-summary-message">{message}</p>
          <div className="final-summary-metrics">
            <div className="final-summary-metric">
              <span className="metric-label">Levels Completed</span>
              <span className="metric-value">{completedCount}/{levels.length}</span>
            </div>
            <div className="final-summary-metric">
              <span className="metric-label">Best Score</span>
              <span className="metric-value">{bestScore != null ? bestScore : '—'}</span>
            </div>
          </div>
        </div>

        <div className="final-breakdown-card">
          <div className="final-breakdown-title">Level Breakdown</div>
          <div className="final-level-line">
            {levels.map((lv, idx) => {
              const result = results[idx];
              const hasScore = result && typeof result.score === 'number';
              const levelScore = hasScore ? result.score : '—';
              const status = hasScore ? lv.name : 'Skipped';
              return (
                <div
                  key={lv.id}
                  className={`final-level-pill ${hasScore ? 'completed' : 'skipped'}`}
                  style={hasScore ? { borderColor: accentTint, background: 'rgba(255, 255, 255, 0.92)', color: accentColor } : undefined}
                >
                  <span className="final-level-pill-label">Level {lv.id}</span>
                  <span className="final-level-pill-score">{levelScore}</span>
                  <span className="final-level-pill-status">{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="final-actions">
          <button className="final-primary-btn" onClick={onRestart}>Go to Home Page</button>
          <button className="final-secondary-btn" onClick={onDownload}>Download Results</button>
        </div>
      </div>
    </section>
  );
};

export default FinalScreen;