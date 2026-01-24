import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Coins, Skull, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SpinWheelProps {
  onSpin: () => Promise<{ success: boolean; reward?: number; error?: string }>;
  spinning: boolean;
  cost: number;
}

// 6 segments with vibrant colors
const SEGMENTS = [
  { value: 0, label: "💀", color: "from-slate-700 to-slate-800", isUnlucky: true },
  { value: 10, label: "10", color: "from-violet-600 to-violet-700" },
  { value: 20, label: "20", color: "from-purple-600 to-purple-700" },
  { value: 50, label: "50", color: "from-amber-500 to-amber-600" },
  { value: 100, label: "100", color: "from-emerald-500 to-emerald-600" },
  { value: 0, label: "💀", color: "from-slate-600 to-slate-700", isUnlucky: true },
];

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
      
      let segmentIndex: number;
      if (reward === 0) {
        segmentIndex = Math.random() < 0.5 ? 0 : 5;
        setIsUnlucky(true);
      } else {
        segmentIndex = SEGMENTS.findIndex((s) => s.value === reward && !s.isUnlucky);
        if (segmentIndex === -1) segmentIndex = 1;
      }
      
      const numSegments = SEGMENTS.length;
      const segmentAngle = 360 / numSegments;
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.7);
      const targetAngle = segmentIndex * segmentAngle + segmentAngle / 2;
      const spins = 5 + Math.floor(Math.random() * 3);
      const newRotation = rotation + spins * 360 + (360 - targetAngle) + randomOffset;

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
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div className="relative w-[280px] h-[280px]">
        {/* Outer Glow Animation */}
        <div className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-primary/30 via-violet-500/20 to-primary/30 blur-2xl animate-pulse-soft" />
        
        {/* Decorative Outer Ring with Dots */}
        <div className="absolute inset-[-8px] rounded-full border-4 border-primary/20">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute size-2 rounded-full bg-primary/60"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 15}deg) translateY(-148px) translateX(-50%)`,
              }}
            />
          ))}
        </div>

        {/* Main Wheel */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-card via-card to-muted p-2 shadow-2xl">
          <motion.div
            ref={wheelRef}
            className="relative w-full h-full rounded-full overflow-hidden shadow-inner"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{ duration: 3.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
              <defs>
                {SEGMENTS.map((_, i) => (
                  <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`[stop-color:theme(colors.${SEGMENTS[i].color.split(' ')[0].replace('from-', '')})]`} />
                    <stop offset="100%" className={`[stop-color:theme(colors.${SEGMENTS[i].color.split(' ')[1].replace('to-', '')})]`} />
                  </linearGradient>
                ))}
              </defs>
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
                const textX = 100 + 58 * Math.cos(textRad);
                const textY = 100 + 58 * Math.sin(textRad);

                // Segment colors
                const colors = [
                  ['#334155', '#1e293b'], // slate unlucky
                  ['#7c3aed', '#6d28d9'], // violet
                  ['#9333ea', '#7e22ce'], // purple
                  ['#f59e0b', '#d97706'], // amber
                  ['#10b981', '#059669'], // emerald
                  ['#475569', '#334155'], // slate unlucky
                ];

                return (
                  <g key={i}>
                    <defs>
                      <linearGradient id={`seg-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors[i][0]} />
                        <stop offset="100%" stopColor={colors[i][1]} />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={`url(#seg-grad-${i})`}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize={segment.isUnlucky ? "22" : "16"}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
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
              {/* Inner circle overlay */}
              <circle cx="100" cy="100" r="30" fill="transparent" />
            </svg>
          </motion.div>

          {/* Center Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-xl border-4 border-white/20 z-10">
            <motion.div
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
            >
              <Star className="size-7 text-white fill-white" />
            </motion.div>
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="relative">
            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-violet-400" />
          </div>
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
              <div className="text-center p-6">
                {isUnlucky ? (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring" }}
                    >
                      <Skull className="size-14 text-muted-foreground mx-auto mb-2" />
                    </motion.div>
                    <p className="text-2xl font-display font-bold text-muted-foreground">Unlucky!</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Try again!</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.4, 1] }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="relative"
                    >
                      <Sparkles className="size-12 text-gold mx-auto mb-2" />
                      <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.6, repeat: 3 }}
                      >
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute size-2 rounded-full bg-gold"
                            initial={{ x: 24, y: 24 }}
                            animate={{
                              x: 24 + Math.cos((i * 60 * Math.PI) / 180) * 40,
                              y: 24 + Math.sin((i * 60 * Math.PI) / 180) * 40,
                              opacity: [1, 0],
                            }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                    <p className="text-muted-foreground text-xs font-medium">You won!</p>
                    <p className="text-4xl font-display font-bold text-foreground mt-1">+{result}</p>
                    <p className="font-bold text-sm text-primary">CASET</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cost Display */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
        <Coins className="size-4 text-gold" />
        <span className="text-sm font-medium text-foreground">{cost} CASET per spin</span>
      </div>

      {/* Spin Button */}
      <Button
        onClick={handleSpin}
        disabled={!canSpin}
        size="lg"
        className="w-full max-w-[220px] h-14 rounded-2xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-bold text-lg shadow-xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all"
      >
        {spinning || isSpinning ? (
          <>
            <Loader2 className="size-5 animate-spin mr-2" />
            Spinning...
          </>
        ) : (
          <>
            <Sparkles className="size-5 mr-2" />
            SPIN NOW
          </>
        )}
      </Button>

      {(profile?.balance || 0) < cost && !spinning && !isSpinning && (
        <motion.p 
          className="text-destructive text-sm font-medium flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Coins className="size-4" />
          Not enough coins to spin
        </motion.p>
      )}

      {showResult && (
        <Button
          variant="ghost"
          onClick={() => setShowResult(false)}
          className="text-primary hover:text-primary/80"
        >
          <Sparkles className="size-4 mr-2" />
          Spin Again
        </Button>
      )}
    </div>
  );
}