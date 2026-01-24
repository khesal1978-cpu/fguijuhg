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

// Calculate Eye Aspect Ratio (EAR) for blink detection
function calculateEAR(eyeLandmarks: faceapi.Point[]): number {
  // Eye landmarks: 0=outer, 1=upper-outer, 2=upper-inner, 3=inner, 4=lower-inner, 5=lower-outer
  const A = Math.sqrt(
    Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) +
    Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2)
  );
  const B = Math.sqrt(
    Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) +
    Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2)
  );
  const C = Math.sqrt(
    Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) +
    Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2)
  );
  
  return (A + B) / (2.0 * C);
}

// Check liveness based on landmarks
export function checkLiveness(
  landmarks: faceapi.FaceLandmarks68,
  state: LivenessState
): { passed: boolean; message: string; blinkCount: number } {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;
  
  // Track eye state history
  state.leftEyeHistory.push(leftEAR);
  state.rightEyeHistory.push(rightEAR);
  
  // Keep only last 30 frames
  if (state.leftEyeHistory.length > 30) {
    state.leftEyeHistory.shift();
    state.rightEyeHistory.shift();
  }
  
  // Detect blink (EAR drops below threshold)
  const EAR_THRESHOLD = 0.21;
  const BLINK_FRAMES = 3;
  
  if (state.leftEyeHistory.length >= BLINK_FRAMES) {
    const recent = state.leftEyeHistory.slice(-BLINK_FRAMES);
    const wasOpen = state.leftEyeHistory[state.leftEyeHistory.length - BLINK_FRAMES - 1] > EAR_THRESHOLD;
    const isClosed = recent.every(ear => ear < EAR_THRESHOLD);
    
    if (wasOpen && isClosed) {
      state.blinkCount++;
    }
  }
  
  // Track head movement
  const nosePos = { x: nose[3].x, y: nose[3].y };
  state.headMovements.push(nosePos);
  
  if (state.headMovements.length > 60) {
    state.headMovements.shift();
  }
  
  // Calculate head movement range
  let headMovementRange = 0;
  if (state.headMovements.length > 10) {
    const xValues = state.headMovements.map(p => p.x);
    const yValues = state.headMovements.map(p => p.y);
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);
    headMovementRange = Math.max(xRange, yRange);
  }
  
  // Liveness criteria
  const hasEnoughBlinks = state.blinkCount >= 2;
  const hasHeadMovement = headMovementRange > 15;
  
  if (hasEnoughBlinks && hasHeadMovement) {
    return { passed: true, message: 'Liveness verified!', blinkCount: state.blinkCount };
  }
  
  if (!hasEnoughBlinks) {
    return { passed: false, message: `Please blink naturally (${state.blinkCount}/2)`, blinkCount: state.blinkCount };
  }
  
  return { passed: false, message: 'Please move your head slightly', blinkCount: state.blinkCount };
}
