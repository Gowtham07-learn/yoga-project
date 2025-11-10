// Wrapped version of original script.js to work inside React
export default function initPoseYoga(){
  if (window.__poseyoga_inited_once) return; // avoid double wiring
  window.__poseyoga_inited_once = true;

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

  // lightweight hint popup (toast)
  const hintBox = document.createElement('div');
  hintBox.id = 'hintToast';
  hintBox.className = 'hint-toast hidden';
  document.body.appendChild(hintBox);

  // --- state
  let currentLevelIndex = 0;
  let pose = null;
  let camera = null;
  let activeRun = false;
  let framesSimilarity = [];
  let simRolling = [];
  let frameSmoothing = 6;
  let inPoseFrames = 0;
  let totalFrames = 0;
  let jointDiffAcc = {};
  let jointCountAcc = {};
  let results = [];
  const holdRequirementPct = 0.70;
  let lastHintAt = 0;
  // timers for cleanup
  let readyTimerId = null;
  let runTimerId = null;

  // canvas context
  const ctx = overlay.getContext('2d');

  // --- utilities
  function angleBetween(a,b,c){
    const v1 = {x:a.x-b.x, y:a.y-b.y, z:(a.z||0)-(b.z||0)};
    const v2 = {x:c.x-b.x, y:c.y-b.y, z:(c.z||0)-(b.z||0)};
    const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
    const m1 = Math.hypot(v1.x, v1.y, v1.z) || 1e-6;
    const m2 = Math.hypot(v2.x, v2.y, v2.z) || 1e-6;
    let cos = dot/(m1*m2);
    cos = Math.max(-1, Math.min(1, cos));
    return Math.acos(cos) * 180/Math.PI;
  }

  function landmarksByName(landmarks){
    const map = {};
    const idx = { left_shoulder:11, right_shoulder:12, left_elbow:13, right_elbow:14, left_wrist:15, right_wrist:16, left_hip:23, right_hip:24, left_knee:25, right_knee:26, left_ankle:27, right_ankle:28 };
    for(const name in idx){
      const lm = landmarks[idx[name]];
      map[name] = lm ? {x:lm.x,y:lm.y,z:lm.z} : null;
    }
    return map;
  }

  function poseAngles(landmarks){
    const L = landmarksByName(landmarks || []);
    const angles = {};
    try {
      if(L.left_shoulder && L.left_hip && L.left_elbow) angles.LShoulder = angleBetween(L.left_hip, L.left_shoulder, L.left_elbow);
      if(L.right_shoulder && L.right_hip && L.right_elbow) angles.RShoulder = angleBetween(L.right_hip, L.right_shoulder, L.right_elbow);
      if(L.left_elbow && L.left_shoulder && L.left_wrist) angles.LElbow = angleBetween(L.left_shoulder, L.left_elbow, L.left_wrist);
      if(L.right_elbow && L.right_shoulder && L.right_wrist) angles.RElbow = angleBetween(L.right_shoulder, L.right_elbow, L.right_wrist);
      if(L.left_hip && L.left_shoulder && L.left_knee) angles.LHip = angleBetween(L.left_shoulder, L.left_hip, L.left_knee);
      if(L.right_hip && L.right_shoulder && L.right_knee) angles.RHip = angleBetween(L.right_shoulder, L.right_hip, L.right_knee);
      if(L.left_knee && L.left_hip && L.left_ankle) angles.LKnee = angleBetween(L.left_hip, L.left_knee, L.left_ankle);
      if(L.right_knee && L.right_hip && L.right_ankle) angles.RKnee = angleBetween(L.right_hip, L.right_knee, L.right_ankle);
    } catch { void 0; }
    return angles;
  }

  function computeSimilarityMap(detectedAngles, levelRef){
    const map = {};
    let totalWeight = 0;
    let weightedSum = 0;
    for(const key in levelRef.angles){
      const target = levelRef.angles[key];
      const tol = levelRef.tolerances[key] || 40;
      const weight = levelRef.weights[key] || 1;
      const val = detectedAngles[key];
      if(typeof val === 'number' && !isNaN(val)){
        const d = Math.abs(val - target);
        const s = Math.max(0, 1 - (d/tol));
        map[key] = {diff:d, score:s, weight};
        weightedSum += s * weight;
        totalWeight += weight;
      } else {
        map[key] = {diff:180, score:0, weight};
        totalWeight += weight;
      }
    }
    const overall = totalWeight>0 ? (weightedSum/totalWeight) : 0;
    return {map, overall};
  }

  function classifyScore(p){
    if(p >= 86) return {label:'Superhuman', color:'#09a86b'};
    if(p >= 66) return {label:'Healthy', color:'#6fd08f'};
    if(p >= 41) return {label:'Average', color:'#f0b24a'};
    return {label:'Poor', color:'#eb6b5a'};
  }

  // --- hint helpers ---
  function humanizeJoint(key){
    return key
      .replace('L','Left ')
      .replace('R','Right ')
      .replace('Shoulder','Shoulder')
      .replace('Elbow','Elbow')
      .replace('Hip','Hip')
      .replace('Knee','Knee');
  }
  function hintForJoint(key, current, target){
    if(typeof current !== 'number' || typeof target !== 'number') return '';
    const delta = Math.round(target - current);
    if(Math.abs(delta) < 6) return '';
    // tailor a few joints
    let verb = 'adjust';
    if(/Knee/.test(key)) verb = delta > 0 ? 'bend' : 'straighten';
    if(/Elbow/.test(key)) verb = delta > 0 ? 'bend' : 'straighten';
    if(/Shoulder/.test(key)) verb = delta > 0 ? 'raise' : 'lower';
    return `${humanizeJoint(key)} — ${verb} by ~${Math.abs(delta)}°`;
  }
  function showHint(text){
    if(!text) return;
    hintBox.textContent = text;
    hintBox.classList.remove('hidden');
    setTimeout(()=>{ hintBox.classList.add('hidden'); }, 1800);
    lastHintAt = Date.now();
  }

  function drawPoseOnCanvas(landmarks){
    const desiredW = videoElement.videoWidth || videoElement.clientWidth || overlay.clientWidth;
    const desiredH = videoElement.videoHeight || videoElement.clientHeight || overlay.clientHeight;
    if (overlay.width !== desiredW || overlay.height !== desiredH) {
      overlay.width = desiredW;
      overlay.height = desiredH;
    }
    ctx.clearRect(0,0,overlay.width, overlay.height);

    if(!landmarks || landmarks.length === 0) return;
    try {
      if(window.drawConnectors && window.drawLandmarks && window.POSE_CONNECTIONS){
        window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, {color:'#2e6f4d', lineWidth:2});
        window.drawLandmarks(ctx, landmarks, {color:'#123', lineWidth:2});
        return;
      }
    } catch { void 0; }

    ctx.fillStyle = '#0a6';
    for(const lm of landmarks){
      const x = lm.x * overlay.width;
      const y = lm.y * overlay.height;
      ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    }
  }

  async function setupPose(){
    if(pose) return;
    pose = new window.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({ modelComplexity:1, smoothLandmarks:true, enableSegmentation:false, minDetectionConfidence:0.6, minTrackingConfidence:0.6 });
    pose.onResults(onResults);
  }

  function onResults(results){
    drawPoseOnCanvas(results.poseLandmarks || []);
    if(!results.poseLandmarks){
      liveSim.textContent = '—';
      return;
    }
    const angles = poseAngles(results.poseLandmarks);
    const levelRef = LEVELS[currentLevelIndex];
    const simData = computeSimilarityMap(angles, levelRef);

    for(const j in simData.map){
      jointDiffAcc[j] = (jointDiffAcc[j] || 0) + simData.map[j].diff;
      jointCountAcc[j] = (jointCountAcc[j] || 0) + 1;
    }

    if(activeRun){
      simRolling.push(simData.overall);
      if(simRolling.length > frameSmoothing) simRolling.shift();
      const smooth = simRolling.reduce((a,b)=>a+b,0) / simRolling.length;
      framesSimilarity.push(smooth);

      // show corrective hint if needed (rate limited)
      if(Date.now() - lastHintAt > 1800){
        // find worst joint right now
        let worstKey = null; let worst = -1;
        for(const k in simData.map){
          const d = simData.map[k].diff;
          if(d > worst){ worst = d; worstKey = k; }
        }
        if(worstKey){
          const target = (LEVELS[currentLevelIndex].angles[worstKey]);
          const current = angles[worstKey];
          const text = hintForJoint(worstKey, current, target);
          if(smooth < 0.6 || worst > (LEVELS[currentLevelIndex].tolerances[worstKey]||40)){
            showHint(text);
          }
        }
      }
      totalFrames++;
      if(smooth >= 0.70) inPoseFrames++;
      liveSim.textContent = Math.round(smooth * 100);
      holdPct.textContent = Math.round(inPoseFrames / Math.max(1, totalFrames) * 100);
    } else {
      liveSim.textContent = Math.round(simData.overall * 100);
    }
  }

  function startCamera(){
    if(camera) return;
    startCamBtn.disabled = true;
    startCamBtn.textContent = 'Starting...';
    setupPose().then(()=>{
      camera = new window.Camera(videoElement, {
        onFrame: async () => { await pose.send({image: videoElement}); },
        width:360, height:640
      });
      camera.start().then(()=>{
        startCamBtn.style.display = 'none';
        startCamBtn.disabled = false;
      }).catch(err=>{
        console.error('Camera start fail:', err);
        startCamBtn.disabled = false;
        startCamBtn.textContent = 'Start Camera';
        alert('Unable to start camera: ' + err.message);
      });
    }).catch(e=>{
      console.error('Pose setup failed:', e);
      alert('Model load failed: ' + e.message);
    });
  }

  function stopCamera(){
    try{ if(camera && camera.stop) camera.stop(); }catch { void 0; }
    camera = null;
    if(pose){ pose.close && pose.close(); pose = null; }
    startCamBtn.style.display = 'inline-block';
    startCamBtn.textContent = 'Start Camera';
  }

  function resetLevelState(){
    framesSimilarity = [];
    simRolling = [];
    inPoseFrames = 0;
    totalFrames = 0;
    jointDiffAcc = {};
    jointCountAcc = {};
    activeRun = false;
    countdownLabel.textContent = 'Ready';
    liveSim.textContent = '—';
    holdPct.textContent = '0';
  }

  function startPoseRun(){
    if(!camera){ alert('Start the camera first.'); return; }
    resetLevelState();
    let t = 3;
    countdownLabel.textContent = `Get ready: ${t}`;
    if (readyTimerId) { clearInterval(readyTimerId); readyTimerId = null; }
    readyTimerId = setInterval(()=>{
      t--;
      if(t>0) {
        countdownLabel.textContent = `Get ready: ${t}`;
      } else {
        clearInterval(readyTimerId);
        readyTimerId = null;
        const RUN_MS = 30000;
        const start = Date.now();
        activeRun = true;
        if (runTimerId) { clearInterval(runTimerId); runTimerId = null; }
        runTimerId = setInterval(()=>{
          const remaining = Math.max(0, RUN_MS - (Date.now() - start));
          countdownLabel.textContent = `Hold: ${Math.ceil(remaining/1000)}s`;
          if(remaining <= 0){
            clearInterval(runTimerId);
            runTimerId = null;
            activeRun = false;
            countdownLabel.textContent = 'Done';
            setTimeout(()=> finishLevelRun(), 300);
          }
        }, 300);
      }
    }, 900);
  }

  function finishLevelRun(){
    const avgSim = framesSimilarity.length ? (framesSimilarity.reduce((a,b)=>a+b,0)/framesSimilarity.length) : 0;
    const percent = Math.round(avgSim * 100);
    const holdPctActual = inPoseFrames / Math.max(1, totalFrames);
    const holdPassed = holdPctActual >= holdRequirementPct;

    let finalScore = percent;
    if(!holdPassed) finalScore = Math.round(finalScore * 0.8);

    const avgDiffs = {};
    for(const j in jointDiffAcc){ avgDiffs[j] = jointDiffAcc[j] / Math.max(1, jointCountAcc[j]); }
    const sorted = Object.keys(avgDiffs).sort((a,b)=>avgDiffs[b]-avgDiffs[a]);
    const top3 = sorted.slice(0,3).map(k => `${k.replace(/([A-Z])/g,' $1')}: ${Math.round(avgDiffs[k])}°`);
    const feedback = top3.length ? top3.join(' • ') : 'Nice hold!';

    results[currentLevelIndex] = {level: LEVELS[currentLevelIndex].name, score: finalScore, holdPassed, feedback};
    showScoreScreen(finalScore, feedback);
  }

  function showScoreScreen(score, feedback){
    levelScoreEl.textContent = score;
    const cls = classifyScore(score);
    scoreLabelEl.textContent = cls.label;
    scoreLabelEl.style.background = cls.color;
    scoreLabelEl.style.color = '#fff';
    feedbackText.textContent = feedback;
    levelScreen.classList.add('hidden');
    scoreScreen.classList.remove('hidden');
    document.getElementById('scoreLevel').textContent = LEVELS[currentLevelIndex].id;
  }

  function goToNextLevel(){
    scoreScreen.classList.add('hidden');
    currentLevelIndex++;
    if(currentLevelIndex >= LEVELS.length){
      showFinalResults();
      return;
    }
    showLevelScreen();
  }

  function showFinalResults(){
    const sum = results.reduce((a,r)=>a + (r ? r.score : 0), 0);
    const avg = Math.round(sum / LEVELS.length);
    finalScoreEl.textContent = avg;
    const cls = classifyScore(avg);
    finalLabelEl.textContent = `${cls.label} — ${avg}`;
    finalLabelEl.style.color = cls.color;
    finalLabelEl.style.fontWeight = '700';
    scoreScreen.classList.add('hidden');
    levelScreen.classList.add('hidden');
    finalScreen.classList.remove('hidden');
  }

  function retryLevel(){
    scoreScreen.classList.add('hidden');
    showLevelScreen();
  }

  function showLevelScreen(){
    finalScreen.classList.add('hidden');
    scoreScreen.classList.add('hidden');
    levelScreen.classList.remove('hidden');
    const lvl = LEVELS[currentLevelIndex];
    levelNumber.textContent = lvl.id;
    refImage.src = lvl.image;
    refName.textContent = lvl.name;
    refDesc.textContent = lvl.desc + ' • Hold 30s.';
    anglesList.innerHTML = Object.entries(lvl.angles).map(([k,v]) => `<div>${k}: ${v}°</div>`).join('');
    resetLevelState();
  }

  function downloadResults(){
    const payload = {timestamp:new Date().toISOString(), results};
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'poseyoga-results.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // UI events wiring (keep refs so we can clean up)
  const onStartClick = () => { landing.classList.add('hidden'); currentLevelIndex = 0; results = []; showLevelScreen(); };
  const onStartCamClick = () => { startCamera(); };
  const onBeginPoseClick = () => { startPoseRun(); };
  const onRetryLevelClick = () => { resetLevelState(); };
  const onNextClick = () => { goToNextLevel(); };
  const onRetryClick = () => { retryLevel(); };
  const onExitClick = () => { stopCamera(); levelScreen.classList.add('hidden'); scoreScreen.classList.add('hidden'); finalScreen.classList.add('hidden'); landing.classList.remove('hidden'); startCamBtn.style.display = 'inline-block'; };
  const onRestartAllClick = () => { results = []; currentLevelIndex = 0; finalScreen.classList.add('hidden'); landing.classList.remove('hidden'); stopCamera(); };
  const onDownloadClick = () => { downloadResults(); };

  startBtn?.addEventListener('click', onStartClick);
  startCamBtn?.addEventListener('click', onStartCamClick);
  beginPoseBtn?.addEventListener('click', onBeginPoseClick);
  retryLevelBtn?.addEventListener('click', onRetryLevelClick);
  nextBtn?.addEventListener('click', onNextClick);
  retryBtn?.addEventListener('click', onRetryClick);
  exitBtn?.addEventListener('click', onExitClick);
  restartAllBtn?.addEventListener('click', onRestartAllClick);
  downloadBtn?.addEventListener('click', onDownloadClick);

  // video metadata sizing
  const onLoadedMeta = () => {
    overlay.width = videoElement.videoWidth;
    overlay.height = videoElement.videoHeight;
  };
  videoElement?.addEventListener('loadedmetadata', onLoadedMeta);

  // pre-load model (no camera start)
  setupPose().catch(()=>{});

  // return cleanup for React unmounts
  return () => {
    // clear timers
    if (readyTimerId) { clearInterval(readyTimerId); readyTimerId = null; }
    if (runTimerId) { clearInterval(runTimerId); runTimerId = null; }
    // stop camera/pose
    stopCamera();
    try { if (pose && pose.close) pose.close(); } catch { /* noop */ }
    pose = null;
    // remove event listeners
    startBtn?.removeEventListener('click', onStartClick);
    startCamBtn?.removeEventListener('click', onStartCamClick);
    beginPoseBtn?.removeEventListener('click', onBeginPoseClick);
    retryLevelBtn?.removeEventListener('click', onRetryLevelClick);
    nextBtn?.removeEventListener('click', onNextClick);
    retryBtn?.removeEventListener('click', onRetryClick);
    exitBtn?.removeEventListener('click', onExitClick);
    restartAllBtn?.removeEventListener('click', onRestartAllClick);
    downloadBtn?.removeEventListener('click', onDownloadClick);
    videoElement?.removeEventListener('loadedmetadata', onLoadedMeta);
    // remove hint element
    try { hintBox?.remove(); } catch { /* noop */ }
    // reset UI visibility
    levelScreen?.classList.add('hidden');
    scoreScreen?.classList.add('hidden');
    finalScreen?.classList.add('hidden');
    landing?.classList.remove('hidden');
    // allow re-init later
    window.__poseyoga_inited_once = false;
  };
}
