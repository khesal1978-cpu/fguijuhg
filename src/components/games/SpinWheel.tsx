import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SpinWheelProps {
  onSpin: () => Promise<{ success: boolean; reward?: number; error?: string }>;
  spinning: boolean;
  cost: number;
}

// SVG Icons
const SkullIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2 15H8v-2h2v2zm0-4H8V9h2v4zm4 4h-2v-2h2v2zm0-4h-2V9h2v4zm3-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM7 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
  </svg>
);

const CoinStackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3"/>
    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">$</text>
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
    <path d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm6.26-2h-2.65l-1.5-3h2.65l1.5 3zM6.24 5h2.65l-1.5 3H4.74l1.5-3z"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// 6 segments with vibrant colors and proper SVG icons
const SEGMENTS = [
  { value: 0, icon: "skull", color: ["#334155", "#1e293b"], isUnlucky: true },
  { value: 10, icon: "coin", color: ["#7c3aed", "#6d28d9"] },
  { value: 20, icon: "star", color: ["#9333ea", "#7e22ce"] },
  { value: 50, icon: "trophy", color: ["#f59e0b", "#d97706"] },
  { value: 100, icon: "diamond", color: ["#10b981", "#059669"] },
  { value: 0, icon: "skull", color: ["#475569", "#334155"], isUnlucky: true },
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

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "skull": return <SkullIcon />;
      case "coin": return <CoinStackIcon />;
      case "star": return <StarIcon />;
      case "trophy": return <TrophyIcon />;
      case "diamond": return <DiamondIcon />;
      default: return null;
    }
  };

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
                const iconX = 100 + 65 * Math.cos(textRad);
                const iconY = 100 + 65 * Math.sin(textRad);
                const valueX = 100 + 45 * Math.cos(textRad);
                const valueY = 100 + 45 * Math.sin(textRad);

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
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                    />
                    {/* Icon */}
                    <g transform={`translate(${iconX - 10}, ${iconY - 10}) rotate(${textAngle + 90}, 10, 10)`}>
                      <rect x="2" y="2" width="16" height="16" rx="4" fill="rgba(255,255,255,0.2)" />
                      <g transform="translate(4, 4) scale(0.5)" fill="white">
                        {segment.icon === "skull" && (
                          <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                        )}
                        {segment.icon === "coin" && (
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        )}
                        {segment.icon === "star" && (
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        )}
                        {segment.icon === "trophy" && (
                          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z"/>
                        )}
                        {segment.icon === "diamond" && (
                          <path d="M19 3H5L2 9l10 12L22 9l-3-6z"/>
                        )}
                      </g>
                    </g>
                    {/* Value text */}
                    <text
                      x={valueX}
                      y={valueY}
                      fill="white"
                      fontSize={segment.isUnlucky ? "10" : "12"}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${valueX}, ${valueY})`}
                      style={{ 
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)", 
                        fontFamily: "'Space Grotesk', sans-serif" 
                      }}
                    >
                      {segment.isUnlucky ? "X" : segment.value}
                    </text>
                  </g>
                );
              })}
              {/* Inner circle overlay */}
              <circle cx="100" cy="100" r="28" fill="transparent" />
            </svg>
          </motion.div>

          {/* Center Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-xl border-4 border-white/20 z-10">
            <motion.div
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="size-6">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="relative">
            <svg viewBox="0 0 30 35" className="w-7 h-8 drop-shadow-lg">
              <defs>
                <linearGradient id="pointer-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <path d="M15 0 L28 25 L15 35 L2 25 Z" fill="url(#pointer-grad)" />
              <path d="M15 5 L23 23 L15 30 L7 23 Z" fill="#a78bfa" opacity="0.5" />
            </svg>
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
                      className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted/50 flex items-center justify-center"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-10 text-muted-foreground">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                      </svg>
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