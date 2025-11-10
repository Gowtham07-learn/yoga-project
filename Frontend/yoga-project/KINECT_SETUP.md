# 🎮 PoseYoga Kinect v2 Integration

This project now supports **Kinect v2 (Xbox One sensor)** for advanced skeleton tracking alongside the existing webcam mode!

## 📋 Prerequisites

Before using Kinect features, you need to install:

### 1. **Visual Studio Build Tools** (Required for kinect2 package)
   - Download: [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
   - During installation, select: **"Desktop development with C++"**
   - This includes:
     - MSVC compiler
     - Windows SDK
     - C++ CMake tools

### 2. **Kinect for Windows SDK 2.0**
   - Download: [Kinect SDK 2.0](https://www.microsoft.com/en-us/download/details.aspx?id=44561)
   - Install the full SDK (not just runtime)
   - Restart your computer after installation

### 3. **kinect2 npm package** (After above prerequisites)
   ```bash
   npm install kinect2 --save-dev
   ```

## 🚀 Running the Application

### **Option 1: Webcam Mode (No Kinect Required)**
Run the standard React development server:
```bash
npm run dev
```
Opens at `http://localhost:5173` - uses your webcam with MediaPipe

### **Option 2: Kinect Mode (Requires Kinect v2 Hardware)**

#### Development Mode:
```bash
npm run electron:dev
```
This will:
1. Start Vite dev server at `http://localhost:5173`
2. Launch Electron app with Kinect support
3. Enable hot-reload for React changes

#### Production Build:
```bash
npm run electron:build
```
Creates a standalone Windows executable in `dist/` folder

#### Quick Electron Start (Dev Server Must Be Running):
```bash
npm run electron:start
```

## 🎯 Features

### Kinect Mode Benefits:
- ✅ **3D Skeleton Tracking** - More accurate joint positions
- ✅ **Depth Sensing** - Better pose estimation
- ✅ **No Lighting Issues** - Works in various lighting conditions
- ✅ **Full Body Tracking** - Tracks all joints simultaneously
- ✅ **Mock Mode** - Test without Kinect hardware connected

### Webcam Mode Benefits:
- ✅ **No Special Hardware** - Works with any webcam
- ✅ **Browser-Based** - Run directly in browser
- ✅ **Cross-Platform** - Works on Windows, Mac, Linux
- ✅ **Easy Setup** - No SDK installation required

## 📁 Project Structure

```
yoga-project/
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # IPC bridge (secure communication)
│   └── kinectService.js     # Kinect v2 handler
├── src/
│   ├── App.jsx              # Auto-detects Kinect/Webcam mode
│   ├── poseyoga.js          # Original webcam version
│   └── poseyoga_kinect.js   # Kinect-enabled version
└── package.json             # Updated with Electron scripts
```

## 🔧 Troubleshooting

### "kinect2 not found" Error
**Solution:** Install Visual Studio Build Tools first, then:
```bash
npm install kinect2 --save-dev
```

### "Kinect sensor not detected"
**Solutions:**
1. Check USB 3.0 connection (Kinect v2 requires USB 3.0)
2. Verify Kinect SDK 2.0 is installed
3. Restart computer after SDK installation
4. Check Device Manager for Kinect devices

### "Mock Mode" Appears
The app runs in mock mode when:
- Kinect2 package is not installed (shows test skeleton data)
- Kinect sensor is not connected
- Use this to test the UI without hardware

### Electron Window Not Loading
**Solution:** Make sure Vite dev server is running first:
```bash
# Terminal 1
npm run dev

# Terminal 2 (after Vite starts)
npm run electron:start
```

## 🆚 Mode Comparison

| Feature | Webcam Mode | Kinect Mode |
|---------|-------------|-------------|
| Hardware | Any webcam | Kinect v2 |
| Setup | Easy | Moderate |
| Accuracy | Good | Excellent |
| Depth Data | ❌ | ✅ |
| 3D Tracking | ❌ | ✅ |
| Lighting | Sensitive | Robust |
| Platform | Any | Windows only |

## 📝 Development Notes

### Auto-Detection
The app automatically detects if `window.kinectAPI` exists:
- **Present** → Kinect mode (Electron)
- **Absent** → Webcam mode (Browser)

### IPC Communication
Kinect data flows through secure IPC:
1. `kinectService.js` reads Kinect sensor
2. Data sent via IPC to renderer process
3. `preload.js` exposes secure API to React
4. `poseyoga_kinect.js` receives and processes data

### Adding Kinect After Setup
If you set up the project without Kinect:
1. Install prerequisites above
2. Run: `npm install kinect2 --save-dev`
3. Restart Electron: `npm run electron:dev`

## 🎨 UI Changes in Kinect Mode

When running with Kinect:
- "Start Camera" button becomes "Start Kinect"
- Status shows "✅ Kinect Ready" or "⚠️ Mock Mode"
- Skeleton overlay matches Kinect joint positions
- More stable tracking in various poses

## 🚧 Known Limitations

1. **Kinect v2 only** - Kinect v1 (Xbox 360) not supported
2. **Windows only** - Kinect SDK 2.0 is Windows-specific
3. **USB 3.0 required** - Kinect v2 won't work on USB 2.0
4. **One sensor** - Tracks one person at a time

## 📞 Support

If you encounter issues:
1. Check this README's troubleshooting section
2. Verify all prerequisites are installed
3. Test in mock mode first
4. Check console logs for detailed errors

---

**Happy Yoga Practice! 🧘‍♀️**
