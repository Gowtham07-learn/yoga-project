export const angleBetween = (a, b, c) => {
  // compute angle at b between a-b and c-b; landmarks are {x,y,z} normalized (0..1)
  const v1 = {x: a.x - b.x, y: a.y - b.y, z: (a.z||0) - (b.z||0)};
  const v2 = {x: c.x - b.x, y: c.y - b.y, z: (c.z||0) - (b.z||0)};
  const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
  const m1 = Math.hypot(v1.x, v1.y, v1.z) || 1e-6;
  const m2 = Math.hypot(v2.x, v2.y, v2.z) || 1e-6;
  let cos = dot/(m1*m2);
  cos = Math.max(-1, Math.min(1, cos));
  return Math.acos(cos) * 180/Math.PI;
};

export const landmarksByName = (landmarks) => {
  // indices per MediaPipe
  const map = {};
  const idx = {
    left_shoulder:11, right_shoulder:12, left_elbow:13, right_elbow:14,
    left_wrist:15, right_wrist:16, left_hip:23, right_hip:24,
    left_knee:25, right_knee:26, left_ankle:27, right_ankle:28
  };
  for(const name in idx){
    const lm = landmarks[idx[name]];
    map[name] = lm ? {x: lm.x, y: lm.y, z: lm.z} : null;
  }
  return map;
};

export const poseAngles = (landmarks) => {
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
    } catch {
    // swallow errors silently
  }
  return angles;
};

// Compute similarity across joints, returning both the per-joint diffs and an overall score in 0..1
export const computeSimilarityMap = (detectedAngles, levelRef) => {
  const perJoint = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const key in levelRef.angles) {
    const target = levelRef.angles[key];
    const tolerance = (levelRef.tolerances && levelRef.tolerances[key]) || 40;
    const weight = (levelRef.weights && levelRef.weights[key]) || 1;
    const value = detectedAngles[key];

    if (typeof value === 'number' && typeof target === 'number') {
      const diff = Math.abs(value - target);
      const similarity = Math.max(0, 1 - diff / Math.max(1, tolerance));

      perJoint[key] = { target, value, diff: Math.round(diff), similarity };
      totalWeight += weight;
      weightedSum += similarity * weight;
    }
  }

  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { overall, map: perJoint };
};

// Map numeric score to label and color for badges
export const classifyScore = (score) => {
  if (score >= 85) return { label: 'Excellent', color: '#20c997' };
  if (score >= 70) return { label: 'Good', color: '#51cf66' };
  if (score >= 55) return { label: 'Fair', color: '#fab005' };
  return { label: 'Try Again', color: '#fa5252' };
};