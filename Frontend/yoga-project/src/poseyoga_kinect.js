// poseyoga_kinect.js - Kinect v2 version using Electron IPC
export default function initPoseYogaKinect() {
  if (window.__poseyoga_inited_once) return;
  window.__poseyoga_inited_once = true;

  // Check if Kinect API is available
  if (!window.kinectAPI) {
    console.error('Kinect API not available. Make sure you are running in Electron.');
    return;
  }

  // ----- Levels -----
  const LEVELS = [
    { id:1, name:"Tree Pose (Vrksāsana)", image:"https://cdn.yogajournal.com/wp-content/uploads/2022/01/Tree-Pose_Alt-1_2400x1350_Andrew-Clark.jpeg", desc:"Stand on one leg; keep torso upright; hands overhead.", angles:{ LShoulder:50,RShoulder:50,LElbow:170,RElbow:170,LHip:180,RHip:170,LKnee:175,RKnee:15 }, tolerances:{ LShoulder:35,RShoulder:35,LElbow:30,RElbow:30,LHip:30,RHip:35,LKnee:25,RKnee:40 }, weights:{ LShoulder:1,RShoulder:1,LElbow:1,RElbow:1,LHip:1,RHip:1,LKnee:1,RKnee:1 } },
    { id:2, name:"Warrior II (Virabhadrāsana II)", image:"https://cdn.yogajournal.com/wp-content/uploads/2021/12/Warrior-2-Pose_Andrew-Clark_2400x1350.jpeg", desc:"Wide stance; front knee ~90°; arms extended horizontally.", angles:{ LShoulder:90,RShoulder:90,LElbow:170,RElbow:170,LHip:120,RHip:170,LKnee:90,RKnee:175 }, tolerances:{ LShoulder:25,RShoulder:25,LElbow:30,RElbow:30,LHip:30,RHip:40,LKnee:25,RKnee:35 }, weights:{ LShoulder:1.2,RShoulder:1.2,LElbow:1,RElbow:1,LHip:1,RHip:1,LKnee:1.4,RKnee:1 } },
    { id:3, name:"Downward-Facing Dog (Adho Mukha Śvānāsana)", image:"https://upload.wikimedia.org/wikipedia/commons/5/57/Downward-Facing-Dog.JPG", desc:"Upside-V: hips high, spine long.", angles:{ LShoulder:50,RShoulder:50,LElbow:170,RElbow:170,LHip:90,RHip:90,LKnee:170,RKnee:170 }, tolerances:{ LShoulder:35,RShoulder:35,LElbow:30,RElbow:30,LHip:40,RHip:40,LKnee:30,RKnee:30 }, weights:{ LShoulder:1,RShoulder:1,LElbow:1,RElbow:1,LHip:1.3,RHip:1.3,LKnee:0.8,RKnee:0.8 } },
    { id:4, name:"Chair Pose (Utkatasana)", image:"https://cdn.yogajournal.com/wp-content/uploads/2021/11/Chair-Pose_Andrew-Clark.jpg", desc:"Knees bent as if sitting; torso lifted; arms overhead.", angles:{ LShoulder:60,RShoulder:60,LElbow:165,RElbow:165,LHip:100,RHip:100,LKnee:100,RKnee:100 }, tolerances:{ LShoulder:30,RShoulder:30,LElbow:35,RElbow:35,LHip:25,RHip:25,LKnee:25,RKnee:25 }, weights:{ LShoulder:1,RShoulder:1,LElbow:0.8,RElbow:0.8,LHip:1.4,RHip:1.4,LKnee:1.6,RKnee:1.6 } },
    { id:5, name:"Cobra Pose (Bhujangāsana)", image:"https://omstars.com/blog/wp-content/uploads/2024/11/how-to-do-cobra-pose.png", desc:"Prone back-bend: chest lifted, gentle spine arch.", angles:{ LShoulder:40,RShoulder:40,LElbow:140,RElbow:140,LHip:150,RHip:150,LKnee:170,RKnee:170 }, tolerances:{ LShoulder:30,RShoulder:30,LElbow:40,RElbow:40,LHip:30,RHip:30,LKnee:35,RKnee:35 }, weights:{ LShoulder:1,RShoulder:1,LElbow:1.2,RElbow:1.2,LHip:1.4,RHip:1.4,LKnee:0.8,RKnee:0.8 } },
  ];

  // --- DOM refs
  const landing = document.getElementById('landing');
  const startBtn = document.getElementById('startBtn');
  const levelScreen = document.getElementById('levelScreen');
  const levelNumber = document.getElementById('levelNumber');
  const levelHint = document.getElementById('levelHint');
  const refImage = document.getElementById('refImage');
  const refName = document.getElementById('refName');
  const refDesc = document.getElementById('refDesc');
  const anglesList = document.getElementById('anglesList');

  const startCamBtn = document.getElementById('startCamBtn');
  const beginPoseBtn = document.getElementById('beginPoseBtn');
  const retryLevelBtn = document.getElementById('retryLevelBtn');

  const videoElement = document.getElementById('videoElement');
  const overlay = document.getElementById('overlay');
  const countdownLabel = document.getElementById('countdownLabel');
  const liveSim = document.getElementById('liveSim');
  const holdPct = document.getElementById('holdPct');

  const scoreScreen = document.getElementById('scoreScreen');
  const scoreLevel = document.getElementById('scoreLevel');
  const levelScoreEl = document.getElementById('levelScore');
  const scoreLabelEl = document.getElementById('scoreLabel');
  const feedbackText = document.getElementById('feedbackText');
  const nextBtn = document.getElementById('nextBtn');
  const retryBtn = document.getElementById('retryBtn');
  const exitBtn = document.getElementById('exitBtn');

  const finalScreen = document.getElementById('finalScreen');
  const finalScoreEl = document.getElementById('finalScore');
  const finalLabelEl = document.getElementById('finalLabel');
  const restartAllBtn = document.getElementById('restartAllBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // --- state
  let currentLevelIndex = 0;
  let activeRun = false;
  let framesSimilarity = [];
  let inPoseFrames = 0;
  let totalFrames = 0;
  let results = [];
  const holdRequirementPct = 0.70;

  // Canvas for drawing skeleton
  const ctx = overlay.getContext('2d');

  // --- Angle calculation utilities
  function angleBetween(a, b, c) {
    const v1 = {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
    const v2 = {x: c.x - b.x, y: c.y - b.y, z: c.z - b.z};
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const m1 = Math.hypot(v1.x, v1.y, v1.z) || 1e-6;
    const m2 = Math.hypot(v2.x, v2.y, v2.z) || 1e-6;
    let cos = dot / (m1 * m2);
    cos = Math.max(-1, Math.min(1, cos));
    return Math.acos(cos) * 180 / Math.PI;
  }

  function poseAnglesFromKinect(joints) {
    const angles = {};
    try {
      const J = joints;
      if (J.ShoulderLeft && J.SpineShoulder && J.ElbowLeft)
        angles.LShoulder = angleBetween(J.SpineShoulder, J.ShoulderLeft, J.ElbowLeft);
      if (J.ShoulderRight && J.SpineShoulder && J.ElbowRight)
        angles.RShoulder = angleBetween(J.SpineShoulder, J.ShoulderRight, J.ElbowRight);
      if (J.ShoulderLeft && J.ElbowLeft && J.WristLeft)
        angles.LElbow = angleBetween(J.ShoulderLeft, J.ElbowLeft, J.WristLeft);
      if (J.ShoulderRight && J.ElbowRight && J.WristRight)
        angles.RElbow = angleBetween(J.ShoulderRight, J.ElbowRight, J.WristRight);
      if (J.ShoulderLeft && J.HipLeft && J.KneeLeft)
        angles.LHip = angleBetween(J.ShoulderLeft, J.HipLeft, J.KneeLeft);
      if (J.ShoulderRight && J.HipRight && J.KneeRight)
        angles.RHip = angleBetween(J.ShoulderRight, J.HipRight, J.KneeRight);
      if (J.HipLeft && J.KneeLeft && J.AnkleLeft)
        angles.LKnee = angleBetween(J.HipLeft, J.KneeLeft, J.AnkleLeft);
      if (J.HipRight && J.KneeRight && J.AnkleRight)
        angles.RKnee = angleBetween(J.HipRight, J.KneeRight, J.AnkleRight);
    } catch (err) {
      console.warn('Angle calculation error:', err);
    }
    return angles;
  }

  function computeSimilarityMap(detectedAngles, levelRef) {
    let totalWeight = 0;
    let weightedSum = 0;
    for (const key in levelRef.angles) {
      const target = levelRef.angles[key];
      const tol = levelRef.tolerances[key] || 40;
      const weight = levelRef.weights[key] || 1;
      const val = detectedAngles[key];
      if (typeof val === 'number' && !isNaN(val)) {
        const d = Math.abs(val - target);
        const s = Math.max(0, 1 - (d / tol));
        weightedSum += s * weight;
        totalWeight += weight;
      } else {
        totalWeight += weight;
      }
    }
    return totalWeight > 0 ? (weightedSum / totalWeight) : 0;
  }

  function classifyScore(p) {
    if (p >= 86) return {label: 'Superhuman', color: '#09a86b'};
    if (p >= 66) return {label: 'Healthy', color: '#6fd08f'};
    if (p >= 41) return {label: 'Average', color: '#f0b24a'};
    return {label: 'Poor', color: '#eb6b5a'};
  }

  // --- Drawing skeleton on canvas
  function drawSkeletonOnCanvas(joints) {
    overlay.width = 640;
    overlay.height = 480;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (!joints) return;

    // Draw connections
    const connections = [
      ['Head', 'Neck'],
      ['Neck', 'SpineShoulder'],
      ['SpineShoulder', 'ShoulderLeft'],
      ['SpineShoulder', 'ShoulderRight'],
      ['ShoulderLeft', 'ElbowLeft'],
      ['ElbowLeft', 'WristLeft'],
      ['ShoulderRight', 'ElbowRight'],
      ['ElbowRight', 'WristRight'],
      ['SpineShoulder', 'SpineMid'],
      ['SpineMid', 'SpineBase'],
      ['SpineBase', 'HipLeft'],
      ['SpineBase', 'HipRight'],
      ['HipLeft', 'KneeLeft'],
      ['KneeLeft', 'AnkleLeft'],
      ['HipRight', 'KneeRight'],
      ['KneeRight', 'AnkleRight']
    ];

    ctx.strokeStyle = '#2e6f4d';
    ctx.lineWidth = 3;

    connections.forEach(([a, b]) => {
      if (joints[a] && joints[b]) {
        const jA = joints[a];
        const jB = joints[b];
        
        // Map 3D coordinates to 2D canvas (simple projection)
        const x1 = (jA.x + 1) * overlay.width / 2;
        const y1 = (-jA.y + 1) * overlay.height / 2;
        const x2 = (jB.x + 1) * overlay.width / 2;
        const y2 = (-jB.y + 1) * overlay.height / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Draw joints
    ctx.fillStyle = '#09a86b';
    Object.values(joints).forEach(joint => {
      if (joint && joint.trackingState === 2) { // Only tracked joints
        const x = (joint.x + 1) * overlay.width / 2;
        const y = (-joint.y + 1) * overlay.height / 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // --- Kinect event handlers
  function onKinectBodyFrame(bodyData) {
    if (!bodyData || !bodyData.tracked) {
      return;
    }

    const joints = bodyData.joints;
    const angles = poseAnglesFromKinect(joints);
    const levelRef = LEVELS[currentLevelIndex];
    const similarity = computeSimilarityMap(angles, levelRef);

    // Update UI
    liveSim.textContent = Math.round(similarity * 100);

    if (activeRun) {
      framesSimilarity.push(similarity);
      totalFrames++;
      if (similarity >= 0.7) inPoseFrames++;
      
      const holdProgress = totalFrames > 0 ? (inPoseFrames / totalFrames) : 0;
      holdPct.textContent = Math.round(holdProgress * 100);
    }

    // Draw skeleton
    drawSkeletonOnCanvas(joints);
  }

  function onKinectStatus(status) {
    console.log('Kinect status:', status);
    if (status.isMock) {
      countdownLabel.textContent = '⚠️ Mock Mode';
      countdownLabel.style.color = '#f0b24a';
    } else if (status.connected) {
      countdownLabel.textContent = '✅ Kinect Ready';
      countdownLabel.style.color = '#09a86b';
      startCamBtn.disabled = false;
    } else {
      countdownLabel.textContent = '❌ ' + (status.message || 'Not Connected');
      countdownLabel.style.color = '#eb6b5a';
    }
  }

  // --- Setup Kinect listeners
  window.kinectAPI.onBodyFrame(onKinectBodyFrame);
  window.kinectAPI.onKinectStatus(onKinectStatus);

  // --- UI Navigation
  function showScreen(screen) {
    landing.classList.add('hidden');
    levelScreen.classList.add('hidden');
    scoreScreen.classList.add('hidden');
    finalScreen.classList.add('hidden');
    screen.classList.remove('hidden');
  }

  function loadLevel(index) {
    currentLevelIndex = index;
    const level = LEVELS[index];
    levelNumber.textContent = level.id;
    refImage.src = level.image;
    refName.textContent = level.name;
    refDesc.textContent = level.desc;
    
    let anglesHTML = '<div style="margin-top:8px;font-size:13px;">';
    for (const key in level.angles) {
      anglesHTML += `<div>${key}: ${level.angles[key]}° (±${level.tolerances[key]}°)</div>`;
    }
    anglesHTML += '</div>';
    anglesList.innerHTML = anglesHTML;

    levelHint.textContent = `Hold the pose for 30s • Keep steady`;
  }

  // --- Start app
  startBtn?.addEventListener('click', () => {
    showScreen(levelScreen);
    loadLevel(0);
  });

  startCamBtn?.addEventListener('click', () => {
    window.kinectAPI.startKinect();
    startCamBtn.disabled = true;
    startCamBtn.textContent = 'Kinect Starting...';
    setTimeout(() => {
      startCamBtn.textContent = 'Kinect Active';
      beginPoseBtn.disabled = false;
    }, 2000);
  });

  beginPoseBtn?.addEventListener('click', () => {
    // 3-second countdown
    let count = 3;
    countdownLabel.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownLabel.textContent = count;
      } else {
        clearInterval(interval);
        countdownLabel.textContent = 'GO!';
        startPoseRun();
      }
    }, 1000);
  });

  function startPoseRun() {
    activeRun = true;
    framesSimilarity = [];
    inPoseFrames = 0;
    totalFrames = 0;
    
    setTimeout(() => {
      finishLevelRun();
    }, 30000); // 30 seconds
  }

  function finishLevelRun() {
    activeRun = false;
    const avg = framesSimilarity.reduce((a, b) => a + b, 0) / Math.max(1, framesSimilarity.length);
    const percent = Math.round(avg * 100);
    const holdProgress = totalFrames > 0 ? (inPoseFrames / totalFrames) : 0;
    const holdPassed = holdProgress >= holdRequirementPct;
    
    const finalScore = holdPassed ? percent : Math.round(percent * 0.8);
    const cls = classifyScore(finalScore);
    
    results.push({level: currentLevelIndex + 1, score: finalScore});
    
    scoreLevel.textContent = currentLevelIndex + 1;
    levelScoreEl.textContent = finalScore;
    scoreLabelEl.textContent = cls.label;
    scoreLabelEl.style.background = cls.color;
    feedbackText.textContent = `Hold stability: ${Math.round(holdProgress * 100)}% ${holdPassed ? '✓' : '✗'}`;
    
    showScreen(scoreScreen);
  }

  retryLevelBtn?.addEventListener('click', () => {
    loadLevel(currentLevelIndex);
    countdownLabel.textContent = 'Ready';
  });

  nextBtn?.addEventListener('click', () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      loadLevel(currentLevelIndex + 1);
      showScreen(levelScreen);
      countdownLabel.textContent = 'Ready';
    } else {
      showFinalScreen();
    }
  });

  retryBtn?.addEventListener('click', () => {
    loadLevel(currentLevelIndex);
    showScreen(levelScreen);
    countdownLabel.textContent = 'Ready';
  });

  exitBtn?.addEventListener('click', () => {
    window.kinectAPI.stopKinect();
    showScreen(landing);
  });

  function showFinalScreen() {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const avgScore = Math.round(totalScore / results.length);
    const cls = classifyScore(avgScore);
    
    finalScoreEl.textContent = avgScore;
    finalLabelEl.textContent = cls.label;
    finalLabelEl.style.background = cls.color;
    
    showScreen(finalScreen);
  }

  restartAllBtn?.addEventListener('click', () => {
    results = [];
    loadLevel(0);
    showScreen(levelScreen);
    countdownLabel.textContent = 'Ready';
  });

  downloadBtn?.addEventListener('click', () => {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poseyoga_results.json';
    a.click();
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    window.kinectAPI.stopKinect();
    window.kinectAPI.removeBodyFrameListener();
    window.kinectAPI.removeStatusListener();
  });

  console.log('✅ PoseYoga Kinect initialized');
}
