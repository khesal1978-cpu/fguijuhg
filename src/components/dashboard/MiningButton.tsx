import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, Play, Sparkles } from "lucide-react";

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
  const [particles, setParticles] = useState<{ id: number; x: number }[]>([]);
  
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (!isMining) return;

    const interval = setInterval(() => {
      const id = Date.now();
      const x = Math.random() * 80 - 40;
      setParticles(prev => [...prev, { id, x }]);
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 2000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining]);

  const getButtonState = () => {
    if (loading) return { text: "...", sub: "Loading", color: "bg-muted" };
    if (canClaim) return { text: "CLAIM", sub: "Tap to collect", color: "bg-gold" };
    if (isMining) return { text: "MINING", sub: `+${(miningRate / 3600).toFixed(4)}/s`, color: "bg-primary" };
    return { text: "START", sub: "6 Hour Cycle", color: "bg-primary" };
  };

  const state = getButtonState();
  const isInactive = !isMining && !canClaim && canStart;

  return (
    <div className="relative flex items-center justify-center py-8">
      {/* Floating particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute text-gold text-xs font-semibold pointer-events-none z-30"
            initial={{ opacity: 1, y: 0, x: p.x }}
            animate={{ opacity: 0, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <Sparkles className="size-3" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Outer glow ring */}
      {(isMining || canClaim) && (
        <div className={`absolute w-48 h-48 rounded-full ${canClaim ? 'bg-gold/10' : 'bg-primary/10'} animate-pulse-ring`} />
      )}

      {/* Progress ring */}
      <div className="absolute w-44 h-44">
        <svg className="w-full h-full -rotate-90">
          <circle
            className="text-border"
            cx="50%"
            cy="50%"
            r="70"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="4"
          />
          <motion.circle
            className={canClaim ? "text-gold" : isInactive ? "text-muted-foreground" : "text-primary"}
            cx="50%"
            cy="50%"
            r="70"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      </div>

      {/* Main button */}
      <motion.button
        className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center z-20 ${
          canClaim 
            ? "bg-gradient-to-br from-gold to-amber-500" 
            : isInactive 
            ? "bg-muted" 
            : "bg-gradient-to-br from-primary to-violet-600"
        } ${(isMining || canClaim) ? 'btn-glow' : ''}`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onTapStart={() => setIsPressed(true)}
        onTap={() => {
          setIsPressed(false);
          onTap?.();
        }}
        onTapCancel={() => setIsPressed(false)}
        disabled={loading || (isMining && !canClaim)}
      >
        {/* Icon */}
        <motion.div
          animate={isMining ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {canClaim ? (
            <Check className="size-10 text-white" />
          ) : isMining ? (
            <Zap className="size-10 text-white fill-current" />
          ) : (
            <Play className="size-10 text-white fill-current ml-1" />
          )}
        </motion.div>
        
        {/* Text */}
        <span className="text-white font-display font-bold text-lg mt-1">
          {state.text}
        </span>
        <span className="text-white/70 text-[10px] font-medium">
          {state.sub}
        </span>

        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%", y: "-100%" }}
            animate={{ x: "100%", y: "100%" }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        </div>
      </motion.button>

      {/* Tap ripple */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className={`absolute w-36 h-36 rounded-full border-2 ${canClaim ? 'border-gold/50' : 'border-primary/50'}`}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
