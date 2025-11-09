export const generatePoseFeedback = (jointKey, angle, target, tolerance) => {
  const diff = Math.abs(angle - target);
  const jointName = jointKey.replace(/([A-Z])/g, ' $1').trim();
  
  if (diff > tolerance) {
    const direction = angle > target ? "lower" : "raise";
    const instructions = {
      LShoulder: `${direction} your left arm`,
      RShoulder: `${direction} your right arm`,
      LElbow: angle > target ? "straighten your left arm more" : "bend your left elbow more",
      RElbow: angle > target ? "straighten your right arm more" : "bend your right elbow more",
      LHip: `${direction} your left hip`,
      RHip: `${direction} your right hip`,
      LKnee: angle > target ? "straighten your left leg more" : "bend your left knee more",
      RKnee: angle > target ? "straighten your right leg more" : "bend your right knee more"
    };

    return {
      joint: jointName,
      instruction: instructions[jointKey] || `Adjust your ${jointName}`,
      difference: Math.round(diff)
    };
  }
  return null;
};

export const getPoseCorrectionMessage = (detectedAngles, levelRef) => {
  const corrections = [];
  
  for (const key in levelRef.angles) {
    const target = levelRef.angles[key];
    const tol = levelRef.tolerances[key] || 40;
    const val = detectedAngles[key];
    
    if (typeof val === "number" && !isNaN(val)) {
      const feedback = generatePoseFeedback(key, val, target, tol);
      if (feedback) {
        corrections.push(feedback);
      }
    }
  }
  
  if (corrections.length === 0) {
    return null;
  }

  // Sort by largest difference and take top 2
  corrections.sort((a, b) => b.difference - a.difference);
  const topCorrections = corrections.slice(0, 2);
  
  const message = topCorrections.map(c => 
    `${c.instruction} (off by ${c.difference}°)`
  ).join('\n');

  return {
    message,
    severity: corrections[0].difference > 45 ? "high" : "medium"
  };
};