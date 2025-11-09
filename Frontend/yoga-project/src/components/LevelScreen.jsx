import React, { useRef, useEffect } from 'react';
import PoseInstructions from './PoseInstructions';

const LevelScreen = ({
  level,
  levelData,
  liveSim,
  holdPct,
  countdownLabel,
  onStartCamera,
  onBeginPose,
  onRetryLevel,
  showStartCamera,
  poseFeedback = [],
  onVideoLoad
}) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  
  // Show instructions when pose needs significant adjustment
  useEffect(() => {
    if (poseFeedback.length > 0 && liveSim < 60) {
      const feedbackMessage = poseFeedback.join('\n');
      console.log('Feedback:', feedbackMessage); // Log feedback instead of setting state
    }
  }, [poseFeedback, liveSim]);

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

          <div className="card-actions">
            {showStartCamera && (
              <button className="btn" onClick={onStartCamera}>Start Camera</button>
            )}
            <button className="btn" onClick={onBeginPose}>Begin (3s)</button>
            <button className="btn" onClick={onRetryLevel}>Reset</button>
            <div className="countdown">{countdownLabel}</div>
          </div>
        </div>

        <div className="card portrait">
          <div className="card-head">
            <div className="card-title">Reference Pose</div>
            <div className="tiny muted">{levelData.name}</div>
          </div>

          <div className="ref-wrap">
            <img className="ref-img" src={levelData.image} alt="Reference pose" />
          </div>

          <div className="card-body">
            <div className="muted">{levelData.desc}</div>
            <div className="angles-list">
              {Object.entries(levelData.angles).map(([k, v]) => (
                <div key={k}>{k}: {v}°</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(LevelScreen);