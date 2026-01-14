import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, Pause } from "lucide-react";

interface MiningButtonProps {
  progress?: number;
  isMining?: boolean;
  canClaim?: boolean;
  canStart?: boolean;
  onTap?: () => void;
  loading?: boolean;
  miningRate?: number;
}

export function MiningButton({ 
  progress = 0, 
  isMining = false, 
  canClaim = false,
  canStart = true,
  onTap,
  loading = false,
  miningRate = 10,
}: MiningButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; x: number; y: number }[]>([]);
  const circumference = 2 * Math.PI * 130;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Add floating coins when mining
  useEffect(() => {
    if (!isMining) return;

    const interval = setInterval(() => {
      const id = Date.now();
      const x = Math.random() * 100 - 50;
      const y = Math.random() * 20 - 10;
      
      setFloatingCoins((prev) => [...prev, { id, x, y }]);

      // Remove coin after animation
      setTimeout(() => {
        setFloatingCoins((prev) => prev.filter((c) => c.id !== id));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [isMining]);

  const getButtonText = () => {
    if (loading) return "LOADING...";
    if (canClaim) return "CLAIM REWARD";
    if (isMining) return "MINING...";
    return "TAP TO MINE";
  };

  const getButtonSubtext = () => {
    if (canClaim) return "Tap to collect";
    if (isMining) return `+${(miningRate / 3600).toFixed(4)}/sec`;
    return "6H Cycle";
  };

  const isInactive = !isMining && !canClaim && canStart;

  return (
    <div className="relative flex items-center justify-center group cursor-pointer">
      {/* Floating Coins */}
      <AnimatePresence>
        {floatingCoins.map((coin) => (
          <motion.div
            key={coin.id}
            className="absolute text-gold font-bold text-sm pointer-events-none z-30"
            initial={{ opacity: 1, y: 0, x: coin.x }}
            animate={{ opacity: 0, y: -80, x: coin.x + Math.random() * 20 - 10 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            +{(miningRate / 3600).toFixed(3)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Progress Ring SVG */}
      <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] -rotate-90">
        <svg className="w-full h-full">
          {/* Track */}
          <circle
            className={isInactive ? "text-destructive/30" : "text-border"}
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
          />
          {/* Progress */}
          <motion.circle
            className={canClaim ? "text-gold" : isInactive ? "text-destructive" : "text-primary"}
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        {/* Start marker */}
        {progress > 0 && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-4 h-4 bg-card border-4 border-primary rounded-full z-10" />
        )}
      </div>

      {/* Outer Glow Ring */}
      <motion.div
        className={`absolute inset-0 rounded-full blur-xl ${
          canClaim
            ? "bg-gold/30"
            : isInactive
            ? "bg-destructive/20"
            : "bg-primary/20"
        }`}
        animate={{
          scale: isPressed ? 1.1 : [0.75, 0.85, 0.75],
        }}
        transition={{
          scale: { duration: 0.2 },
          default: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Particle Effects when mining */}
      {isMining && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              animate={{
                x: [0, Math.cos((i * 60 * Math.PI) / 180) * 150],
                y: [0, Math.sin((i * 60 * Math.PI) / 180) * 150],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Main Button */}
      <motion.button
        className={`relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full flex flex-col items-center justify-center z-20 overflow-hidden border-4 border-card ${
          canClaim
            ? "bg-gradient-to-br from-gold/80 to-gold shadow-gold"
            : isInactive
            ? "bg-gradient-to-br from-destructive/60 to-destructive shadow-[0_0_20px_hsl(0_84%_60%/0.3)]"
            : "bg-gradient-to-br from-primary/80 to-primary shadow-glow"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onTapStart={() => setIsPressed(true)}
        onTap={() => {
          setIsPressed(false);
          onTap?.();
        }}
        onTapCancel={() => setIsPressed(false)}
        disabled={loading || (isMining && !canClaim)}
      >
        {/* Gold Shimmer Ring (Inner) */}
        <div className="absolute inset-0 rounded-full shadow-inner-gold pointer-events-none" />
        
        {/* Button Content */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <motion.div
            animate={isMining ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            } : { scale: [1, 1.1, 1] }}
            transition={{ duration: isMining ? 1 : 2, repeat: Infinity }}
          >
            {canClaim ? (
              <Check className="size-10 sm:size-12 text-primary-foreground" />
            ) : isInactive ? (
              <Pause className="size-10 sm:size-12 text-primary-foreground" />
            ) : (
              <Zap className="size-10 sm:size-12 text-primary-foreground fill-current" />
            )}
          </motion.div>
          <span className="text-primary-foreground font-display font-bold text-base sm:text-xl tracking-wider mt-1 drop-shadow-md text-center px-2">
            {getButtonText()}
          </span>
          <span className="text-primary-foreground/80 text-xs font-medium tracking-wide">
            {getButtonSubtext()}
          </span>
        </div>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary-foreground/20 to-transparent"
          initial={{ x: "-150%", skewX: "-12deg" }}
          animate={{ x: "150%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
        />
      </motion.button>

      {/* Tap Ripples */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className={`absolute inset-0 rounded-full border-2 ${
              canClaim ? "border-gold/50" : isInactive ? "border-destructive/50" : "border-primary/50"
            }`}
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
