// kinectService.js - Handles Kinect v2 sensor communication
// NOTE: This requires Visual Studio Build Tools and Kinect SDK 2.0 installed
// Install separately: npm install kinect2 (after VS Build Tools are installed)

class KinectService {
  constructor() {
    this.kinect = null;
    this.isRunning = false;
    this.onBodyFrameCallback = null;
    this.onStatusCallback = null;
  }

  /**
   * Initialize Kinect sensor
   * @returns {boolean} Success status
   */
  async start() {
    try {
      // Dynamic import to prevent errors if kinect2 is not installed
      const Kinect2 = require('kinect2');
      
      if (!Kinect2) {
        throw new Error('Kinect2 module not found. Please install: npm install kinect2');
      }

      this.kinect = new Kinect2();

      if (!this.kinect.open()) {
        throw new Error('Failed to open Kinect sensor. Make sure it is connected.');
      }

      // Open body reader for skeleton tracking
      this.kinect.openBodyReader();
      
      // Listen for body frames
      this.kinect.on('bodyFrame', (bodyFrame) => {
        if (this.onBodyFrameCallback) {
          const processedData = this.processBodyFrame(bodyFrame);
          this.onBodyFrameCallback(processedData);
        }
      });

      this.isRunning = true;
      
      if (this.onStatusCallback) {
        this.onStatusCallback({ connected: true, message: 'Kinect v2 started successfully' });
      }

      console.log('✅ Kinect v2 sensor started');
      return true;

    } catch (error) {
      console.error('❌ Failed to start Kinect:', error.message);
      
      if (this.onStatusCallback) {
        this.onStatusCallback({ 
          connected: false, 
          message: error.message,
          error: error.message 
        });
      }
      
      return false;
    }
  }

  /**
   * Stop Kinect sensor
   */
  stop() {
    if (this.kinect && this.isRunning) {
      try {
        this.kinect.closeBodyReader();
        this.kinect.close();
        this.isRunning = false;
        
        if (this.onStatusCallback) {
          this.onStatusCallback({ connected: false, message: 'Kinect stopped' });
        }
        
        console.log('🛑 Kinect sensor stopped');
      } catch (error) {
        console.error('Error stopping Kinect:', error);
      }
    }
  }

  /**
   * Process body frame data from Kinect
   * Converts Kinect skeleton format to a format compatible with the pose tracking
   */
  processBodyFrame(bodyFrame) {
    if (!bodyFrame || !bodyFrame.bodies) {
      return null;
    }

    // Find the first tracked body
    const trackedBody = bodyFrame.bodies.find(body => body.tracked);
    
    if (!trackedBody) {
      return null;
    }

    // Extract joint data
    const joints = this.extractJoints(trackedBody.joints);
    
    return {
      timestamp: Date.now(),
      tracked: true,
      joints: joints,
      handStates: {
        left: trackedBody.leftHandState,
        right: trackedBody.rightHandState
      }
    };
  }

  /**
   * Extract and normalize joint positions
   * Maps Kinect joint names to our pose tracking format
   */
  extractJoints(kinectJoints) {
    const jointMap = {
      // Kinect v2 Joint indices
      SpineShoulder: 20,
      ShoulderLeft: 4,
      ShoulderRight: 8,
      ElbowLeft: 5,
      ElbowRight: 9,
      WristLeft: 6,
      WristRight: 10,
      HandLeft: 7,
      HandRight: 11,
      HipLeft: 12,
      HipRight: 16,
      KneeLeft: 13,
      KneeRight: 17,
      AnkleLeft: 14,
      AnkleRight: 18,
      SpineBase: 0,
      SpineMid: 1,
      Neck: 2,
      Head: 3
    };

    const joints = {};

    for (const [name, index] of Object.entries(jointMap)) {
      const joint = kinectJoints[index];
      if (joint) {
        joints[name] = {
          x: joint.cameraX,
          y: joint.cameraY,
          z: joint.cameraZ,
          depthX: joint.depthX,
          depthY: joint.depthY,
          colorX: joint.colorX,
          colorY: joint.colorY,
          trackingState: joint.trackingState // 0=NotTracked, 1=Inferred, 2=Tracked
        };
      }
    }

    return joints;
  }

  /**
   * Set callback for body frame updates
   */
  onBodyFrame(callback) {
    this.onBodyFrameCallback = callback;
  }

  /**
   * Set callback for status updates
   */
  onStatus(callback) {
    this.onStatusCallback = callback;
  }

  /**
   * Check if Kinect is running
   */
  isActive() {
    return this.isRunning;
  }
}

// Fallback mock service if Kinect is not available
class MockKinectService extends KinectService {
  async start() {
    console.warn('⚠️  Running in MOCK mode - Kinect2 not installed');
    console.warn('To use real Kinect:');
    console.warn('1. Install Visual Studio with "Desktop development with C++"');
    console.warn('2. Install Kinect SDK 2.0');
    console.warn('3. Run: npm install kinect2');
    
    this.isRunning = true;
    
    if (this.onStatusCallback) {
      this.onStatusCallback({ 
        connected: false, 
        message: 'Running in MOCK mode - Kinect2 not installed',
        isMock: true 
      });
    }

    // Simulate body frames for testing
    this.mockInterval = setInterval(() => {
      if (this.onBodyFrameCallback) {
        this.onBodyFrameCallback(this.generateMockBodyFrame());
      }
    }, 33); // ~30fps

    return true;
  }

  stop() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    this.isRunning = false;
    
    if (this.onStatusCallback) {
      this.onStatusCallback({ connected: false, message: 'Mock Kinect stopped' });
    }
  }

  generateMockBodyFrame() {
    // Generate mock skeleton data for testing
    return {
      timestamp: Date.now(),
      tracked: true,
      joints: {
        Head: { x: 0, y: 0.3, z: 2, trackingState: 2 },
        Neck: { x: 0, y: 0.1, z: 2, trackingState: 2 },
        SpineShoulder: { x: 0, y: 0, z: 2, trackingState: 2 },
        ShoulderLeft: { x: -0.3, y: 0, z: 2, trackingState: 2 },
        ShoulderRight: { x: 0.3, y: 0, z: 2, trackingState: 2 },
        ElbowLeft: { x: -0.4, y: -0.3, z: 2, trackingState: 2 },
        ElbowRight: { x: 0.4, y: -0.3, z: 2, trackingState: 2 },
        WristLeft: { x: -0.4, y: -0.6, z: 2, trackingState: 2 },
        WristRight: { x: 0.4, y: -0.6, z: 2, trackingState: 2 },
        HipLeft: { x: -0.15, y: -0.5, z: 2, trackingState: 2 },
        HipRight: { x: 0.15, y: -0.5, z: 2, trackingState: 2 },
        KneeLeft: { x: -0.15, y: -0.9, z: 2, trackingState: 2 },
        KneeRight: { x: 0.15, y: -0.9, z: 2, trackingState: 2 },
        AnkleLeft: { x: -0.15, y: -1.2, z: 2, trackingState: 2 },
        AnkleRight: { x: 0.15, y: -1.2, z: 2, trackingState: 2 }
      },
      handStates: { left: 0, right: 0 }
    };
  }
}

// Try to use real Kinect, fall back to mock if not available
let ServiceClass = KinectService;
try {
  require.resolve('kinect2');
} catch (e) {
  ServiceClass = MockKinectService;
}

module.exports = new ServiceClass();
