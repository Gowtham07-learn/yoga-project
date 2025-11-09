# PoseYoga — Prototype

Lightweight browser prototype for posture / yoga pose feedback using MediaPipe Pose.

This repository contains a small frontend app (Vite + React) that ported a vanilla JS prototype into React components. The app uses the MediaPipe Pose library (loaded via CDN in `index.html`) to estimate landmarks and compute a similarity score against reference poses.

## Contents

- `Frontend/yoga-project/` — React frontend (Vite). This is the runnable app. The main entry is `src/main.jsx` and `src/App.jsx`.
- `index.html` — Vite index (includes MediaPipe CDN scripts in the head).
- `script.js`, `styles.css` — original prototype source (kept for reference in the repo root if present).

## Quick start (frontend)

1. Open a terminal and change directory to the frontend project:

```bash
cd "Frontend/yoga-project"
```

2. Install dependencies (run once):

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the site in your browser. Vite normally serves at `http://localhost:5173` but if that port is taken it may fallback to another port (check terminal output).

Notes:
- The app uses MediaPipe via CDN (scripts are included in `index.html`).
- For local environment overrides, create a `.env.local` inside `Frontend/yoga-project` (this repo includes a `.env` template).

## Environment variables

Vite exposes only variables prefixed with `VITE_`. The repo contains `Frontend/yoga-project/.env` as a template. Do not commit secrets; for local secrets use `.env.local` which is ignored by `.gitignore`.

## Git / housekeeping

- `.gitignore` at repo root excludes `node_modules`, `dist`/`build`, `.env*`, editor files, OS junk, etc.
- If `node_modules` was previously committed, untrack them once with:

```bash
# from repo root
git rm -r --cached node_modules
git rm -r --cached Frontend/yoga-project/node_modules
git add .gitignore
git commit -m "Remove node_modules from tracking"
git push
```

## MediaPipe

The project uses the MediaPipe Pose JS package via CDN. `index.html` includes:

```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
```

No API keys are required.

## How I validated

- Converted the original vanilla app layout and styling into `src/App.jsx` and `src/App.css`.
- Wired MediaPipe initialization in the React app and preserved DOM IDs used by the logic (video `id="videoElement"`, `canvas id="overlay"`).

## Next steps (optional)

- Add `.env.example` instead of `.env` to avoid accidental secret commits.
- Add automated tests or a small demo recording option.

---

If you want, I can also:
- Create `README` inside the frontend folder with frontend-specific notes.
- Run the git commit + push now (I will stage `README.md`, commit it, and push to the current branch).

Tell me if you want me to proceed with committing and pushing this README now (I can push to `dharaneesh` as your current branch).