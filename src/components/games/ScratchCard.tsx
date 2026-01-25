import { useState, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Coins, Skull } from "lucide-react";
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
  const [isUnlucky, setIsUnlucky] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  const resetCard = () => {
    setScratched(false);
    setRevealed(false);
    setReward(null);
    setIsUnlucky(false);
    setScratchProgress(0);
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
    gradient.addColorStop(0, "hsl(262 83% 58%)");
    gradient.addColorStop(1, "hsl(262 83% 40%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Add sparkle pattern
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add text
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2);
  };

  const handleBuyCard = async () => {
    if (scratching || (profile?.balance || 0) < cost) return;

    const response = await onScratch();

    if (response.success && response.reward !== undefined) {
      setReward(response.reward);
      setIsUnlucky(response.reward === 0);
      setScratched(true);
      setTimeout(() => initCanvas(), 50);
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
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const progress = (transparent / (imageData.data.length / 4)) * 100;
    setScratchProgress(progress);

    if (progress > 45 && !revealed) {
      setRevealed(true);
    }
  };

  const canBuy = (profile?.balance || 0) >= cost && !scratching && !scratched;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card Container */}
      <div className="relative w-[260px] h-[160px]">
        {!scratched ? (
          // Unscratched card preview
          <motion.div
            className="w-full h-full rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
          >
            <Coins className="size-10 text-primary/40" />
            <p className="text-muted-foreground font-medium text-sm">
              Buy a card to scratch
            </p>
            <p className="text-xs text-muted-foreground/70">
              Win 5, 10, 30 or 100 coins!
            </p>
          </motion.div>
        ) : (
          // Active scratch card
          <div className="relative w-full h-full">
            {/* Reward underneath */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/20 border border-border flex flex-col items-center justify-center">
              <AnimatePresence>
                {revealed && reward !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    {isUnlucky ? (
                      <>
                        <Skull className="size-8 text-muted-foreground mx-auto mb-1" />
                        <p className="text-2xl font-display font-bold text-muted-foreground">Unlucky!</p>
                        <p className="text-sm text-muted-foreground/70">Better luck next time</p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-6 text-primary mx-auto mb-1" />
                        <p className="text-muted-foreground text-xs font-medium">You won!</p>
                        <p className="text-3xl font-display font-bold text-foreground">
                          +{reward}
                        </p>
                        <p className="text-primary font-bold text-sm">coins</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {!revealed && reward !== null && (
                <div className="text-center opacity-20">
                  {isUnlucky ? (
                    <>
                      <Skull className="size-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xl font-display font-bold text-muted-foreground">💀</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-display font-bold text-foreground">
                        +{reward}
                      </p>
                      <p className="text-primary font-bold text-sm">coins</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Scratch layer */}
            {!revealed && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full rounded-xl cursor-crosshair touch-none"
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
        <div className="w-full max-w-[260px]">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Scratching...</span>
            <span>{Math.round(scratchProgress)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
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
          className="w-full max-w-[180px] h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
        >
          {scratching ? (
            <span className="animate-pulse">Buying...</span>
          ) : (
            <>
              <Coins className="size-4 mr-2" />
              Buy • {cost} coins
            </>
          )}
        </Button>
      ) : revealed ? (
        <Button
          onClick={resetCard}
          variant="outline"
          className="w-full max-w-[180px] h-10 rounded-xl font-medium"
        >
          <RotateCcw className="size-4 mr-2" />
          Play Again
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs font-medium animate-pulse">
          Scratch to reveal your prize!
        </p>
      )}

      {(profile?.balance || 0) < cost && !scratched && !scratching && (
        <p className="text-destructive text-xs font-medium">
          Not enough coins
        </p>
      )}
    </div>
  );
}