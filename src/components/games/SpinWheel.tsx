import { useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import pingcasetLogo from "@/assets/pingcaset-logo.png";

interface SpinWheelProps {
  onSpin: () => Promise<{ success: boolean; reward?: number; error?: string }>;
  spinning: boolean;
  cost: number;
}

// Memoize the component to prevent unnecessary re-renders
// Backend: Unlucky/0 (35%), 10 (35%), 20 (20%), 50 (7%), 100 (3%), 500 (0%)
const SEGMENTS = [
  { value: 0, label: "X", color: ["#334155", "#1e293b"], isUnlucky: true },
  { value: 10, label: "10", color: ["#7c3aed", "#6d28d9"] },
  { value: 20, label: "20", color: ["#9333ea", "#7e22ce"] },
  { value: 50, label: "50", color: ["#f59e0b", "#d97706"] },
  { value: 0, label: "X", color: ["#475569", "#334155"], isUnlucky: true },
  { value: 100, label: "100", color: ["#10b981", "#059669"] },
  { value: 10, label: "10", color: ["#8b5cf6", "#7c3aed"] },
  { value: 500, label: "500", color: ["#ec4899", "#db2777"] },
];

// Map reward value to segment index
const getSegmentIndex = (reward: number): number => {
  if (reward === 0) {
    // Randomly choose between the two unlucky segments (0 and 4)
    return Math.random() < 0.5 ? 0 : 4;
  }
  
  // Find the segment that matches the reward value (excluding unlucky ones)
  const matchingSegments = SEGMENTS
    .map((s, i) => ({ ...s, index: i }))
    .filter(s => s.value === reward && !s.isUnlucky);
  
  if (matchingSegments.length > 0) {
    // If multiple segments have the same value, pick one randomly
    const randomMatch = matchingSegments[Math.floor(Math.random() * matchingSegments.length)];
    return randomMatch.index;
  }
  
  // Fallback: find any segment with the value
  const fallbackIndex = SEGMENTS.findIndex(s => s.value === reward);
  return fallbackIndex !== -1 ? fallbackIndex : 1;
};

export function SpinWheel({ onSpin, spinning, cost }: SpinWheelProps) {
  const { profile } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [isUnlucky, setIsUnlucky] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (isSpinning || spinning || (profile?.balance || 0) < cost) return;

    setShowResult(false);
    setResult(null);
    setIsUnlucky(false);
    setIsSpinning(true);

    const response = await onSpin();

    if (response.success && response.reward !== undefined) {
      const reward = response.reward;
      const segmentIndex = getSegmentIndex(reward);
      
      // Set unlucky state based on actual reward value
      setIsUnlucky(reward === 0);
      
      const numSegments = SEGMENTS.length;
      const segmentAngle = 360 / numSegments;
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.5);
      // The pointer is at the top (0°). Segments start at -90° in SVG.
      // To land segment N under the pointer: rotate so segment center aligns with top.
      // Segment center angle from top = (segmentIndex * segmentAngle) + (segmentAngle / 2)
      // We need to rotate the wheel so this angle is at 0° (top), meaning we rotate by -(that angle)
      // But CSS rotation is additive and clockwise, so we add full spins then position correctly.
      const segmentCenterAngle = segmentIndex * segmentAngle + segmentAngle / 2;
      const spins = 5 + Math.floor(Math.random() * 3);
      // Rotate clockwise: to bring segmentCenterAngle to top (where pointer is), we need to rotate by (360 - segmentCenterAngle)
      const newRotation = spins * 360 + (360 - segmentCenterAngle) + randomOffset;

      setRotation(newRotation);
      setResult(reward);

      setTimeout(() => {
        setShowResult(true);
        setIsSpinning(false);
      }, 3500);
    } else {
      setIsSpinning(false);
    }
  };

  const canSpin = (profile?.balance || 0) >= cost && !spinning && !isSpinning;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Wheel Container */}
      <div className="relative w-[260px] h-[260px]">
        {/* Outer Glow */}
        <div className="absolute inset-[-16px] rounded-full bg-gradient-to-r from-primary/20 via-violet-500/15 to-primary/20 blur-xl" />
        
        {/* Decorative Dots Ring */}
        <div className="absolute inset-[-6px] rounded-full">
          {[...Array(32)].map((_, i) => (
            <div
              key={i}
              className="absolute size-1.5 rounded-full bg-primary/50"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 11.25}deg) translateY(-136px) translateX(-50%)`,
              }}
            />
          ))}
        </div>

        {/* Main Wheel */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-card to-muted p-1.5 shadow-2xl border border-border/50">
          <motion.div
            ref={wheelRef}
            className="relative w-full h-full rounded-full overflow-hidden"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{ duration: 3.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((segment, i) => {
                const angle = 360 / SEGMENTS.length;
                const startAngle = i * angle - 90;
                const endAngle = startAngle + angle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);
                const largeArc = angle > 180 ? 1 : 0;

                const textAngle = startAngle + angle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const labelX = 100 + 70 * Math.cos(textRad);
                const labelY = 100 + 70 * Math.sin(textRad);

                return (
                  <g key={i}>
                    <defs>
                      <linearGradient id={`seg-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={segment.color[0]} />
                        <stop offset="100%" stopColor={segment.color[1]} />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={`url(#seg-grad-${i})`}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="0.5"
                    />
                    {/* Segment divider line */}
                    <line
                      x1="100"
                      y1="100"
                      x2={x1}
                      y2={y1}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    {/* Value Label */}
                    <text
                      x={labelX}
                      y={labelY}
                      fill="white"
                      fontSize={segment.isUnlucky ? "18" : segment.value >= 100 ? "14" : "16"}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${labelX}, ${labelY})`}
                      style={{ 
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)", 
                        fontFamily: "'Space Grotesk', sans-serif" 
                      }}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
              {/* Center circle with logo */}
              <circle cx="100" cy="100" r="28" fill="url(#center-grad)" />
              <defs>
                <radialGradient id="center-grad" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="hsl(262 83% 65%)" />
                  <stop offset="100%" stopColor="hsl(262 83% 35%)" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Center Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-primary/90 to-violet-700 flex items-center justify-center shadow-xl border-2 border-white/30 z-10 overflow-hidden">
            <motion.img
              src={pingcasetLogo}
              alt="PingCaset"
              className="w-10 h-10 object-cover rounded-full"
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
            />
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <svg viewBox="0 0 24 30" className="w-6 h-7 drop-shadow-lg">
            <defs>
              <linearGradient id="pointer-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <path d="M12 0 L22 22 L12 30 L2 22 Z" fill="url(#pointer-grad)" />
            <path d="M12 6 L18 20 L12 26 L6 20 Z" fill="white" opacity="0.2" />
          </svg>
        </div>

        {/* Result Popup */}
        <AnimatePresence>
          {showResult && result !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md rounded-full z-30"
            >
              <div className="text-center p-4">
                {isUnlucky ? (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="w-14 h-14 mx-auto mb-2 rounded-full bg-muted/50 flex items-center justify-center"
                    >
                      <span className="text-3xl">💀</span>
                    </motion.div>
                    <p className="text-xl font-display font-bold text-muted-foreground">Unlucky!</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Try again!</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="relative"
                    >
                      <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="size-8 text-primary" />
                      </div>
                      <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                      >
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute size-1.5 rounded-full bg-primary"
                            initial={{ x: 28, y: 28 }}
                            animate={{
                              x: 28 + Math.cos((i * 60 * Math.PI) / 180) * 35,
                              y: 28 + Math.sin((i * 60 * Math.PI) / 180) * 35,
                              opacity: [1, 0],
                            }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                    <p className="text-muted-foreground text-xs font-medium">You won!</p>
                    <p className="text-3xl font-display font-bold text-foreground">+{result}</p>
                    <p className="font-bold text-xs text-primary">CASET</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cost Display */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
        <Coins className="size-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">{cost} CASET per spin</span>
      </div>

      {/* Spin Button */}
      <Button
        onClick={handleSpin}
        disabled={!canSpin}
        size="lg"
        className="w-full max-w-[200px] h-12 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-bold text-base shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all"
      >
        {spinning || isSpinning ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Spinning...
          </>
        ) : (
          <>
            <Sparkles className="size-4 mr-2" />
            SPIN NOW
          </>
        )}
      </Button>

      {(profile?.balance || 0) < cost && !spinning && !isSpinning && (
        <motion.p 
          className="text-destructive text-xs font-medium flex items-center gap-1.5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Coins className="size-3" />
          Not enough coins to spin
        </motion.p>
      )}

      {showResult && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResult(false)}
          className="text-primary hover:text-primary/80 text-sm"
        >
          <Sparkles className="size-3.5 mr-1.5" />
          Spin Again
        </Button>
      )}
    </div>
  );
}
