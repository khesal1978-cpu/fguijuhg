import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, Pause, Sparkles } from "lucide-react";

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

  useEffect(() => {
    if (!isMining) return;

    const interval = setInterval(() => {
      const id = Date.now();
      const x = Math.random() * 120 - 60;
      const y = Math.random() * 20 - 10;
      
      setFloatingCoins((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setFloatingCoins((prev) => prev.filter((c) => c.id !== id));
      }, 2500);
    }, 600);

    return () => clearInterval(interval);
  }, [isMining]);

  const getButtonText = () => {
    if (loading) return "LOADING...";
    if (canClaim) return "CLAIM";
    if (isMining) return "MINING";
    return "START";
  };

  const getButtonSubtext = () => {
    if (canClaim) return "Tap to collect";
    if (isMining) return `+${(miningRate / 3600).toFixed(4)}/sec`;
    return "6 Hour Cycle";
  };

  const isInactive = !isMining && !canClaim && canStart;

  return (
    <div className="relative flex items-center justify-center group cursor-pointer py-4">
      {/* Floating Coins */}
      <AnimatePresence>
        {floatingCoins.map((coin) => (
          <motion.div
            key={coin.id}
            className="absolute text-gold font-bold text-sm pointer-events-none z-30 flex items-center gap-1"
            initial={{ opacity: 1, y: 0, x: coin.x, scale: 0.8 }}
            animate={{ opacity: 0, y: -100, x: coin.x + Math.random() * 30 - 15, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <Sparkles className="size-3" />
            +{(miningRate / 3600).toFixed(3)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Orbiting particles */}
      {isMining && (
        <>
          <div className="absolute w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] animate-spin-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/60 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent-foreground/50 rounded-full" />
          </div>
          <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] animate-spin-reverse">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 bg-gold/60 rounded-full" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-primary/40 rounded-full" />
          </div>
        </>
      )}

      {/* Progress Ring SVG */}
      <div className="absolute w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] -rotate-90">
        <svg className="w-full h-full">
          {/* Track */}
          <circle
            className={isInactive ? "text-destructive/20" : "text-border"}
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
          />
          {/* Progress */}
          <motion.circle
            className={canClaim ? "text-gold" : isInactive ? "text-destructive" : "text-primary"}
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        {/* Progress marker */}
        {progress > 0 && (
          <motion.div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-4 border-primary rounded-full z-10"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Outer glow rings */}
      <motion.div
        className={`absolute w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full ${
          canClaim
            ? "bg-gold/15"
            : isInactive
            ? "bg-destructive/10"
            : "bg-primary/10"
        }`}
        animate={{
          scale: isPressed ? 1.15 : [1, 1.08, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ filter: "blur(20px)" }}
      />

      {/* Morphing blob behind button */}
      <div className={`absolute w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-full animate-morph ${
        canClaim
          ? "bg-gradient-to-br from-gold/20 to-gold/5"
          : isInactive
          ? "bg-gradient-to-br from-destructive/15 to-destructive/5"
          : "bg-gradient-to-br from-primary/15 to-accent-foreground/10"
      }`} style={{ filter: "blur(30px)" }} />

      {/* Breathing ring */}
      <div className={`absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full border animate-breathe ${
        canClaim ? "border-gold/20" : isInactive ? "border-destructive/15" : "border-primary/15"
      }`} />

      {/* Main Button */}
      <motion.button
        className={`relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full flex flex-col items-center justify-center z-20 overflow-hidden border-4 border-card/50 ${
          canClaim
            ? "bg-gradient-to-br from-gold via-gold to-gold-dark shadow-gold"
            : isInactive
            ? "bg-gradient-to-br from-destructive/80 via-destructive to-destructive shadow-[0_0_30px_hsl(0_72%_51%/0.3)]"
            : "bg-gradient-to-br from-primary via-primary to-accent-foreground shadow-glow"
        }`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onTapStart={() => setIsPressed(true)}
        onTap={() => {
          setIsPressed(false);
          onTap?.();
        }}
        onTapCancel={() => setIsPressed(false)}
        disabled={loading || (isMining && !canClaim)}
      >
        {/* Inner gradient overlay */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {/* Button Content */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <motion.div
            animate={isMining ? { 
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            } : { scale: [1, 1.08, 1] }}
            transition={{ duration: isMining ? 0.8 : 2.5, repeat: Infinity }}
          >
            {canClaim ? (
              <Check className="size-12 sm:size-14 text-primary-foreground drop-shadow-lg" />
            ) : isInactive ? (
              <Pause className="size-12 sm:size-14 text-primary-foreground drop-shadow-lg" />
            ) : (
              <Zap className="size-12 sm:size-14 text-primary-foreground fill-current drop-shadow-lg" />
            )}
          </motion.div>
          <span className="text-primary-foreground font-serif font-bold text-lg sm:text-xl tracking-wide drop-shadow-md">
            {getButtonText()}
          </span>
          <span className="text-primary-foreground/80 text-xs font-medium tracking-wide">
            {getButtonSubtext()}
          </span>
        </div>

        {/* Shine sweep effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
          initial={{ x: "-150%", skewX: "-15deg" }}
          animate={{ x: "150%" }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeInOut",
          }}
        />
      </motion.button>

      {/* Tap Ripple */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className={`absolute w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full border-2 ${
              canClaim ? "border-gold/60" : isInactive ? "border-destructive/50" : "border-primary/60"
            }`}
            initial={{ scale: 0.9, opacity: 1 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
