// preload.js - Exposes Kinect API to renderer process securely
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kinectAPI', {
  // Start Kinect sensor
  startKinect: () => ipcRenderer.send('kinect:start'),
  
  // Stop Kinect sensor
  stopKinect: () => ipcRenderer.send('kinect:stop'),
  
  // Listen for body frame data
  onBodyFrame: (callback) => {
    ipcRenderer.on('kinect:bodyFrame', (event, data) => callback(data));
  },
  
  // Listen for Kinect status updates
  onKinectStatus: (callback) => {
    ipcRenderer.on('kinect:status', (event, status) => callback(status));
  },
  
  // Remove listeners
  removeBodyFrameListener: () => {
    ipcRenderer.removeAllListeners('kinect:bodyFrame');
  },
  
  removeStatusListener: () => {
    ipcRenderer.removeAllListeners('kinect:status');
  }
});
