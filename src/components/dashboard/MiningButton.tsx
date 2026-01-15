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
    }, 800);

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
    <div className="relative flex items-center justify-center group cursor-pointer py-6">
      {/* Floating Coins */}
      <AnimatePresence>
        {floatingCoins.map((coin) => (
          <motion.div
            key={coin.id}
            className="absolute text-gold font-bold text-sm pointer-events-none z-30 flex items-center gap-1 font-mono"
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

      {/* Morphing blob backgrounds */}
      <div className={`absolute w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-full animate-morph ${
        canClaim
          ? "bg-gradient-to-br from-gold/10 to-gold/5"
          : isInactive
          ? "bg-gradient-to-br from-destructive/10 to-destructive/5"
          : "bg-gradient-to-br from-primary/10 to-accent-foreground/8"
      }`} style={{ filter: "blur(40px)" }} />
      
      <div className={`absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full animate-morph-reverse ${
        canClaim
          ? "bg-gradient-to-tr from-gold/8 to-transparent"
          : isInactive
          ? "bg-gradient-to-tr from-destructive/8 to-transparent"
          : "bg-gradient-to-tr from-accent-foreground/8 to-transparent"
      }`} style={{ filter: "blur(30px)", animationDelay: "2s" }} />

      {/* Orbiting particles - only when mining */}
      {isMining && (
        <>
          <div className="absolute w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] animate-spin-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/50 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent-foreground/40 rounded-full" />
          </div>
          <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] animate-spin-reverse">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 bg-gold/50 rounded-full" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-primary/30 rounded-full" />
          </div>
        </>
      )}

      {/* Breathing rings */}
      <div className={`absolute w-[250px] h-[250px] sm:w-[290px] sm:h-[290px] rounded-full border animate-breathe ${
        canClaim ? "border-gold/15" : isInactive ? "border-destructive/10" : "border-primary/15"
      }`} />
      <div 
        className={`absolute w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] rounded-full border animate-breathe ${
          canClaim ? "border-gold/8" : isInactive ? "border-destructive/5" : "border-primary/8"
        }`}
        style={{ animationDelay: "2s" }}
      />

      {/* Progress Ring SVG */}
      <div className="absolute w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] -rotate-90">
        <svg className="w-full h-full">
          {/* Track */}
          <circle
            className={isInactive ? "text-destructive/15" : "text-border"}
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="5"
          />
          {/* Progress */}
          <motion.circle
            className={canClaim ? "text-gold" : isInactive ? "text-destructive" : "text-primary"}
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="5"
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
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-3 border-primary rounded-full z-10"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Outer glow */}
      <motion.div
        className={`absolute w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full ${
          canClaim
            ? "bg-gold/12"
            : isInactive
            ? "bg-destructive/8"
            : "bg-primary/10"
        }`}
        animate={{
          scale: isPressed ? 1.12 : [1, 1.06, 1],
          opacity: [0.5, 0.75, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ filter: "blur(25px)" }}
      />

      {/* Main Button */}
      <motion.button
        className={`relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full flex flex-col items-center justify-center z-20 overflow-hidden border-2 border-card/30 ${
          canClaim
            ? "bg-gradient-to-br from-gold via-gold to-gold-dark"
            : isInactive
            ? "bg-gradient-to-br from-destructive/80 via-destructive to-destructive"
            : "bg-gradient-to-br from-primary via-primary to-accent-foreground"
        }`}
        style={{
          boxShadow: canClaim 
            ? "var(--shadow-gold)" 
            : isInactive 
            ? "0 0 30px hsl(0 72% 51% / 0.2)"
            : "var(--shadow-glow)"
        }}
        whileHover={{ scale: 1.05 }}
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
              scale: [1, 1.12, 1],
              rotate: [0, 3, -3, 0],
            } : { scale: [1, 1.06, 1] }}
            transition={{ duration: isMining ? 0.8 : 2.5, repeat: Infinity }}
          >
            {canClaim ? (
              <Check className="size-12 sm:size-14 text-primary-foreground drop-shadow-md" />
            ) : isInactive ? (
              <Pause className="size-12 sm:size-14 text-primary-foreground drop-shadow-md" />
            ) : (
              <Zap className="size-12 sm:size-14 text-primary-foreground fill-current drop-shadow-md" />
            )}
          </motion.div>
          <span className="text-primary-foreground font-serif font-bold text-lg sm:text-xl tracking-wide drop-shadow-sm">
            {getButtonText()}
          </span>
          <span className="text-primary-foreground/80 text-xs font-medium tracking-wide font-mono">
            {getButtonSubtext()}
          </span>
        </div>

        {/* Shine sweep effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent"
          initial={{ x: "-150%", skewX: "-15deg" }}
          animate={{ x: "150%" }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut",
          }}
        />
      </motion.button>

      {/* Tap Ripple */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className={`absolute w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full border-2 ${
              canClaim ? "border-gold/50" : isInactive ? "border-destructive/40" : "border-primary/50"
            }`}
            initial={{ scale: 0.9, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
