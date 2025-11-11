import React from 'react';

const FinalScreen = ({ score, classification, results = [], levels = [], onRestart, onDownload }) => {
  return (
    <section id="finalScreen">
      <div className="card final">
        <div className="final-title">All Levels Complete</div>
        <div className="final-score">{score}</div>
        <div className="final-badge" style={{ color: classification.color }}>
          {`${classification.label} — ${score}`}
        </div>

        <div style={{ marginTop: '12px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>Your results by Aāsanam:</div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {levels.map((lv, idx) => {
              const r = results[idx];
              const s = r?.score ?? '—';
              return (
                <div key={lv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{lv.name}</div>
                  <div style={{ opacity: 0.8 }}>{s}</div>
                </div>
              );
            })}
          </div>
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