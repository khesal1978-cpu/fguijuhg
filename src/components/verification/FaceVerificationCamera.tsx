import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, CheckCircle2, AlertCircle, Eye, Move, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  loadFaceModels,
  detectFace,
  getFaceDescriptor,
  checkLiveness,
  createLivenessState,
} from '@/lib/faceVerification';

interface FaceVerificationCameraProps {
  onVerificationComplete: (descriptor: Float32Array) => void;
  onError: (error: string) => void;
  mode: 'register' | 'verify';
}

type VerificationStage = 'loading' | 'ready' | 'detecting' | 'liveness' | 'capturing' | 'complete' | 'error';

export function FaceVerificationCamera({
  onVerificationComplete,
  onError,
  mode,
}: FaceVerificationCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const livenessStateRef = useRef(createLivenessState());
  const lastDetectionRef = useRef<number>(0);

  const [stage, setStage] = useState<VerificationStage>('loading');
  const [message, setMessage] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Initialize camera and models
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setMessage('Loading AI models...');
        setLoadingProgress(20);
        
        await loadFaceModels();
        if (!mounted) return;
        
        setLoadingProgress(60);
        setMessage('Starting camera...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 480 }, 
            height: { ideal: 360 },
            frameRate: { ideal: 15 } // Lower framerate for performance
          },
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

        setLoadingProgress(100);
        setStage('ready');
        setMessage('Position your face in the oval');
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setStage('error');
          setMessage('Camera access required');
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

  // Face detection loop with throttling
  const startDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStage('detecting');
    setMessage('Looking for your face...');
    livenessStateRef.current = createLivenessState();

    let shouldStop = false;
    const DETECTION_INTERVAL = 150; // Only detect every 150ms for performance

    const detect = async () => {
      if (!videoRef.current || shouldStop) return;

      const now = Date.now();
      
      // Throttle detection
      if (now - lastDetectionRef.current < DETECTION_INTERVAL) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      lastDetectionRef.current = now;

      try {
        const detection = await detectFace(videoRef.current);

        if (detection) {
          setFaceDetected(true);

          // Draw face landmarks on canvas
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;
          const videoWidth = videoRef.current!.videoWidth;
          const videoHeight = videoRef.current!.videoHeight;
          
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw subtle face outline
          const { x, y, width, height } = detection.detection.box;
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, 8);
          ctx.stroke();

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
          setProgress(Math.min((livenessResult.blinkCount / 2) * 50 + (livenessStateRef.current.headMovements.length > 15 ? 50 : 0), 100));

          if (livenessResult.passed) {
            setStage('capturing');
            setMessage('Capturing...');

            const descriptor = await getFaceDescriptor(videoRef.current);
            if (descriptor) {
              shouldStop = true;
              setStage('complete');
              setMessage('Success!');
              onVerificationComplete(descriptor);
              return;
            } else {
              setMessage('Capture failed. Try again.');
            }
          }
        } else {
          setFaceDetected(false);
          setMessage('Move face into frame');

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
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    livenessStateRef.current = createLivenessState();
    setBlinkCount(0);
    setProgress(0);
    setFaceDetected(false);
    setStage('ready');
    setMessage('Position your face in the oval');
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera View */}
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted shadow-2xl shadow-primary/10">
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        
        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
        />

        {/* Loading overlay */}
        <AnimatePresence>
          {stage === 'loading' && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto size-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{message}</p>
                <Progress value={loadingProgress} className="w-32 h-1.5 mt-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face Guide Overlay */}
        {stage !== 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Oval guide */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div
                className={`w-44 h-56 border-[3px] rounded-[50%] transition-all duration-500 ${
                  faceDetected 
                    ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' 
                    : 'border-white/40'
                }`}
              />
              {/* Corner accents */}
              <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-xl transition-colors duration-300 ${faceDetected ? 'border-green-500' : 'border-primary'}`} />
              <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-xl transition-colors duration-300 ${faceDetected ? 'border-green-500' : 'border-primary'}`} />
              <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-xl transition-colors duration-300 ${faceDetected ? 'border-green-500' : 'border-primary'}`} />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-xl transition-colors duration-300 ${faceDetected ? 'border-green-500' : 'border-primary'}`} />
            </motion.div>
          </div>
        )}

        {/* Status Banner */}
        {stage !== 'loading' && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-3 left-3 right-3"
          >
            <div className={`rounded-xl px-3 py-2 backdrop-blur-md flex items-center gap-2 ${
              stage === 'complete' 
                ? 'bg-green-500/20 border border-green-500/30' 
                : stage === 'error'
                ? 'bg-destructive/20 border border-destructive/30'
                : 'bg-black/40'
            }`}>
              {stage === 'ready' && <Camera className="size-4 text-white shrink-0" />}
              {(stage === 'detecting' || stage === 'liveness' || stage === 'capturing') && (
                <Loader2 className="size-4 text-primary animate-spin shrink-0" />
              )}
              {stage === 'complete' && <CheckCircle2 className="size-4 text-green-500 shrink-0" />}
              {stage === 'error' && <AlertCircle className="size-4 text-destructive shrink-0" />}
              <span className="text-white text-xs font-medium truncate">{message}</span>
            </div>
          </motion.div>
        )}

        {/* Progress & Liveness Indicators */}
        <AnimatePresence>
          {(stage === 'liveness' || stage === 'detecting' || stage === 'capturing') && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-3 left-3 right-3 space-y-2"
            >
              {/* Progress bar */}
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {/* Liveness indicators */}
              <div className="flex justify-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    blinkCount >= 2 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-black/40 text-white/80 backdrop-blur-sm'
                  }`}
                >
                  <Eye className="size-3" />
                  <span>Blink {blinkCount}/2</span>
                  {blinkCount >= 2 && <CheckCircle2 className="size-3" />}
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    progress >= 50 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-black/40 text-white/80 backdrop-blur-sm'
                  }`}
                >
                  <Move className="size-3" />
                  <span>Move</span>
                  {progress >= 50 && <CheckCircle2 className="size-3" />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete overlay */}
        <AnimatePresence>
          {stage === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50"
              >
                <CheckCircle2 className="size-10 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        {stage === 'ready' && (
          <Button onClick={handleStart} className="flex-1 h-12 gradient-primary font-semibold text-base">
            <Camera className="size-5 mr-2" />
            Start {mode === 'register' ? 'Scan' : 'Verification'}
          </Button>
        )}

        {(stage === 'detecting' || stage === 'liveness' || stage === 'capturing') && (
          <Button variant="outline" onClick={handleRetry} className="flex-1 h-12">
            <RefreshCw className="size-4 mr-2" />
            Reset
          </Button>
        )}

        {stage === 'error' && (
          <Button onClick={() => window.location.reload()} className="flex-1 h-12">
            <RefreshCw className="size-4 mr-2" />
            Retry
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-xs px-4">
        {stage === 'ready' && (
          <p>Center your face in the oval frame, ensure good lighting.</p>
        )}
        {(stage === 'detecting' || stage === 'liveness') && (
          <p>Blink naturally 2 times and move your head slightly.</p>
        )}
        {stage === 'complete' && (
          <p className="text-green-500 font-medium">✓ Face verified successfully</p>
        )}
        {stage === 'error' && (
          <p className="text-destructive">Please allow camera access to continue.</p>
        )}
      </div>
    </div>
  );
}
