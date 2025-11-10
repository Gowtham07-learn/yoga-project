# 🚀 Quick Start Guide - PoseYoga with Kinect

## ⚡ Super Quick Start

### Without Kinect (Webcam Only):
```bash
npm run dev
```
Open `http://localhost:5173` in your browser

### With Kinect v2:
```powershell
.\start-electron.ps1
```
Or manually:
```bash
# Terminal 1
npm run dev

# Terminal 2 (after Vite starts)
npm run electron:start
```

## 📦 What's Been Integrated

✅ **Electron App** - Desktop application wrapper  
✅ **Kinect v2 Support** - Full skeleton tracking  
✅ **IPC Bridge** - Secure communication between Kinect and React  
✅ **Auto-Detection** - Automatically switches between Kinect/Webcam mode  
✅ **Mock Mode** - Test without physical Kinect hardware  
✅ **Enhanced UI** - Beautiful landing page with carousel animations  

## 🎯 Current Status

### ✅ Completed
- Electron setup with Kinect service
- IPC communication layer (preload.js)
- Kinect v2 skeleton tracking (`kinectService.js`)
- React integration (`poseyoga_kinect.js`)
- Auto-mode detection in App.jsx
- Mock mode for testing without hardware

### ⚠️ Requires Installation (For Real Kinect)
1. **Visual Studio Build Tools** - For compiling native modules
2. **Kinect SDK 2.0** - For Kinect sensor drivers
3. **kinect2 npm package** - After above prerequisites

Currently running in **MOCK MODE** because kinect2 package isn't installed yet.

## 📋 To Use Real Kinect Hardware

Follow steps in `KINECT_SETUP.md`:

1. Install Visual Studio 2022 Build Tools with "C++ Desktop Development"
2. Install Kinect for Windows SDK 2.0
3. Restart computer
4. Run: `npm install kinect2 --save-dev`
5. Connect Kinect v2 sensor to USB 3.0 port
6. Run: `.\start-electron.ps1`

## 🎮 Features

### Kinect Mode (Electron)
- 3D skeleton tracking
- Depth sensing
- Works in low light
- More accurate pose detection
- Real-time joint visualization

### Webcam Mode (Browser)
- No special hardware needed
- Works on any platform
- Uses MediaPipe for pose detection
- Runs in standard browser

## 🗂️ Project Files

### New Files Created:
```
electron/
├── main.js              ← Electron entry point
├── preload.js           ← Secure IPC bridge
└── kinectService.js     ← Kinect v2 handler (with mock fallback)

src/
└── poseyoga_kinect.js   ← Kinect-enabled pose tracking

start-electron.ps1       ← Easy launcher script
KINECT_SETUP.md         ← Detailed setup instructions
QUICKSTART.md           ← This file
```

### Modified Files:
```
package.json            ← Added Electron scripts
src/App.jsx            ← Auto-detects Kinect/Webcam mode
src/App.css            ← Enhanced UI styles
```

## 🎨 UI Enhancements

Landing page now features:
- 🧘 Large yoga icon with float animation
- ✨ Animated benefit cards carousel
- 🚀 Enhanced "Begin Your Journey" button
- 🌸 Floating yoga-themed elements
- 📱 Fully responsive design

## 🧪 Testing

### Test Webcam Mode:
```bash
npm run dev
# Opens http://localhost:5173
# Uses your regular webcam
```

### Test Kinect Mock Mode:
```bash
npm run dev              # Terminal 1
npm run electron:start   # Terminal 2
```
App shows "⚠️ Mock Mode" - displays simulated skeleton

### Test Real Kinect:
After installing prerequisites:
```powershell
.\start-electron.ps1
```
App shows "✅ Kinect Ready"

## 📊 Architecture

```
┌─────────────────────────────────────┐
│         React UI (Renderer)         │
│  ┌───────────────────────────────┐ │
│  │  App.jsx (Auto-detect mode)   │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│    ┌─────────┴────────┐            │
│    │                   │            │
│ poseyoga.js    poseyoga_kinect.js  │
│ (Webcam)         (Kinect)           │
└──────────────────────┬──────────────┘
                       │
            ┌──────────┴──────────┐
            │  preload.js (IPC)   │
            └──────────┬──────────┘
                       │
┌──────────────────────┴──────────────┐
│      Electron Main Process          │
│  ┌────────────────────────────────┐ │
│  │       kinectService.js         │ │
│  │  ┌──────────┬──────────────┐  │ │
│  │  │ Kinect2  │ Mock Service │  │ │
│  │  │ (Real)   │ (Fallback)   │  │ │
│  │  └──────────┴──────────────┘  │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 💡 Tips

1. **Development**: Use `npm run dev` for React changes (hot reload works!)
2. **Electron Dev**: Use PowerShell script for easiest setup
3. **Mock Mode**: Perfect for UI testing without Kinect hardware
4. **Real Kinect**: Requires USB 3.0 port - USB 2.0 won't work
5. **Debugging**: Check Electron DevTools (opens automatically in dev mode)

## 🐛 Common Issues

**"kinect2 not found"**
→ Running in mock mode - this is normal until you install prerequisites

**"Electron won't start"**
→ Make sure Vite dev server is running first (`npm run dev`)

**"Kinect not detected"**
→ Check USB 3.0 connection, install Kinect SDK 2.0, restart PC

## 📚 Next Steps

1. **Try it now**: `npm run dev` for webcam mode
2. **Test Electron**: `.\start-electron.ps1` for mock Kinect
3. **Full Kinect**: Follow `KINECT_SETUP.md` for real hardware
4. **Customize**: Modify yoga poses in `poseyoga_kinect.js`

---

**Ready to practice! 🧘‍♀️✨**
