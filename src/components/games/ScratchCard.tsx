import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Coins, Skull, Gift, Star, Zap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import pingcasetLogo from "@/assets/pingcaset-logo.png";

interface ScratchCardProps {
  onScratch: () => Promise<{ success: boolean; reward?: number; error?: string }>;
  onAdScratch: () => Promise<{ success: boolean; reward: number }>;
  onAdRewardComplete?: (reward: number) => Promise<void>;
  scratching: boolean;
  cost: number;
  remainingAds: number;
}

export function ScratchCard({ onScratch, onAdScratch, onAdRewardComplete, scratching, cost, remainingAds }: ScratchCardProps) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [isUnlucky, setIsUnlucky] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isAdScratch, setIsAdScratch] = useState(false);

  const resetCard = () => {
    setScratched(false);
    setRevealed(false);
    setReward(null);
    setIsUnlucky(false);
    setScratchProgress(0);
    setShowOptions(false);
    setIsAdScratch(false);
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

    // Create premium gradient background
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "hsl(262 83% 58%)");
    gradient.addColorStop(0.5, "hsl(280 80% 50%)");
    gradient.addColorStop(1, "hsl(262 83% 40%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Add shimmer pattern
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      const size = 1 + Math.random() * 4;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add diagonal lines pattern
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = -rect.height; i < rect.width + rect.height; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + rect.height, rect.height);
      ctx.stroke();
    }

    // Add text with shadow
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 4;
    ctx.font = "bold 16px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ SCRATCH TO WIN ✨", rect.width / 2, rect.height / 2);
  };

  const handleBuyCard = async () => {
    if (scratching || (profile?.balance || 0) < cost) return;
    setShowOptions(false);
    setIsAdScratch(false);

    const response = await onScratch();

    if (response.success && response.reward !== undefined) {
      setReward(response.reward);
      setIsUnlucky(response.reward === 0);
      setScratched(true);
      setTimeout(() => initCanvas(), 50);
    }
  };

  const handleAdCard = async () => {
    if (scratching || remainingAds <= 0) return;
    setShowOptions(false);
    setIsAdScratch(true);

    const response = await onAdScratch();

    if (response.success) {
      setReward(response.reward);
      setIsUnlucky(response.reward === 0);
      setScratched(true);
      setTimeout(() => initCanvas(), 50);
    }
  };

  const handleBuyClick = () => {
    if (scratching) return;
    setShowOptions(true);
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

    if (progress > 40 && !revealed) {
      setRevealed(true);
      
      // Apply reward after reveal if it was an ad scratch
      if (isAdScratch && reward !== null && reward > 0 && onAdRewardComplete) {
        onAdRewardComplete(reward);
      }
    }
  };

  const canBuy = !scratching && !scratched;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Options Modal */}
      <AnimatePresence>
        {showOptions && !scratched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-[300px] w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-display font-bold text-foreground text-center mb-4">
                Choose Scratch Method
              </h3>
              
              <div className="space-y-3">
                {/* Pay with coins */}
                <Button
                  onClick={handleBuyCard}
                  disabled={(profile?.balance || 0) < cost}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-bold text-base shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  <Coins className="size-5 mr-2" />
                  Pay {cost} CASET
                </Button>

                {/* Watch ad */}
                <Button
                  onClick={handleAdCard}
                  disabled={remainingAds <= 0}
                  variant="outline"
                  className="w-full h-14 rounded-xl border-primary/40 hover:bg-primary/10 font-bold"
                >
                  <Play className="size-5 mr-2 fill-current text-primary" />
                  Watch Ad ({remainingAds}/3 left)
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Ad scratches: 40% win 10 coins, 60% unlucky
              </p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptions(false)}
                className="w-full mt-3 text-muted-foreground"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Card Container */}
      <div className="relative w-[280px] h-[180px]">
        {/* Outer glow */}
        <div className="absolute inset-[-8px] rounded-2xl bg-gradient-to-r from-primary/20 via-violet-500/15 to-primary/20 blur-xl" />
        
        {!scratched ? (
          // Unscratched card preview - Premium design
          <motion.div
            className="relative w-full h-full rounded-2xl overflow-hidden border border-primary/30 shadow-2xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-primary/10" />
            
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(6)].map((_, i) => (
                <Star 
                  key={i} 
                  className="absolute text-primary" 
                  style={{ 
                    left: `${15 + (i % 3) * 35}%`, 
                    top: `${20 + Math.floor(i / 3) * 50}%`,
                    width: 16,
                    height: 16,
                  }} 
                />
              ))}
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 p-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-violet-600/30 border border-primary/40 flex items-center justify-center backdrop-blur-sm">
                  <img src={pingcasetLogo} alt="PingCaset" className="w-10 h-10 object-contain" />
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Zap className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              </div>
              
              <div className="text-center">
                <p className="text-foreground font-bold text-base">Scratch & Win</p>
                <p className="text-muted-foreground text-xs mt-0.5">Win up to 100 CASET!</p>
              </div>
              
              <div className="flex gap-2 mt-1">
                {[5, 10, 30, 100].map((val) => (
                  <span 
                    key={val} 
                    className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-[10px] font-bold text-primary"
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          // Active scratch card
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            {/* Reward underneath */}
            <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-card border border-border flex flex-col items-center justify-center">
              <AnimatePresence>
                {revealed && reward !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-center"
                  >
                    {isUnlucky ? (
                      <>
                        <motion.div
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"
                        >
                          <Skull className="size-10 text-muted-foreground" />
                        </motion.div>
                        <p className="text-2xl font-display font-bold text-muted-foreground">Unlucky!</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Try again for better luck</p>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.2, 1] }}
                          transition={{ delay: 0.1 }}
                          className="relative"
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-3 border-2 border-primary/40">
                            <Gift className="size-8 text-primary" />
                          </div>
                          {/* Confetti particles */}
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full bg-primary"
                              initial={{ x: 32, y: 32, opacity: 1 }}
                              animate={{
                                x: 32 + Math.cos((i * 45 * Math.PI) / 180) * 50,
                                y: 32 + Math.sin((i * 45 * Math.PI) / 180) * 50,
                                opacity: 0,
                                scale: 0,
                              }}
                              transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                            />
                          ))}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="text-muted-foreground text-xs font-medium">You won!</p>
                          <p className="text-4xl font-display font-bold text-foreground">
                            +{reward}
                          </p>
                          <p className="text-primary font-bold text-sm">CASET</p>
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {!revealed && reward !== null && (
                <div className="text-center opacity-15">
                  {isUnlucky ? (
                    <Skull className="size-12 text-muted-foreground mx-auto" />
                  ) : (
                    <>
                      <p className="text-4xl font-display font-bold text-foreground">+{reward}</p>
                      <p className="text-primary font-bold">CASET</p>
                    </>
                  )}
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
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">Scratching...</span>
            <span className="font-bold text-primary">{Math.round(scratchProgress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${scratchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Cost Display */}
      {!scratched && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
          <Coins className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{cost} CASET per card</span>
        </div>
      )}

      {/* Buttons */}
      {!scratched ? (
        <Button
          onClick={handleBuyClick}
          disabled={!canBuy}
          size="lg"
          className="w-full max-w-[200px] h-12 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-bold text-base shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {scratching ? (
            <span className="animate-pulse">Buying...</span>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" />
              BUY CARD
            </>
          )}
        </Button>
      ) : revealed ? (
        <Button
          onClick={resetCard}
          variant="outline"
          size="lg"
          className="w-full max-w-[200px] h-11 rounded-xl font-semibold border-primary/30 hover:bg-primary/10"
        >
          <RotateCcw className="size-4 mr-2" />
          Play Again
        </Button>
      ) : (
        <motion.p 
          className="text-primary text-sm font-semibold flex items-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="size-4" />
          Scratch to reveal your prize!
        </motion.p>
      )}

      {(profile?.balance || 0) < cost && !scratched && !scratching && (
        <motion.p 
          className="text-destructive text-xs font-medium flex items-center gap-1.5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Coins className="size-3" />
          Not enough coins
        </motion.p>
      )}
    </div>
  );
}
