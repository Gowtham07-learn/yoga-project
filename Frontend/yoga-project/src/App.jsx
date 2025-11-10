import { useEffect } from 'react'
import './index.css'
import initPoseYoga from './poseyoga'
import initPoseYogaKinect from './poseyoga_kinect'

function App() {
  useEffect(() => {
    // Check if running in Electron with Kinect support
    if (window.kinectAPI) {
      console.log('🎮 Running in Kinect mode');
      initPoseYogaKinect();
    } else {
      console.log('📷 Running in Webcam mode');
      initPoseYoga();
    }
  }, [])

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
        {/* Landing */}
        <section className="landing" id="landing">
          <div className="landing-hero">
            <div className="yoga-icon">🧘‍♀️</div>
            <h2>PoseYoga</h2>
            <p className="hero-description">Master yoga poses with AI-powered guidance</p>
            
            {/* Benefits carousel */}
            <div className="benefits-carousel">
              <div className="benefit-card active">
                <span className="benefit-icon">✨</span>
                <span>Perfect Your Posture</span>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🎯</span>
                <span>Real-time Feedback</span>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">📈</span>
                <span>Track Progress</span>
              </div>
              <div className="benefit-card">
                <span className="benefit-icon">🏆</span>
                <span>5 Progressive Levels</span>
              </div>
            </div>
            
            <button id="startBtn" className="start-btn">
              <span className="btn-icon">🚀</span>
              Begin Your Journey
            </button>
            
            {/* Floating yoga poses */}
            <div className="floating-poses">
              <div className="pose-float pose-1">🕉️</div>
              <div className="pose-float pose-2">🌸</div>
              <div className="pose-float pose-3">🍃</div>
              <div className="pose-float pose-4">💫</div>
            </div>
          </div>
        </section>

        {/* Level screen */}
        <section id="levelScreen" className="hidden">
          <div className="level-header">
            <div className="level-title">Level <span id="levelNumber">1</span></div>
            <div className="level-hint" id="levelHint">Hold the pose for 30s • Keep steady</div>
          </div>

          <div className="portrait-row">
            {/* Webcam card (portrait) */}
            <div className="card portrait">
              <div className="card-head">
                <div className="card-title">Your Camera</div>
                <div className="status">
                  <div>Similarity: <span id="liveSim">—</span>%</div>
                  <div>Hold: <span id="holdPct">0</span>%</div>
                </div>
              </div>

              <div className="media-wrap">
                <video id="videoElement" autoPlay playsInline muted></video>
                <canvas id="overlay"></canvas>
              </div>

              <div className="card-actions">
                <button id="startCamBtn" className="btn">Start Camera</button>
                <button id="beginPoseBtn" className="btn">Begin (3s)</button>
                <button id="retryLevelBtn" className="btn">Reset</button>
                <div className="countdown" id="countdownLabel">Ready</div>
              </div>
            </div>

            {/* Reference card (portrait) */}
            <div className="card portrait">
              <div className="card-head">
                <div className="card-title">Reference Pose</div>
                <div className="tiny muted" id="refName">Pose name</div>
              </div>

              <div className="ref-wrap">
                <img id="refImage" className="ref-img" src="" alt="Reference pose" />
              </div>

              <div className="card-body">
                <div id="refDesc" className="muted">Instruction text</div>
                <div className="angles-list" id="anglesList"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Score Screen */}
        <section id="scoreScreen" className="hidden">
          <div className="card score">
            <div className="score-title">Level <span id="scoreLevel">1</span> — Score</div>
            <div className="score-number" id="levelScore">0</div>
            <div id="scoreLabel" className="classification">—</div>
            <div id="feedbackText" className="muted">Feedback</div>

            <div className="score-actions">
              <button id="nextBtn" className="next-btn">Next Level</button>
              <button id="retryBtn" className="btn">Retry Level</button>
              <button id="exitBtn" className="btn">Exit</button>
            </div>
          </div>
        </section>

        {/* Final Screen */}
        <section id="finalScreen" className="hidden">
          <div className="card final">
            <div className="final-title">All Levels Complete</div>
            <div className="final-score" id="finalScore">0</div>
            <div id="finalLabel" className="final-badge">—</div>

            <div style={{marginTop:'12px'}}>
              <button id="restartAllBtn" className="next-btn">Restart</button>
              <button id="downloadBtn" className="btn">Download Results</button>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}

export default App
