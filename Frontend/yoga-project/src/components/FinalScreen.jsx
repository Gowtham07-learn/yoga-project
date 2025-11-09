import React from 'react';

const FinalScreen = ({ score, classification, onRestart, onDownload }) => {
  return (
    <section id="finalScreen">
      <div className="card final">
        <div className="final-title">All Levels Complete</div>
        <div className="final-score">{score}</div>
        <div className="final-badge" style={{ color: classification.color }}>
          {`${classification.label} — ${score}`}
        </div>

        <div style={{ marginTop: '12px' }}>
          <button className="next-btn" onClick={onRestart}>Restart</button>
          <button className="btn" onClick={onDownload}>Download Results</button>
        </div>
      </div>
    </section>
  );
};

export default FinalScreen;