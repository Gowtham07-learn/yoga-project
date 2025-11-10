import { useEffect } from 'react'
import './index.css'
import initPoseYoga from './poseyoga'

function App() {
  useEffect(() => {
    const cleanup = initPoseYoga()
    return cleanup
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
          <h2>PoseYoga </h2>
          <p className="muted">Warm, healthy posture practice — 5 progressive levels</p>
          <button id="startBtn" className="start-btn">Start</button>
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

      <footer className="muted">Prototype — runs in browser. No camera data leaves your device.</footer>
    </div>
  )
}

export default App
