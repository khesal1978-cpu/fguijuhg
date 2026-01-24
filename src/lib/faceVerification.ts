import * as faceapi from 'face-api.js';

// Face verification utilities using face-api.js
// No external API required - all client-side processing

let modelsLoaded = false;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face models loaded successfully');
  } catch (error) {
    console.error('Failed to load face models:', error);
    throw new Error('Failed to load face detection models');
  }
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

// Detect face and get landmarks
export async function detectFace(
  video: HTMLVideoElement
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | null> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();
  
  return detection || null;
}

// Get face descriptor (embedding) for matching
export async function getFaceDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection?.descriptor || null;
}

// Compare two face descriptors
export function compareFaces(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

// Check if faces match (threshold-based)
export function facesMatch(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.5
): boolean {
  const distance = compareFaces(descriptor1, descriptor2);
  return distance < threshold;
}

// Convert descriptor to storable format
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

// Convert stored array back to descriptor
export function arrayToDescriptor(array: number[]): Float32Array {
  return new Float32Array(array);
}

// Encrypt face template for storage (simple XOR encryption - use proper encryption in production)
export async function encryptFaceTemplate(
  descriptor: Float32Array,
  key: string
): Promise<string> {
  const array = descriptorToArray(descriptor);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  
  // Simple encryption for demo - use AES in production
  const encrypted = array.map((val, idx) => {
    const keyByte = keyData[idx % keyData.length];
    return val + (keyByte / 255);
  });
  
  return btoa(JSON.stringify(encrypted));
}

// Decrypt face template
export async function decryptFaceTemplate(
  encryptedData: string,
  key: string
): Promise<Float32Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  
  const encrypted = JSON.parse(atob(encryptedData)) as number[];
  
  const decrypted = encrypted.map((val, idx) => {
    const keyByte = keyData[idx % keyData.length];
    return val - (keyByte / 255);
  });
  
  return new Float32Array(decrypted);
}

// Liveness detection state
interface LivenessState {
  blinkCount: number;
  leftEyeHistory: number[];
  rightEyeHistory: number[];
  headMovements: { x: number; y: number }[];
  lastCheck: number;
}

export function createLivenessState(): LivenessState {
  return {
    blinkCount: 0,
    leftEyeHistory: [],
    rightEyeHistory: [],
    headMovements: [],
    lastCheck: Date.now(),
  };
}

// Calculate Eye Aspect Ratio (EAR) for blink detection - improved algorithm
function calculateEAR(eyeLandmarks: faceapi.Point[]): number {
  // Eye landmarks order: 0=inner, 1=upper1, 2=upper2, 3=outer, 4=lower2, 5=lower1
  // Vertical distances
  const v1 = Math.sqrt(
    Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) +
    Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2)
  );
  const v2 = Math.sqrt(
    Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) +
    Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2)
  );
  // Horizontal distance
  const h = Math.sqrt(
    Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) +
    Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2)
  );
  
  // Avoid division by zero
  if (h === 0) return 0.3;
  
  return (v1 + v2) / (2.0 * h);
}

// Movement direction for visual guides
export type MovementDirection = 'none' | 'left' | 'right' | 'up' | 'down' | 'complete';

// Enhanced liveness result
export interface LivenessResult {
  passed: boolean;
  message: string;
  blinkCount: number;
  movementDirection: MovementDirection;
  movementProgress: number;
}

// Check liveness based on landmarks - improved version
export function checkLiveness(
  landmarks: faceapi.FaceLandmarks68,
  state: LivenessState
): LivenessResult {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;
  
  // Track eye state history
  state.leftEyeHistory.push(avgEAR);
  state.rightEyeHistory.push(avgEAR);
  
  // Keep only last 20 frames for faster response
  if (state.leftEyeHistory.length > 20) {
    state.leftEyeHistory.shift();
    state.rightEyeHistory.shift();
  }
  
  // Improved blink detection with adaptive threshold
  const EAR_OPEN_THRESHOLD = 0.25; // Eyes open
  const EAR_CLOSED_THRESHOLD = 0.18; // Eyes closed
  
  if (state.leftEyeHistory.length >= 4) {
    const history = state.leftEyeHistory;
    const len = history.length;
    
    // Check for blink pattern: open -> closed -> open
    const wasOpen = history[len - 4] > EAR_OPEN_THRESHOLD;
    const wentClosed = history[len - 3] < EAR_CLOSED_THRESHOLD || history[len - 2] < EAR_CLOSED_THRESHOLD;
    const isOpen = history[len - 1] > EAR_OPEN_THRESHOLD;
    
    if (wasOpen && wentClosed && isOpen) {
      // Prevent counting same blink twice
      const timeSinceLastBlink = Date.now() - state.lastCheck;
      if (timeSinceLastBlink > 300) { // 300ms minimum between blinks
        state.blinkCount++;
        state.lastCheck = Date.now();
      }
    }
  }
  
  // Track head movement with nose position
  const nosePos = { x: nose[3].x, y: nose[3].y };
  state.headMovements.push(nosePos);
  
  if (state.headMovements.length > 30) {
    state.headMovements.shift();
  }
  
  // Calculate movement ranges
  let xRange = 0;
  let yRange = 0;
  let movementDirection: MovementDirection = 'none';
  let movementProgress = 0;
  
  if (state.headMovements.length > 5) {
    const xValues = state.headMovements.map(p => p.x);
    const yValues = state.headMovements.map(p => p.y);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    xRange = maxX - minX;
    yRange = maxY - minY;
    
    const currentX = nosePos.x;
    const currentY = nosePos.y;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const MOVEMENT_THRESHOLD = 25; // Pixels needed for movement
    
    // Determine which direction to guide user
    if (xRange < MOVEMENT_THRESHOLD) {
      // Need more horizontal movement
      if (currentX <= centerX) {
        movementDirection = 'right';
      } else {
        movementDirection = 'left';
      }
      movementProgress = Math.min((xRange / MOVEMENT_THRESHOLD) * 100, 100);
    } else if (yRange < MOVEMENT_THRESHOLD * 0.5) {
      // Horizontal done, check vertical
      if (currentY <= centerY) {
        movementDirection = 'down';
      } else {
        movementDirection = 'up';
      }
      movementProgress = Math.min(((xRange + yRange) / (MOVEMENT_THRESHOLD * 1.5)) * 100, 100);
    } else {
      movementDirection = 'complete';
      movementProgress = 100;
    }
  }
  
  // Liveness criteria
  const hasEnoughBlinks = state.blinkCount >= 2;
  const hasHeadMovement = xRange > 20 || yRange > 15;
  
  if (hasEnoughBlinks && hasHeadMovement) {
    return { 
      passed: true, 
      message: 'Liveness verified!', 
      blinkCount: state.blinkCount,
      movementDirection: 'complete',
      movementProgress: 100
    };
  }
  
  if (!hasEnoughBlinks) {
    return { 
      passed: false, 
      message: `Blink naturally (${state.blinkCount}/2)`, 
      blinkCount: state.blinkCount,
      movementDirection,
      movementProgress
    };
  }
  
  return { 
    passed: false, 
    message: 'Move your head as shown', 
    blinkCount: state.blinkCount,
    movementDirection,
    movementProgress
  };
}
