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

const SEGMENTS = [
  { value: 10, label: "10", color: "hsl(262 83% 58%)" },
  { value: 20, label: "20", color: "hsl(262 83% 45%)" },
  { value: 10, label: "10", color: "hsl(262 83% 58%)" },
  { value: 50, label: "50", color: "hsl(45 100% 50%)" },
  { value: 10, label: "10", color: "hsl(262 83% 58%)" },
  { value: 100, label: "100", color: "hsl(262 83% 35%)" },
  { value: 10, label: "10", color: "hsl(262 83% 58%)" },
  { value: 500, label: "500", color: "hsl(45 100% 45%)" },
];

export function SpinWheel({ onSpin, spinning, cost }: SpinWheelProps) {
  const { profile } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (isSpinning || spinning || (profile?.balance || 0) < cost) return;

    setShowResult(false);
    setResult(null);
    setIsSpinning(true);

    const response = await onSpin();

    if (response.success && response.reward !== undefined) {
      // Find segment index for this reward
      const segmentIndex = SEGMENTS.findIndex((s) => s.value === response.reward);
      const segmentAngle = 360 / SEGMENTS.length;
      const targetAngle = segmentIndex * segmentAngle + segmentAngle / 2;

      // Spin multiple rotations plus land on target
      const spins = 5 + Math.random() * 3;
      const newRotation = rotation + spins * 360 + (360 - targetAngle);

      setRotation(newRotation);
      setResult(response.reward);

      // Show result after spin completes
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
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse-soft" />
        
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 p-1.5">
          {/* Wheel */}
          <motion.div
            ref={wheelRef}
            className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/30 shadow-lg"
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
                const textX = 100 + 62 * Math.cos(textRad);
                const textY = 100 + 62 * Math.sin(textRad);

                return (
                  <g key={i}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Center Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-card to-background flex items-center justify-center shadow-lg border border-border z-10">
            <Coins className="size-6 text-primary" />
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-primary drop-shadow-md" />
        </div>

        {/* Result Popup */}
        <AnimatePresence>
          {showResult && result !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-full z-30"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.1 }}
                >
                  <Sparkles className="size-8 text-primary mx-auto mb-1" />
                </motion.div>
                <p className="text-muted-foreground text-xs font-medium">You won!</p>
                <p className="text-3xl font-display font-bold text-foreground">
                  +{result}
                </p>
                <p className="text-primary font-bold text-sm">coins</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spin Button */}
      <Button
        onClick={handleSpin}
        disabled={!canSpin}
        className="w-full max-w-[180px] h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
      >
        {spinning || isSpinning ? (
          <Loader2 className="size-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="size-4 mr-2" />
        )}
        {spinning || isSpinning ? "Spinning..." : `Spin • ${cost} coins`}
      </Button>

      {(profile?.balance || 0) < cost && !spinning && !isSpinning && (
        <p className="text-destructive text-xs font-medium">
          Not enough coins to spin
        </p>
      )}

      {showResult && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResult(false)}
          className="text-muted-foreground text-xs"
        >
          Spin Again
        </Button>
      )}
    </div>
  );
}
