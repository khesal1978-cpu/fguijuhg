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
  { value: 10, label: "10", color: "hsl(var(--primary))", probability: 70 },
  { value: 20, label: "20", color: "hsl(var(--accent))", probability: 20 },
  { value: 10, label: "10", color: "hsl(var(--primary))", probability: 70 },
  { value: 50, label: "50", color: "hsl(var(--gold))", probability: 7 },
  { value: 10, label: "10", color: "hsl(var(--primary))", probability: 70 },
  { value: 100, label: "100", color: "hsl(var(--destructive))", probability: 2 },
  { value: 10, label: "10", color: "hsl(var(--primary))", probability: 70 },
  { value: 500, label: "500", color: "hsl(45 100% 50%)", probability: 1 },
];

export function SpinWheel({ onSpin, spinning, cost }: SpinWheelProps) {
  const { profile } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (spinning || (profile?.balance || 0) < cost) return;

    setShowResult(false);
    setResult(null);

    const response = await onSpin();

    if (response.success && response.reward) {
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
      }, 4000);
    }
  };

  const canSpin = (profile?.balance || 0) >= cost && !spinning;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-primary/30 p-2">
          {/* Wheel */}
          <motion.div
            ref={wheelRef}
            className="relative w-full h-full rounded-full overflow-hidden border-4 border-card shadow-glow"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }}
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
                const textX = 100 + 65 * Math.cos(textRad);
                const textY = 100 + 65 * Math.sin(textRad);

                return (
                  <g key={i}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="hsl(var(--card))"
                      strokeWidth="1"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                      style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Center Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow border-4 border-card z-10">
            <Coins className="size-8 text-primary-foreground" />
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gold drop-shadow-lg" />
        </div>
      </div>

      {/* Result Popup */}
      <AnimatePresence>
        {showResult && result !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl z-30"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="size-12 text-gold mx-auto mb-2" />
              </motion.div>
              <p className="text-muted-foreground text-sm font-medium mb-1">You won!</p>
              <p className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                +{result}
              </p>
              <p className="text-primary font-bold text-lg">CASET</p>
              <Button
                onClick={() => setShowResult(false)}
                className="mt-4"
                variant="outline"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin Button */}
      <Button
        onClick={handleSpin}
        disabled={!canSpin}
        className="w-full max-w-[200px] h-12 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground font-bold text-lg shadow-glow disabled:opacity-50"
      >
        {spinning ? (
          <Loader2 className="size-5 animate-spin mr-2" />
        ) : (
          <Sparkles className="size-5 mr-2" />
        )}
        {spinning ? "Spinning..." : `Spin (${cost} CASET)`}
      </Button>

      {(profile?.balance || 0) < cost && !spinning && (
        <p className="text-destructive text-sm font-medium">
          Not enough CASET to spin!
        </p>
      )}
    </div>
  );
}
