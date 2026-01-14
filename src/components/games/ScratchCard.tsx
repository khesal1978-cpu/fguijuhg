import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface ScratchCardProps {
  onScratch: () => Promise<{ success: boolean; reward?: number; error?: string }>;
  scratching: boolean;
  cost: number;
}

export function ScratchCard({ onScratch, scratching, cost }: ScratchCardProps) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [cardReady, setCardReady] = useState(false);

  const resetCard = () => {
    setScratched(false);
    setRevealed(false);
    setReward(null);
    setScratchProgress(0);
    setCardReady(false);
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "hsl(160, 70%, 40%)");
    gradient.addColorStop(1, "hsl(160, 60%, 30%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Add pattern
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add text
    ctx.font = "bold 16px Poppins, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2);

    setCardReady(true);
  };

  const handleBuyCard = async () => {
    if (scratching || (profile?.balance || 0) < cost) return;

    const response = await onScratch();

    if (response.success && response.reward !== undefined) {
      setReward(response.reward);
      setScratched(true);
      initCanvas();
    }
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!scratched || revealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in e) {
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * 2;
      y = (touch.clientY - rect.top) * 2;
    } else {
      x = (e.clientX - rect.left) * 2;
      y = (e.clientY - rect.top) * 2;
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const progress = (transparent / (imageData.data.length / 4)) * 100;
    setScratchProgress(progress);

    if (progress > 50 && !revealed) {
      setRevealed(true);
    }
  };

  const canBuy = (profile?.balance || 0) >= cost && !scratching && !scratched;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card Container */}
      <div className="relative w-[280px] h-[180px] sm:w-[320px] sm:h-[200px]">
        {!scratched ? (
          // Unscratched card preview
          <motion.div
            className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <Coins className="size-12 text-primary/50" />
            <p className="text-muted-foreground font-medium text-sm">
              Buy a card to scratch!
            </p>
            <p className="text-xs text-muted-foreground">
              Win up to 30 CASET
            </p>
          </motion.div>
        ) : (
          // Active scratch card
          <div className="relative w-full h-full">
            {/* Reward underneath */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/20 to-accent/30 border border-border flex flex-col items-center justify-center">
              <AnimatePresence>
                {revealed && reward !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <Sparkles className="size-8 text-gold mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm font-medium">You won!</p>
                    <p className="text-4xl font-display font-bold text-foreground">
                      +{reward}
                    </p>
                    <p className="text-primary font-bold">CASET</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!revealed && reward !== null && (
                <div className="text-center opacity-30">
                  <p className="text-4xl font-display font-bold text-foreground">
                    +{reward}
                  </p>
                  <p className="text-primary font-bold">CASET</p>
                </div>
              )}
            </div>

            {/* Scratch layer */}
            {!revealed && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full rounded-2xl cursor-crosshair touch-none"
                onMouseDown={() => setIsScratching(true)}
                onMouseUp={() => setIsScratching(false)}
                onMouseLeave={() => setIsScratching(false)}
                onMouseMove={(e) => isScratching && scratch(e)}
                onTouchStart={() => setIsScratching(true)}
                onTouchEnd={() => setIsScratching(false)}
                onTouchMove={(e) => isScratching && scratch(e)}
              />
            )}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {scratched && !revealed && (
        <div className="w-full max-w-[280px]">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Scratch progress</span>
            <span>{Math.round(scratchProgress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${scratchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      {!scratched ? (
        <Button
          onClick={handleBuyCard}
          disabled={!canBuy}
          className="w-full max-w-[200px] h-12 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground font-bold text-lg shadow-glow disabled:opacity-50"
        >
          {scratching ? (
            <span className="animate-pulse">Buying...</span>
          ) : (
            <>
              <Coins className="size-5 mr-2" />
              Buy ({cost} CASET)
            </>
          )}
        </Button>
      ) : revealed ? (
        <Button
          onClick={resetCard}
          variant="outline"
          className="w-full max-w-[200px] h-12 rounded-xl font-bold"
        >
          <RotateCcw className="size-5 mr-2" />
          Play Again
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Scratch to reveal your prize!
        </p>
      )}

      {(profile?.balance || 0) < cost && !scratched && !scratching && (
        <p className="text-destructive text-sm font-medium">
          Not enough CASET!
        </p>
      )}
    </div>
  );
}
