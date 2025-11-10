// main.js - Electron main process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const kinectService = require('./kinectService');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/vite.svg'),
    title: 'PoseYoga - Kinect Edition'
  });

  // Load the app
  // In development: load from Vite dev server
  // In production: load from built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    // Clean up Kinect when window closes
    if (kinectService.isActive()) {
      kinectService.stop();
    }
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (kinectService.isActive()) {
    kinectService.stop();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ========== IPC Handlers ==========

// Start Kinect sensor
ipcMain.on('kinect:start', async (event) => {
  console.log('📡 Starting Kinect sensor...');
  
  // Set up callbacks
  kinectService.onBodyFrame((bodyData) => {
    if (bodyData && mainWindow) {
      mainWindow.webContents.send('kinect:bodyFrame', bodyData);
    }
  });

  kinectService.onStatus((status) => {
    if (mainWindow) {
      mainWindow.webContents.send('kinect:status', status);
    }
  });

  // Start the sensor
  const success = await kinectService.start();
  
  if (!success) {
    console.error('Failed to start Kinect');
  }
});

// Stop Kinect sensor
ipcMain.on('kinect:stop', () => {
  console.log('🛑 Stopping Kinect sensor...');
  kinectService.stop();
});

// Handle app quit
app.on('before-quit', () => {
  if (kinectService.isActive()) {
    kinectService.stop();
  }
});
