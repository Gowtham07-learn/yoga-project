import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LEVELS } from './data/levels';
import { poseAngles, computeSimilarityMap, classifyScore } from './utils/poseUtils';
import { getPoseCorrectionMessage } from './utils/poseFeedback';
import Landing from './components/Landing';
import LevelScreen from './components/LevelScreen';
import ScoreScreen from './components/ScoreScreen';
import FinalScreen from './components/FinalScreen';
import ExploreScreen from './components/ExploreScreen';
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
  const [playMode, setPlayMode] = useState('sequence'); // sequence, explore, single
  const [runProgress, setRunProgress] = useState(0);

  // Refs to avoid stale closures inside onResults
  const activeRunRef = useRef(false);
  const levelIndexRef = useRef(0);
  const simSumRef = useRef(0);
  const frameCountRef = useRef(0);
  const inPoseCountRef = useRef(0);
  
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
  const liveTipsWindowRef = useRef({ startMs: 0, counts: {} });

  const frameSmoothing = 6;
  const holdRequirementPct = 0.70;

  // timers to avoid overlapping intervals
  const readyTimerRef = useRef(null);
  const runTimerRef = useRef(null);
  const poseRef = useRef(null);

  // keep refs in sync
  useEffect(() => { activeRunRef.current = activeRun; }, [activeRun]);
  useEffect(() => { levelIndexRef.current = currentLevelIndex; }, [currentLevelIndex]);

  const onResults = useCallback((results) => {
    if (!results.poseLandmarks) {
      setLiveSim('—');
      setCurrentPoseData(null);
      // clear overlay when no landmarks
      const canvas = document.getElementById('overlay');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const angles = poseAngles(results.poseLandmarks);
    const levelRef = LEVELS[levelIndexRef.current];
    const simData = computeSimilarityMap(angles, levelRef);

    // draw skeleton overlay (no external utils)
    const canvas = document.getElementById('overlay');
    if (canvas && results.poseLandmarks) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // minimal set of connections for upper/lower body
      const C = [
        [11,12], // shoulders
        [23,24], // hips
        [11,23], // left side
        [12,24], // right side
        [11,13],[13,15], // left arm
        [12,14],[14,16], // right arm
        [23,25],[25,27], // left leg
        [24,26],[26,28]  // right leg
      ];

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineCap = 'round';
      for (const [a,b] of C) {
        const p = results.poseLandmarks[a];
        const q = results.poseLandmarks[b];
        if (!p || !q) continue;
        ctx.beginPath();
        ctx.moveTo(p.x * W, p.y * H);
        ctx.lineTo(q.x * W, q.y * H);
        ctx.stroke();
      }

      ctx.fillStyle = '#60a5fa';
      const points = [11,12,13,14,15,16,23,24,25,26,27,28];
      for (const i of points) {
        const p = results.poseLandmarks[i];
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Update current pose data for feedback
    setCurrentPoseData({
      landmarks: results.poseLandmarks,
      angles: angles,
      similarity: simData
    });

    // Live corrective tips (throttled to ~1s, pick most frequent message in window)
    const correction = getPoseCorrectionMessage(angles, levelRef);
    const nowTs = Date.now();
    if (!liveTipsWindowRef.current.startMs) {
      liveTipsWindowRef.current.startMs = nowTs;
      liveTipsWindowRef.current.counts = {};
    }
    if (correction?.message) {
      const key = correction.message;
      const counts = liveTipsWindowRef.current.counts;
      counts[key] = (counts[key] || 0) + 1;
    }
    if (nowTs - liveTipsWindowRef.current.startMs >= 1000) {
      const counts = liveTipsWindowRef.current.counts;
      let best = '';
      let bestC = 0;
      for (const k in counts) {
        if (counts[k] > bestC) {
          best = k;
          bestC = counts[k];
        }
      }
      setLiveTips(best);
      liveTipsWindowRef.current.startMs = nowTs;
      liveTipsWindowRef.current.counts = {};
    }

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
    if (activeRunRef.current) {
      // Use raw similarity for scoring (stable, avoids state timing issues)
      const smooth = simData.overall;
      // still keep a short rolling window for potential UI smoothing
      setSimRolling(prev => [...prev, simData.overall].slice(-frameSmoothing));

      setFramesSimilarity(prev => [...prev, smooth]);
      // update robust refs
      frameCountRef.current += 1;
      if (smooth >= 0.70) inPoseCountRef.current += 1;
      simSumRef.current += smooth;
      // reflect in UI
      setTotalFrames(frameCountRef.current);
      setInPoseFrames(inPoseCountRef.current);
      setLiveSim(Math.round(smooth * 100).toString());
      setHoldPct(Math.round((inPoseCountRef.current / Math.max(1, frameCountRef.current)) * 100).toString());
    } else {
      setLiveSim(Math.round(simData.overall * 100).toString());
    }
  }, [frameSmoothing, setCurrentPoseData]);

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
    if (!videoRef) return;
    const poseInstance = await setupPose();

    // If a previous camera exists, stop it before rebinding to the new video element
    if (camera) {
      try { camera.stop(); } catch {}
      setCamera(null);
    }

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
    setJointAngleAcc({});
    setActiveRun(false);
    setCountdownLabel('Ready');
    setLiveSim('—');
    setHoldPct('0');
    setRunProgress(0);
    // reset live averaging windows
    liveWindowRef.current = { startMs: 0, sums: {} };
    liveTipsWindowRef.current = { startMs: 0, counts: {} };
    // reset scoring refs
    simSumRef.current = 0;
    frameCountRef.current = 0;
    inPoseCountRef.current = 0;
  }, []);

  const finishLevelRun = useCallback(() => {
    const avgSim = frameCountRef.current > 0 ? (simSumRef.current / frameCountRef.current) : 0;
    const percent = Math.round(avgSim * 100);
    const holdPctActual = inPoseCountRef.current / Math.max(1, frameCountRef.current);
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
    
    // Generate summary based on score classification
    const classification = classifyScore(finalScore);
    let feedback = "";
    if (finalScore >= 85) {
      feedback = holdPassed 
        ? "Excellent pose execution! Your alignment was nearly perfect and you maintained the pose well." 
        : "Excellent alignment! Focus on holding the pose for the full duration to maximize your score.";
    } else if (finalScore >= 70) {
      feedback = holdPassed
        ? "Good pose execution! Minor adjustments in alignment could improve your form further."
        : "Good alignment! Work on maintaining the pose for the full duration to improve your score.";
    } else if (finalScore >= 55) {
      feedback = holdPassed
        ? "Fair pose execution. Focus on improving alignment in the key areas mentioned below."
        : "Fair alignment. Focus on both improving your form and holding the pose longer.";
    } else {
      feedback = holdPassed
        ? "Need improvement. Review the corrections below and focus on alignment."
        : "Need improvement. Work on both alignment and holding the pose for the full duration.";
    }
    
    // Add top deviations if available and score is not excellent
    if (finalScore < 85 && top3.length > 0) {
      feedback += ` Top deviations: ${top3.join(', ')}.`;
    }

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
  }, [currentLevelIndex, jointDiffAcc, jointCountAcc, currentPoseData, jointAngleAcc]);

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
        setRunProgress(0);

        if (runTimerRef.current) clearInterval(runTimerRef.current);
        runTimerRef.current = setInterval(() => {
          const remaining = Math.max(0, RUN_MS - (Date.now() - start));
          setCountdownLabel(`Hold: ${Math.ceil(remaining/1000)}s`);
          const elapsed = RUN_MS - remaining;
          setRunProgress(Math.min(1, elapsed / RUN_MS));
          if (remaining <= 0) {
            clearInterval(runTimerRef.current);
            runTimerRef.current = null;
            setActiveRun(false);
            setIsCountingDown(false);
            setCountdownLabel('Done');
            setRunProgress(1);
            setTimeout(() => finishLevelRun(), 300);
          }
        }, 300);
      }
    }, 900);
  }, [camera, resetLevelState, finishLevelRun, activeRun, isCountingDown]);

  const downloadResults = useCallback(() => {
    // Render a simple JPG summary using a canvas so no external libs are needed
    const W = 1080;
    const H = 1400;
    const pad = 40;
    const lineH = 44;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = '#f2fff7';
    ctx.fillRect(0, 0, W, H);

    // header
    ctx.fillStyle = '#1f7a55';
    ctx.font = 'bold 48px Segoe UI, Arial';
    ctx.fillText('POSEPERFECT — Results', pad, pad + 48);

    // date
    ctx.fillStyle = '#4a6b5a';
    ctx.font = 'normal 20px Segoe UI, Arial';
    ctx.fillText(new Date().toLocaleString(), pad, pad + 80);

    // overall score
    const completed = results.filter(r => r && typeof r.score === 'number');
    const avg = completed.length ? Math.round(completed.reduce((a, r) => a + r.score, 0) / completed.length) : 0;
    ctx.fillStyle = '#184b34';
    ctx.font = 'bold 34px Segoe UI, Arial';
    ctx.fillText(`Overall score: ${avg}`, pad, pad + 130);

    // table header
    let y = pad + 190;
    ctx.font = 'bold 22px Segoe UI, Arial';
    ctx.fillStyle = '#245d43';
    ctx.fillText('Level', pad, y);
    ctx.fillText('Aāsanam', pad + 140, y);
    ctx.fillText('Score', W - pad - 160, y);
    y += 10;
    ctx.fillStyle = '#a7f3cc';
    ctx.fillRect(pad, y, W - pad * 2, 2);
    y += 30;

    // rows
    ctx.font = 'normal 22px Segoe UI, Arial';
    for (let i = 0; i < LEVELS.length; i++) {
      const r = results[i];
      const levelId = LEVELS[i].id;
      const name = LEVELS[i].name;
      const score = r && typeof r.score === 'number' ? r.score.toString() : '—';

      // row bg
      ctx.fillStyle = i % 2 === 0 ? '#e9fff2' : '#ffffff';
      ctx.fillRect(pad, y - 24, W - pad * 2, 36);

      ctx.fillStyle = '#234';
      ctx.fillText(String(levelId), pad, y);

      ctx.fillStyle = '#2a6a4a';
      ctx.fillText(name, pad + 140, y);

      ctx.fillStyle = '#093';
      ctx.fillText(score, W - pad - 160, y);

      y += lineH;
    }

    // footer
    ctx.fillStyle = '#6c757d';
    ctx.font = 'normal 18px Segoe UI, Arial';
    ctx.fillText('Generated by POSEPERFECT — runs in browser', pad, H - pad);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'poseyoga-results.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [results]);

  // Navigation handlers
  const handleStart = () => {
    resetLevelState();
    setCurrentLevelIndex(0);
    setResults([]);
    setPlayMode('sequence');
    setScreen('level');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExplore = useCallback(() => {
    stopCamera();
    resetLevelState();
    setResults([]);
    setPlayMode('explore');
    setScreen('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetLevelState, stopCamera]);

  const handleExploreSelect = useCallback((index) => {
    resetLevelState();
    setResults([]);
    setCurrentLevelIndex(index);
    setPlayMode('single');
    setScreen('level');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetLevelState]);

  const handleBackToExplore = useCallback(() => {
    stopCamera();
    resetLevelState();
    setPlayMode('explore');
    setScreen('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetLevelState, stopCamera]);

  const handleNextLevel = () => {
    if (playMode === 'single') {
      handleBackToExplore();
      return;
    }
    if (currentLevelIndex >= LEVELS.length - 1) {
      setScreen('final');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentLevelIndex(prev => prev + 1);
      setScreen('level');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipLevel = () => {
    // block skipping while countdown or run is active
    if (activeRun || isCountingDown) return;
    if (playMode === 'single') {
      handleBackToExplore();
      return;
    }
    // immediately move to next level without recording a score
    if (currentLevelIndex >= LEVELS.length - 1) {
      setScreen('final');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentLevelIndex(prev => prev + 1);
      setScreen('level');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRetry = () => {
    resetLevelState();
    setScreen('level');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = useCallback(() => {
    stopCamera();
    resetLevelState();
    setPlayMode('sequence');
    setScreen('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetLevelState, stopCamera]);

  const handleExit = () => {
    handleGoHome();
  };

  const handleRestart = () => {
    setResults([]);
    setCurrentLevelIndex(0);
    stopCamera();
    setPlayMode('sequence');
    setScreen('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render the appropriate screen
  return (
    <div className="container">
      <header>
        <div>
          <h1>POSEPERFECT</h1>
          <div className="subtitle">Improve your posture</div>
        </div>
        <div className="subtitle">
          {screen !== 'landing' && (
            <button className="header-home-btn" onClick={handleGoHome}>Home</button>
          )}
        </div>
      </header>

      <main id="app">
        {screen === 'landing' && (
          <Landing onStart={handleStart} onExplore={handleExplore} />
        )}

        {screen === 'explore' && (
          <ExploreScreen
            levels={LEVELS}
            onSelectPose={handleExploreSelect}
            onBack={handleExit}
          />
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
            runProgress={runProgress}
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
            onNext={playMode === 'single' ? handleBackToExplore : handleNextLevel}
            nextLabel={playMode === 'single' ? 'Back to Explore' : 'Next Level'}
            showNext={true}
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
