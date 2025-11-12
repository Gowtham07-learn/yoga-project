import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LEVELS } from './data/levels';
import { poseAngles, computeSimilarityMap, classifyScore } from './utils/poseUtils';
import { getPoseCorrectionMessage } from './utils/poseFeedback';
import Landing from './components/Landing';
import LevelScreen from './components/LevelScreen';
import ScoreScreen from './components/ScoreScreen';
import FinalScreen from './components/FinalScreen';
import './App.css';

function App() {
  const [screen, setScreen] = useState('landing'); // landing, level, score, final
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [pose, setPose] = useState(null);
  const [camera, setCamera] = useState(null);
  const [activeRun, setActiveRun] = useState(false);
  const [results, setResults] = useState([]);
  const [currentPoseData, setCurrentPoseData] = useState(null);
  const [liveSim, setLiveSim] = useState('—');
  const [holdPct, setHoldPct] = useState('0');
  const [countdownLabel, setCountdownLabel] = useState('Ready');
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [liveTips, setLiveTips] = useState('');
  
  // State for tracking pose data
  const [framesSimilarity, setFramesSimilarity] = useState([]);
  const [simRolling, setSimRolling] = useState([]);
  const [inPoseFrames, setInPoseFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [jointDiffAcc, setJointDiffAcc] = useState({});
  const [jointCountAcc, setJointCountAcc] = useState({});
  const [jointAngleAcc, setJointAngleAcc] = useState({});
  const [livePerJoint, setLivePerJoint] = useState([]);
  const liveWindowRef = useRef({ startMs: 0, sums: {} });

  const frameSmoothing = 6;
  const holdRequirementPct = 0.70;

  // timers to avoid overlapping intervals
  const readyTimerRef = useRef(null);
  const runTimerRef = useRef(null);
  const poseRef = useRef(null);

  const onResults = useCallback((results) => {
    if (!results.poseLandmarks) {
      setLiveSim('—');
      setCurrentPoseData(null);
      return;
    }

    const angles = poseAngles(results.poseLandmarks);
    const levelRef = LEVELS[currentLevelIndex];
    const simData = computeSimilarityMap(angles, levelRef);
    
    // Update current pose data for feedback
    setCurrentPoseData({
      landmarks: results.poseLandmarks,
      angles: angles,
      similarity: simData
    });

    // Live corrective tips (updates continuously)
    const correction = getPoseCorrectionMessage(angles, levelRef);
    setLiveTips(correction ? correction.message : '');

    // Update joint differences
    setJointDiffAcc(prev => {
      const newAcc = { ...prev };
      for (const j in simData.map) {
        newAcc[j] = (newAcc[j] || 0) + simData.map[j].diff;
      }
      return newAcc;
    });

    // Track joint angle sums for averaging at end
    setJointAngleAcc(prev => {
      const next = { ...prev };
      for (const j in simData.map) {
        const val = angles[j];
        if (typeof val === 'number') next[j] = (next[j] || 0) + val;
      }
      return next;
    });

    setJointCountAcc(prev => {
      const newAcc = { ...prev };
      for (const j in simData.map) {
        newAcc[j] = (newAcc[j] || 0) + 1;
      }
      return newAcc;
    });

    // Accumulate 3s live window for averaged UI
    const now = Date.now();
    if (!liveWindowRef.current.startMs) {
      liveWindowRef.current.startMs = now;
      liveWindowRef.current.sums = {};
    }
    const sums = liveWindowRef.current.sums;
    for (const key in levelRef.angles) {
      const a = angles[key];
      const d = simData.map[key]?.diff;
      if (!sums[key]) sums[key] = { angleSum: 0, diffSum: 0, count: 0, target: levelRef.angles[key] };
      if (typeof a === 'number') {
        sums[key].angleSum += a;
        sums[key].count += 1;
      }
      if (typeof d === 'number') {
        sums[key].diffSum += d;
      }
    }
    // If 1s elapsed, publish averages and reset window
    if (now - liveWindowRef.current.startMs >= 1000) {
      const avgRows = Object.keys(sums).map(key => {
        const rec = sums[key];
        const avgAngle = rec.count ? Math.round(rec.angleSum / rec.count) : 0;
        const avgDiff = rec.count ? Math.round(rec.diffSum / rec.count) : 0;
        return {
          key,
          name: key.replace(/([A-Z])/g,' $1').trim(),
          angle: avgAngle,
          target: rec.target,
          diff: avgDiff
        };
      });
      setLivePerJoint(avgRows);
      liveWindowRef.current.startMs = now;
      liveWindowRef.current.sums = {};
    }
    if (activeRun) {
      let smooth = simData.overall;
      setSimRolling(prev => {
        const newRolling = [...prev, simData.overall].slice(-frameSmoothing);
        if (newRolling.length > 0) {
          smooth = newRolling.reduce((a,b) => a+b, 0) / newRolling.length;
        }
        return newRolling;
      });

      setFramesSimilarity(prev => [...prev, smooth]);
      setTotalFrames(prev => prev + 1);
      if (smooth >= 0.70) setInPoseFrames(prev => prev + 1);
      setLiveSim(Math.round(smooth * 100).toString());
      setHoldPct(Math.round((inPoseFrames / Math.max(1, totalFrames)) * 100).toString());
    } else {
      setLiveSim(Math.round(simData.overall * 100).toString());
    }
  }, [activeRun, currentLevelIndex, frameSmoothing, inPoseFrames, simRolling, totalFrames, setCurrentPoseData]);

  // MediaPipe setup (after onResults is defined so it's available for dependency and binding)
  const setupPose = useCallback(async () => {
    if (poseRef.current) return poseRef.current;
    const newPose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    newPose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    newPose.onResults(onResults);
    poseRef.current = newPose;
    setPose(newPose);
    return newPose;
  }, [onResults]);

  const startCamera = useCallback(async (videoRef) => {
    if (camera || !videoRef) return;
    const poseInstance = await setupPose();
    const newCamera = new window.Camera(videoRef, {
      onFrame: async () => {
        if (poseRef.current) {
          await poseRef.current.send({image: videoRef});
        } else if (poseInstance) {
          await poseInstance.send({image: videoRef});
        }
      },
      width: 360,
      height: 640
    });
    try {
      await newCamera.start();
      setCamera(newCamera);
    } catch (err) {
      console.error("Camera start fail:", err);
      alert("Unable to start camera: " + err.message);
    }
  }, [camera, setupPose]);

  const stopCamera = useCallback(() => {
    if (camera) {
      camera.stop();
      setCamera(null);
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
      setPose(null);
    }
  }, [camera]);

  const resetLevelState = useCallback(() => {
    setFramesSimilarity([]);
    setSimRolling([]);
    setInPoseFrames(0);
    setTotalFrames(0);
    setJointDiffAcc({});
    setJointCountAcc({});
    setActiveRun(false);
    setCountdownLabel('Ready');
    setLiveSim('—');
    setHoldPct('0');
  }, []);

  const finishLevelRun = useCallback(() => {
    const avgSim = framesSimilarity.length ? 
      (framesSimilarity.reduce((a,b) => a+b, 0) / framesSimilarity.length) : 0;
    const percent = Math.round(avgSim * 100);
    const holdPctActual = inPoseFrames / Math.max(1, totalFrames);
    const holdPassed = holdPctActual >= holdRequirementPct;

    let finalScore = percent;
    if (!holdPassed) finalScore = Math.round(finalScore * 0.8);

    // Compute joint diffs for feedback
    const avgDiffs = {};
    for (const j in jointDiffAcc) {
      avgDiffs[j] = jointDiffAcc[j] / Math.max(1, jointCountAcc[j]);
    }
    const sorted = Object.keys(avgDiffs).sort((a,b) => avgDiffs[b]-avgDiffs[a]);
    const top3 = sorted.slice(0,3).map(k => `${k.replace(/([A-Z])/g,' $1')}: ${Math.round(avgDiffs[k])}°`);
    const feedback = top3.length ? top3.join(' • ') : "Nice hold!";

    // Generate corrective tips from last detected angles if available
    let tips = null;
    if (currentPoseData?.angles) {
      const correction = getPoseCorrectionMessage(currentPoseData.angles, LEVELS[currentLevelIndex]);
      tips = correction ? correction.message : null;
    }

    // Per-joint averaged stats for end-of-level display
    const perJoint = Object.keys(jointCountAcc).map(key => {
      const avgAngle = (jointAngleAcc[key] || 0) / Math.max(1, jointCountAcc[key]);
      const avgDiff = (jointDiffAcc[key] || 0) / Math.max(1, jointCountAcc[key]);
      return {
        key,
        name: key.replace(/([A-Z])/g,' $1').trim(),
        target: LEVELS[currentLevelIndex].angles[key],
        avgAngle: Math.round(avgAngle),
        avgDiff: Math.round(avgDiff)
      };
    }).sort((a,b) => b.avgDiff - a.avgDiff);

    // Store result and show score screen
    setResults(prev => {
      const newResults = [...prev];
      newResults[currentLevelIndex] = {
        level: LEVELS[currentLevelIndex].name,
        score: finalScore,
        holdPassed,
        feedback,
        tips,
        perJoint
      };
      return newResults;
    });
    setScreen('score');
  }, [currentLevelIndex, framesSimilarity, inPoseFrames, jointDiffAcc, jointCountAcc, totalFrames, currentPoseData, jointAngleAcc]);

  const startPoseRun = useCallback(() => {
    if (!camera) {
      alert("Start the camera first.");
      return;
    }
    if (activeRun || isCountingDown) return; // prevent multiple presses

    resetLevelState();
    let t = 3;
    setIsCountingDown(true);
    setCountdownLabel(`Get ready: ${t}`);

    if (readyTimerRef.current) clearInterval(readyTimerRef.current);
    readyTimerRef.current = setInterval(() => {
      t--;
      if (t > 0) {
        setCountdownLabel(`Get ready: ${t}`);
      } else {
        clearInterval(readyTimerRef.current);
        readyTimerRef.current = null;
        const RUN_MS = 30000;
        const start = Date.now();
        setActiveRun(true);

        if (runTimerRef.current) clearInterval(runTimerRef.current);
        runTimerRef.current = setInterval(() => {
          const remaining = Math.max(0, RUN_MS - (Date.now() - start));
          setCountdownLabel(`Hold: ${Math.ceil(remaining/1000)}s`);
          if (remaining <= 0) {
            clearInterval(runTimerRef.current);
            runTimerRef.current = null;
            setActiveRun(false);
            setIsCountingDown(false);
            setCountdownLabel('Done');
            setTimeout(() => finishLevelRun(), 300);
          }
        }, 300);
      }
    }, 900);
  }, [camera, resetLevelState, finishLevelRun, activeRun, isCountingDown]);

  const downloadResults = useCallback(() => {
    const payload = {
      timestamp: new Date().toISOString(),
      results
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poseyoga-results.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [results]);

  // Navigation handlers
  const handleStart = () => {
    setCurrentLevelIndex(0);
    setResults([]);
    setScreen('level');
  };

  const handleNextLevel = () => {
    if (currentLevelIndex >= LEVELS.length - 1) {
      setScreen('final');
    } else {
      setCurrentLevelIndex(prev => prev + 1);
      setScreen('level');
    }
  };

  const handleSkipLevel = () => {
    // block skipping while countdown or run is active
    if (activeRun || isCountingDown) return;
    // immediately move to next level without recording a score
    if (currentLevelIndex >= LEVELS.length - 1) {
      setScreen('final');
    } else {
      setCurrentLevelIndex(prev => prev + 1);
      setScreen('level');
    }
  };

  const handleRetry = () => {
    setScreen('level');
  };

  const handleExit = () => {
    stopCamera();
    setScreen('landing');
  };

  const handleRestart = () => {
    setResults([]);
    setCurrentLevelIndex(0);
    stopCamera();
    setScreen('landing');
  };

  // Render the appropriate screen
  return (
    <div className="container">
      <header>
        <div>
          <h1>PoseYoga</h1>
          <div className="subtitle">Levels • Hold 30s • Light-green, friendly UI</div>
        </div>
        <div className="subtitle">Relaxed practice • AI-assisted</div>
      </header>

      <main id="app">
        {screen === 'landing' && (
          <Landing onStart={handleStart} />
        )}

        {screen === 'level' && (
          <LevelScreen
            level={LEVELS[currentLevelIndex].id}
            levelData={LEVELS[currentLevelIndex]}
            liveSim={liveSim}
            holdPct={holdPct}
            countdownLabel={countdownLabel}
            isRunning={activeRun}
            poseFeedback={liveTips}
            livePerJoint={livePerJoint}
            onStartCamera={() => startCamera(document.getElementById('videoElement'))}
            onBeginPose={startPoseRun}
            onRetryLevel={resetLevelState}
            onSkipLevel={handleSkipLevel}
            disableBegin={isCountingDown || activeRun}
            showStartCamera={!camera}
            poseData={currentPoseData}
            onVideoLoad={(video) => {
              if (video) {
                const overlay = document.getElementById('overlay');
                if (overlay) {
                  overlay.width = video.videoWidth;
                  overlay.height = video.videoHeight;
                }
              }
            }}
          />
        )}

        {screen === 'score' && results[currentLevelIndex] && (
          <ScoreScreen
            score={results[currentLevelIndex].score}
            level={LEVELS[currentLevelIndex].id}
            classification={classifyScore(results[currentLevelIndex].score)}
            feedback={results[currentLevelIndex].feedback}
            tips={results[currentLevelIndex].tips}
            poseName={LEVELS[currentLevelIndex].name}
            perJoint={results[currentLevelIndex].perJoint}
            onNext={handleNextLevel}
            onRetry={handleRetry}
            onExit={handleExit}
          />
        )}

        {screen === 'final' && (
          <FinalScreen
            score={(function(){
              const completed = results.filter(r => r && typeof r.score === 'number');
              const avg = completed.length ? Math.round(completed.reduce((a, r) => a + r.score, 0) / completed.length) : 0;
              return avg;
            })()}
            classification={(function(){
              const completed = results.filter(r => r && typeof r.score === 'number');
              const avg = completed.length ? Math.round(completed.reduce((a, r) => a + r.score, 0) / completed.length) : 0;
              return classifyScore(avg);
            })()}
            results={results}
            levels={LEVELS}
            onRestart={handleRestart}
            onDownload={downloadResults}
          />
        )}
      </main>

      <footer className="muted">
        Runs in browser. No camera data leaves your device.
      </footer>
    </div>
  );
}

export default App;
