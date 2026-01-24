import * as faceapi from 'face-api.js';

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

export async function detectFace(
  video: HTMLVideoElement
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> | null> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
    .withFaceLandmarks();
  
  return detection || null;
}

export async function getFaceDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection?.descriptor || null;
}

export function compareFaces(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

export function facesMatch(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.5
): boolean {
  const distance = compareFaces(descriptor1, descriptor2);
  return distance < threshold;
}

export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

export function arrayToDescriptor(array: number[]): Float32Array {
  return new Float32Array(array);
}

export async function encryptFaceTemplate(
  descriptor: Float32Array,
  key: string
): Promise<string> {
  const array = descriptorToArray(descriptor);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  
  const encrypted = array.map((val, idx) => {
    const keyByte = keyData[idx % keyData.length];
    return val + (keyByte / 255);
  });
  
  return btoa(JSON.stringify(encrypted));
}

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

// Liveness detection state with improved tracking
interface LivenessState {
  blinkCount: number;
  earHistory: number[];
  lastBlinkTime: number;
  eyeWasOpen: boolean;
  eyeWentClosed: boolean;
  // Persistent movement tracking - doesn't reset
  movementMinX: number;
  movementMaxX: number;
  movementMinY: number;
  movementMaxY: number;
  movementDone: boolean;
  recentPositions: { x: number; y: number }[];
}

export function createLivenessState(): LivenessState {
  return {
    blinkCount: 0,
    earHistory: [],
    lastBlinkTime: 0,
    eyeWasOpen: false,
    eyeWentClosed: false,
    movementMinX: Infinity,
    movementMaxX: -Infinity,
    movementMinY: Infinity,
    movementMaxY: -Infinity,
    movementDone: false,
    recentPositions: [],
  };
}

// Calculate Eye Aspect Ratio (EAR) - simplified and more reliable
function calculateEAR(eyeLandmarks: faceapi.Point[]): number {
  // Vertical distances (between upper and lower eyelid)
  const v1 = Math.abs(eyeLandmarks[1].y - eyeLandmarks[5].y);
  const v2 = Math.abs(eyeLandmarks[2].y - eyeLandmarks[4].y);
  // Horizontal distance (eye width)
  const h = Math.abs(eyeLandmarks[0].x - eyeLandmarks[3].x);
  
  if (h === 0) return 0.3;
  
  return (v1 + v2) / (2.0 * h);
}

export type MovementDirection = 'none' | 'left' | 'right' | 'up' | 'down' | 'complete';

export interface LivenessResult {
  passed: boolean;
  message: string;
  blinkCount: number;
  movementDirection: MovementDirection;
  movementProgress: number;
}

// Improved liveness check with better blink detection
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
  
  // More forgiving thresholds for blink detection
  const EAR_OPEN = 0.22;   // Eyes considered open
  const EAR_CLOSED = 0.16; // Eyes considered closed
  
  // Simple state machine for blink detection
  const now = Date.now();
  
  // Track blinks with state machine: OPEN -> CLOSED -> OPEN = 1 blink
  if (avgEAR > EAR_OPEN) {
    if (state.eyeWentClosed && (now - state.lastBlinkTime) > 200) {
      // Completed a blink cycle
      state.blinkCount++;
      state.lastBlinkTime = now;
      console.log('Blink detected! Count:', state.blinkCount, 'EAR:', avgEAR);
    }
    state.eyeWasOpen = true;
    state.eyeWentClosed = false;
  } else if (avgEAR < EAR_CLOSED && state.eyeWasOpen) {
    state.eyeWentClosed = true;
  }
  
  // Track head movement with nose position - persistent min/max tracking
  const nosePos = { x: nose[3].x, y: nose[3].y };
  
  // Update min/max for entire session (doesn't reset)
  if (!state.movementDone) {
    state.movementMinX = Math.min(state.movementMinX, nosePos.x);
    state.movementMaxX = Math.max(state.movementMaxX, nosePos.x);
    state.movementMinY = Math.min(state.movementMinY, nosePos.y);
    state.movementMaxY = Math.max(state.movementMaxY, nosePos.y);
  }
  
  // Keep recent positions for direction guidance
  state.recentPositions.push(nosePos);
  if (state.recentPositions.length > 10) {
    state.recentPositions.shift();
  }
  
  // Calculate total movement range
  const xRange = state.movementMaxX === -Infinity ? 0 : state.movementMaxX - state.movementMinX;
  const yRange = state.movementMaxY === -Infinity ? 0 : state.movementMaxY - state.movementMinY;
  
  const X_THRESHOLD = 30; // Pixels needed for horizontal movement
  const Y_THRESHOLD = 20; // Pixels needed for vertical movement
  
  let movementDirection: MovementDirection = 'none';
  let movementProgress = 0;
  
  // Calculate center from accumulated range
  const centerX = state.movementMinX === Infinity ? nosePos.x : (state.movementMinX + state.movementMaxX) / 2;
  const centerY = state.movementMinY === Infinity ? nosePos.y : (state.movementMinY + state.movementMaxY) / 2;
  
  // Determine guidance direction based on what's still needed
  if (xRange >= X_THRESHOLD && yRange >= Y_THRESHOLD) {
    movementDirection = 'complete';
    movementProgress = 100;
    state.movementDone = true;
  } else if (xRange < X_THRESHOLD) {
    // Need more horizontal - guide user to opposite side of where they've been most
    movementProgress = (xRange / X_THRESHOLD) * 50;
    movementDirection = nosePos.x > centerX ? 'left' : 'right';
  } else {
    // Horizontal done, need vertical
    movementProgress = 50 + (yRange / Y_THRESHOLD) * 50;
    movementDirection = nosePos.y > centerY ? 'up' : 'down';
  }
  
  // Check if liveness is verified
  const hasEnoughBlinks = state.blinkCount >= 2;
  const hasEnoughMovement = state.movementDone || (xRange >= X_THRESHOLD && yRange >= Y_THRESHOLD);
  
  if (hasEnoughBlinks && hasEnoughMovement) {
    return { 
      passed: true, 
      message: 'Verified!', 
      blinkCount: state.blinkCount,
      movementDirection: 'complete',
      movementProgress: 100
    };
  }
  
  // Generate helpful message
  let message = '';
  if (!hasEnoughBlinks) {
    message = `Blink your eyes (${state.blinkCount}/2)`;
  } else if (!hasEnoughMovement) {
    const dir = movementDirection === 'left' ? '← Left' : 
                movementDirection === 'right' ? 'Right →' :
                movementDirection === 'up' ? '↑ Up' : '↓ Down';
    message = `Turn head: ${dir}`;
  }
  
  return { 
    passed: false, 
    message, 
    blinkCount: state.blinkCount,
    movementDirection,
    movementProgress
  };
}
