import React from 'react';

const Landing = ({ onStart }) => {
  return (
    <section className="landing">
      <h2>PoseYoga</h2>
      <p className="muted">Warm, healthy posture practice — 5 progressive levels</p>
      <button className="start-btn" onClick={onStart}>Start</button>
    </section>
  );
};

export default Landing;