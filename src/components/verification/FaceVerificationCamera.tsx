import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, CheckCircle2, AlertCircle, Eye, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  loadFaceModels,
  detectFace,
  getFaceDescriptor,
  checkLiveness,
  createLivenessState,
  areModelsLoaded,
} from '@/lib/faceVerification';

interface FaceVerificationCameraProps {
  onVerificationComplete: (descriptor: Float32Array) => void;
  onError: (error: string) => void;
  mode: 'register' | 'verify';
  existingDescriptor?: Float32Array;
}

type VerificationStage = 'loading' | 'ready' | 'detecting' | 'liveness' | 'capturing' | 'complete' | 'error';

export function FaceVerificationCamera({
  onVerificationComplete,
  onError,
  mode,
  existingDescriptor,
}: FaceVerificationCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const livenessStateRef = useRef(createLivenessState());

  const [stage, setStage] = useState<VerificationStage>('loading');
  const [message, setMessage] = useState('Loading face detection models...');
  const [progress, setProgress] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  // Initialize camera and models
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Load models
        setMessage('Loading face detection models...');
        await loadFaceModels();
        if (!mounted) return;

        // Start camera
        setMessage('Starting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStage('ready');
        setMessage('Position your face in the frame');
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setStage('error');
          setMessage('Failed to initialize camera. Please allow camera access.');
          onError('Camera initialization failed');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onError]);

  // Face detection loop
  const startDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStage('detecting');
    setMessage('Looking for your face...');
    livenessStateRef.current = createLivenessState();

    let shouldStop = false;

    const detect = async () => {
      if (!videoRef.current || shouldStop) return;

      try {
        const detection = await detectFace(videoRef.current);

        if (detection) {
          setFaceDetected(true);

          // Draw face landmarks on canvas
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw face box
          const { x, y, width, height } = detection.detection.box;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Check liveness
          const livenessResult = checkLiveness(
            detection.landmarks,
            livenessStateRef.current
          );
          setBlinkCount(livenessResult.blinkCount);

          if (stage === 'detecting') {
            setStage('liveness');
          }

          setMessage(livenessResult.message);
          setProgress(Math.min((livenessResult.blinkCount / 2) * 100, 100));

          if (livenessResult.passed) {
            // Liveness passed, capture face descriptor
            setStage('capturing');
            setMessage('Capturing face template...');

            const descriptor = await getFaceDescriptor(videoRef.current);
            if (descriptor) {
              shouldStop = true;
              setStage('complete');
              setMessage('Verification complete!');
              onVerificationComplete(descriptor);
              return;
            } else {
              setMessage('Failed to capture face. Please try again.');
            }
          }
        } else {
          setFaceDetected(false);
          setMessage('No face detected. Please position your face in the frame.');

          // Clear canvas
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      if (!shouldStop) {
        animationRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  }, [stage, onVerificationComplete]);

  const handleStart = () => {
    startDetection();
  };

  const handleRetry = () => {
    livenessStateRef.current = createLivenessState();
    setBlinkCount(0);
    setProgress(0);
    setStage('ready');
    setMessage('Position your face in the frame');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera View */}
      <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
        />

        {/* Face Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-48 h-64 border-4 rounded-full transition-colors duration-300 ${
              faceDetected ? 'border-green-500' : 'border-white/50'
            }`}
          />
        </div>

        {/* Status Indicator */}
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 text-white text-sm">
              {stage === 'loading' && <Loader2 className="size-4 animate-spin" />}
              {stage === 'complete' && <CheckCircle2 className="size-4 text-green-500" />}
              {stage === 'error' && <AlertCircle className="size-4 text-red-500" />}
              {(stage === 'detecting' || stage === 'liveness') && (
                <Camera className="size-4 text-blue-500" />
              )}
              <span>{message}</span>
            </div>

            {/* Progress Bar */}
            {(stage === 'liveness' || stage === 'capturing') && (
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Liveness Indicators */}
        {(stage === 'liveness' || stage === 'detecting') && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                blinkCount >= 2 ? 'bg-green-500/80' : 'bg-white/20'
              }`}
            >
              <Eye className="size-4 text-white" />
              <span className="text-white text-xs">Blinks: {blinkCount}/2</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/20">
              <Move className="size-4 text-white" />
              <span className="text-white text-xs">Move head</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {stage === 'ready' && (
          <Button onClick={handleStart} className="gradient-primary">
            <Camera className="size-4 mr-2" />
            Start {mode === 'register' ? 'Registration' : 'Verification'}
          </Button>
        )}

        {(stage === 'detecting' || stage === 'liveness') && (
          <Button variant="outline" onClick={handleRetry}>
            Reset
          </Button>
        )}

        {stage === 'error' && (
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-sm">
        {stage === 'ready' && (
          <p>
            Look directly at the camera. You'll need to blink naturally and move
            your head slightly to verify you're a real person.
          </p>
        )}
        {(stage === 'detecting' || stage === 'liveness') && (
          <p>
            Keep looking at the camera. Blink naturally 2 times and move your
            head slightly to prove liveness.
          </p>
        )}
        {stage === 'complete' && (
          <p className="text-green-500">
            Face verification successful! Your biometric template has been
            securely captured.
          </p>
        )}
      </div>
    </div>
  );
}
