import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, CheckCircle2, AlertCircle, Eye, Move, Sparkles, RefreshCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  loadFaceModels,
  detectFace,
  getFaceDescriptor,
  checkLiveness,
  createLivenessState,
  type MovementDirection,
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
  const [movementDirection, setMovementDirection] = useState<MovementDirection>('none');
  const [movementComplete, setMovementComplete] = useState(false);

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
            width: { ideal: 320 }, 
            height: { ideal: 240 },
            frameRate: { ideal: 15 }
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

  // Face detection loop - optimized
  const startDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStage('detecting');
    setMessage('Looking for your face...');
    livenessStateRef.current = createLivenessState();

    let shouldStop = false;
    const DETECTION_INTERVAL = 200; // 200ms between detections for better performance

    const detect = async () => {
      if (!videoRef.current || shouldStop) return;

      const now = Date.now();
      
      if (now - lastDetectionRef.current < DETECTION_INTERVAL) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      lastDetectionRef.current = now;

      try {
        const detection = await detectFace(videoRef.current);

        if (detection) {
          setFaceDetected(true);

          if (stage === 'detecting') {
            setStage('liveness');
          }

          // Check liveness
          const livenessResult = checkLiveness(
            detection.landmarks,
            livenessStateRef.current
          );
          
          setBlinkCount(livenessResult.blinkCount);
          setMovementDirection(livenessResult.movementDirection);
          setMovementComplete(livenessResult.movementDirection === 'complete');
          setMessage(livenessResult.message);
          setProgress(livenessResult.movementProgress);

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
          setMessage('Position face in oval');
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
    setMovementDirection('none');
    setMovementComplete(false);
    setStage('ready');
    setMessage('Position your face in the oval');
  };

  const DirectionArrow = ({ direction, active }: { direction: MovementDirection; active: boolean }) => {
    const Icon = direction === 'left' ? ArrowLeft : 
                 direction === 'right' ? ArrowRight :
                 direction === 'up' ? ArrowUp : ArrowDown;
    
    const positionClass = direction === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
                          direction === 'right' ? 'right-2 top-1/2 -translate-y-1/2' :
                          direction === 'up' ? 'top-8 left-1/2 -translate-x-1/2' :
                          'bottom-20 left-1/2 -translate-x-1/2';

    return (
      <motion.div
        className={`absolute ${positionClass} z-10`}
        animate={active ? {
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
        } : { scale: 1, opacity: 0.2 }}
        transition={{ repeat: active ? Infinity : 0, duration: 0.6 }}
      >
        <div className={`p-3 rounded-full ${active ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-muted/30'}`}>
          <Icon className={`size-6 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera View */}
      <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-xl">
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
              className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center gap-4 z-20"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto size-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{message}</p>
                <Progress value={loadingProgress} className="w-28 h-1 mt-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Direction Arrows - only show during liveness check */}
        {(stage === 'liveness' || stage === 'detecting') && !movementComplete && blinkCount >= 2 && (
          <>
            <DirectionArrow direction="left" active={movementDirection === 'left'} />
            <DirectionArrow direction="right" active={movementDirection === 'right'} />
            <DirectionArrow direction="up" active={movementDirection === 'up'} />
            <DirectionArrow direction="down" active={movementDirection === 'down'} />
          </>
        )}

        {/* Face Guide Overlay */}
        {stage !== 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {/* Oval guide */}
              <div
                className={`w-36 h-48 border-4 rounded-[50%] transition-all duration-300 ${
                  faceDetected 
                    ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]' 
                    : 'border-white/50'
                }`}
              />
              {/* Corner markers */}
              <div className={`absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 rounded-tl-lg transition-colors ${faceDetected ? 'border-green-400' : 'border-primary'}`} />
              <div className={`absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 rounded-tr-lg transition-colors ${faceDetected ? 'border-green-400' : 'border-primary'}`} />
              <div className={`absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 rounded-bl-lg transition-colors ${faceDetected ? 'border-green-400' : 'border-primary'}`} />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 rounded-br-lg transition-colors ${faceDetected ? 'border-green-400' : 'border-primary'}`} />
            </motion.div>
          </div>
        )}

        {/* Status Message */}
        {stage !== 'loading' && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-2 left-2 right-2"
          >
            <div className={`rounded-lg px-3 py-2 backdrop-blur-md flex items-center gap-2 text-white ${
              stage === 'complete' ? 'bg-green-500/80' : 
              stage === 'error' ? 'bg-destructive/80' : 'bg-black/50'
            }`}>
              {stage === 'ready' && <Camera className="size-4 shrink-0" />}
              {(stage === 'detecting' || stage === 'liveness' || stage === 'capturing') && (
                <Loader2 className="size-4 animate-spin shrink-0" />
              )}
              {stage === 'complete' && <CheckCircle2 className="size-4 shrink-0" />}
              {stage === 'error' && <AlertCircle className="size-4 shrink-0" />}
              <span className="text-xs font-medium truncate">{message}</span>
            </div>
          </motion.div>
        )}

        {/* Progress & Status Badges */}
        <AnimatePresence>
          {(stage === 'liveness' || stage === 'detecting' || stage === 'capturing') && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="absolute bottom-2 left-2 right-2 space-y-2"
            >
              {/* Progress bar */}
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((blinkCount / 2) * 50 + progress / 2, 100)}%` }}
                />
              </div>
              
              {/* Status badges */}
              <div className="flex justify-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                  blinkCount >= 2 ? 'bg-green-500 text-white' : 'bg-white/80 text-foreground'
                }`}>
                  <Eye className="size-3" />
                  <span>{blinkCount}/2</span>
                  {blinkCount >= 2 && <CheckCircle2 className="size-3" />}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                  movementComplete ? 'bg-green-500 text-white' : 'bg-white/80 text-foreground'
                }`}>
                  <Move className="size-3" />
                  <span>{movementComplete ? 'Done' : 'Move'}</span>
                  {movementComplete && <CheckCircle2 className="size-3" />}
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
              className="absolute inset-0 bg-green-500/30 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <CheckCircle2 className="size-16 text-green-500 drop-shadow-lg" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {stage === 'ready' && (
          <Button onClick={handleStart} size="lg" className="gap-2">
            <Camera className="size-4" />
            Start Verification
          </Button>
        )}
        
        {(stage === 'detecting' || stage === 'liveness' || stage === 'error') && (
          <Button onClick={handleRetry} variant="outline" size="lg" className="gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        )}
      </div>

      {/* Instructions */}
      {stage === 'liveness' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground max-w-xs"
        >
          {blinkCount < 2 ? (
            <p>Blink your eyes naturally twice</p>
          ) : (
            <p>Follow the arrow and turn your head</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
