import React, { useRef, useEffect } from 'react';
import PoseInstructions from './PoseInstructions';

const LevelScreen = ({
  level,
  levelData,
  liveSim,
  holdPct,
  countdownLabel,
  isRunning,
  onStartCamera,
  onBeginPose,
  onRetryLevel,
  onSkipLevel,
  disableBegin,
  showStartCamera,
  poseFeedback = '',
  onVideoLoad,
  livePerJoint = [],
  runProgress = 0
}) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  
  // notify parent about video element so camera can be started with the exact DOM node
  useEffect(() => {
    if (onVideoLoad && videoRef.current) onVideoLoad(videoRef.current);
  }, [onVideoLoad]);

  return (
    <section id="levelScreen">
      <div className="level-header">
        <div className="level-title">Level <span>{level}</span></div>
        <div className="level-hint">Hold the pose for 30s • Keep steady</div>
      </div>

      <div className="pose-banner">{levelData.name}</div>

      <div className="portrait-row">
        <div className="card portrait">
          <div className="card-head">
            <div className="card-title">Your Camera</div>
            <div className="status">
              <div>Similarity: <span>{liveSim}</span>%</div>
              <div>Hold: <span>{holdPct}</span>%</div>
            </div>
          </div>

          <div className="media-wrap">
            <video
              id="videoElement"
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
            <canvas id="overlay" ref={overlayRef} />
          </div>

          <div className="live-feedback" style={{ whiteSpace: 'pre-line' }}>
            {poseFeedback
              ? (<>
                  <div>Live feedback:</div>
                  <div>{poseFeedback}</div>
                </>)
              : (<div>Align with the reference to improve your similarity score.</div>)
            }
          </div>

          <div className="card-actions">
            {showStartCamera && (
              <button className="btn" onClick={onStartCamera}>Start Camera</button>
            )}
            <button className="btn" onClick={onBeginPose} disabled={disableBegin}>Begin (3s)</button>
            <button className="btn" onClick={onRetryLevel}>Reset</button>
            <button className="btn" onClick={onSkipLevel} disabled={disableBegin}>Skip Level</button>
            <div className="countdown">{countdownLabel}</div>
          </div>

          <div className="countdown-progress" aria-hidden="true">
            <div
              className="countdown-progress-bar"
              style={{ width: `${Math.min(100, Math.max(0, runProgress * 100))}%` }}
            />
          </div>

          <div className="tiny muted">
            <div><strong>Now practicing:</strong> {levelData.name}</div>
            <div>{levelData.desc}</div>
          </div>
        </div>

        <div className="card portrait">
          <div className="card-head">
            <div className="card-title">Reference Pose</div>
          </div>

          <div className="ref-wrap">
            <img className="ref-img" src={levelData.image} alt="Reference pose" />
          </div>

          <div className="card-body">
            <div className="pose-row">{levelData.name}</div>
            <div className="muted">{levelData.desc}</div>
            <div className="angles-grid">
              {Object.entries(levelData.angles).map(([k, v]) => {
                const name = k.replace(/([A-Z])/g,' $1').trim();
                return (
                  <div className="angle-item" key={k}>
                    <div className="angle-name">{name}</div>
                    <div className="angle-value">{v}°</div>
                  </div>
                );
              })}
            </div>

            <div className="live-panel">
              <div className="live-panel-title">Live angles & deviations</div>
              {(() => {
                const ORDER = ['LShoulder','RShoulder','LElbow','RElbow','LHip','RHip','LKnee','RKnee'];
                const byKey = Object.fromEntries(livePerJoint.map(j => [j.key, j]));
                return ORDER.map(k => {
                  const j = byKey[k];
                  const name = j?.name || k.replace(/([A-Z])/g,' $1').trim();
                  const angle = typeof j?.angle === 'number' ? j.angle : '—';
                  const target = typeof j?.target === 'number' ? j.target : (levelData.angles[k] ?? '—');
                  const diffVal = typeof j?.diff === 'number' ? j.diff : null;
                  const diff = diffVal != null ? diffVal : '—';
                  const tol = (levelData.tolerances && levelData.tolerances[k]) || 40;
                  const diffClass = diffVal != null ? (diffVal <= tol ? 'diff-ok' : 'diff-bad') : '';
                  const rowClass = diffVal != null ? (diffVal <= tol ? 'ok' : 'bad') : '';
                  return (
                    <div key={k} className={`live-row ${rowClass}`}>
                      <div className="live-name">{name}</div>
                      <div className="live-values">
                        <span>{angle}°</span>
                        <span>target {target}°</span>
                        <span className={diffClass}>Δ {diff}°</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(LevelScreen);