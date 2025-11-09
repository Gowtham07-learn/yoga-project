import React, { useState, useCallback } from 'react';
import { LEVELS } from './data/levels';
import { poseAngles, computeSimilarityMap, classifyScore } from './utils/poseUtils';
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
  
  // State for tracking pose data
  const [framesSimilarity, setFramesSimilarity] = useState([]);
  const [simRolling, setSimRolling] = useState([]);
  const [inPoseFrames, setInPoseFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [jointDiffAcc, setJointDiffAcc] = useState({});
  const [jointCountAcc, setJointCountAcc] = useState({});

  const frameSmoothing = 6;
  const holdRequirementPct = 0.70;

  // MediaPipe setup
  const setupPose = useCallback(async () => {
    if (pose) return;
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
    setPose(newPose);
  }, [pose, onResults]);

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

    // Update joint differences
    setJointDiffAcc(prev => {
      const newAcc = { ...prev };
      for (const j in simData.map) {
        newAcc[j] = (newAcc[j] || 0) + simData.map[j].diff;
      }
      return newAcc;
    });

    setJointCountAcc(prev => {
      const newAcc = { ...prev };
      for (const j in simData.map) {
        newAcc[j] = (newAcc[j] || 0) + 1;
      }
      return newAcc;
    });

    if (activeRun) {
      setSimRolling(prev => {
        const newRolling = [...prev, simData.overall];
        return newRolling.slice(-frameSmoothing);
      });
      
      const smooth = simRolling.reduce((a,b) => a+b, 0) / simRolling.length;
      setFramesSimilarity(prev => [...prev, smooth]);
      setTotalFrames(prev => prev + 1);
      if (smooth >= 0.70) setInPoseFrames(prev => prev + 1);
      setLiveSim(Math.round(smooth * 100).toString());
      setHoldPct(Math.round((inPoseFrames / Math.max(1, totalFrames)) * 100).toString());
    } else {
      setLiveSim(Math.round(simData.overall * 100).toString());
    }
  }, [activeRun, currentLevelIndex, frameSmoothing, inPoseFrames, simRolling, totalFrames, setCurrentPoseData]);

  const startCamera = useCallback(async (videoRef) => {
    if (camera || !videoRef) return;
    await setupPose();
    const newCamera = new window.Camera(videoRef, {
      onFrame: async () => {
        await pose.send({image: videoRef});
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
  }, [camera, pose, setupPose]);

  const stopCamera = useCallback(() => {
    if (camera) {
      camera.stop();
      setCamera(null);
    }
    if (pose) {
      pose.close();
      setPose(null);
    }
  }, [camera, pose]);

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

  const startPoseRun = useCallback(() => {
    if (!camera) {
      alert("Start the camera first.");
      return;
    }
    resetLevelState();
    let t = 3;
    setCountdownLabel(`Get ready: ${t}`);
    
    const readyTimer = setInterval(() => {
      t--;
      if (t > 0) {
        setCountdownLabel(`Get ready: ${t}`);
      } else {
        clearInterval(readyTimer);
        const RUN_MS = 30000;
        const start = Date.now();
        setActiveRun(true);
        
        const runTimer = setInterval(() => {
          const remaining = Math.max(0, RUN_MS - (Date.now() - start));
          setCountdownLabel(`Hold: ${Math.ceil(remaining/1000)}s`);
          if (remaining <= 0) {
            clearInterval(runTimer);
            setActiveRun(false);
            setCountdownLabel('Done');
            setTimeout(() => finishLevelRun(), 300);
          }
        }, 300);
      }
    }, 900);
  }, [camera, resetLevelState, finishLevelRun]);

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

    // Store result and show score screen
    setResults(prev => {
      const newResults = [...prev];
      newResults[currentLevelIndex] = {
        level: LEVELS[currentLevelIndex].name,
        score: finalScore,
        holdPassed,
        feedback
      };
      return newResults;
    });
    setScreen('score');
  }, [currentLevelIndex, framesSimilarity, inPoseFrames, jointDiffAcc, jointCountAcc, totalFrames]);

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
            onStartCamera={() => startCamera(document.getElementById('videoElement'))}
            onBeginPose={startPoseRun}
            onRetryLevel={resetLevelState}
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
            onNext={handleNextLevel}
            onRetry={handleRetry}
            onExit={handleExit}
          />
        )}

        {screen === 'final' && (
          <FinalScreen
            score={Math.round(results.reduce((a, r) => a + (r ? r.score : 0), 0) / LEVELS.length)}
            classification={classifyScore(Math.round(results.reduce((a, r) => a + (r ? r.score : 0), 0) / LEVELS.length))}
            onRestart={handleRestart}
            onDownload={downloadResults}
          />
        )}
      </main>

      <footer className="muted">
        Prototype — runs in browser. No camera data leaves your device.
      </footer>
    </div>
  );
}

export default App;
