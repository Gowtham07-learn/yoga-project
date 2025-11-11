import React from 'react';
import yogaImg from '../assets/yoga.jpg';

const Landing = ({ onStart }) => {
  return (
    <section className="landing-hero">
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-pill">Home</div>
          <h1 className="hero-title">PoseYogo</h1>
          <p className="hero-subtitle">
            You cannot always control what goes on outside<br />
            But you can control what goes on inside.<br />
            Improve your posture and alignment with PoseYoga.
          </p>
          <div className="cta-row">
            <button className="btn-primary" onClick={onStart}>Get Started</button>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <img className="hero-img" src={yogaImg} alt="Yoga illustration" />
        </div>
      </div>
    </section>
  );
};

export default Landing;