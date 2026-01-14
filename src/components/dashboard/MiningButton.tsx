import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check } from "lucide-react";

interface MiningButtonProps {
  progress?: number;
  isMining?: boolean;
  canClaim?: boolean;
  canStart?: boolean;
  onTap?: () => void;
  loading?: boolean;
}

export function MiningButton({ 
  progress = 0, 
  isMining = false, 
  canClaim = false,
  canStart = true,
  onTap,
  loading = false,
}: MiningButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const circumference = 2 * Math.PI * 130;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getButtonText = () => {
    if (loading) return "LOADING...";
    if (canClaim) return "CLAIM REWARD";
    if (isMining) return "MINING...";
    return "TAP TO MINE";
  };

  const getButtonSubtext = () => {
    if (canClaim) return "Tap to collect";
    if (isMining) return `${Math.round(progress)}% Complete`;
    return "6H Cycle";
  };

  return (
    <div className="relative flex items-center justify-center group cursor-pointer">
      {/* Progress Ring SVG */}
      <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] -rotate-90">
        <svg className="w-full h-full">
          {/* Track */}
          <circle
            className="text-border"
            cx="50%"
            cy="50%"
            r="45%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
          />
          {/* Progress */}
          <motion.circle
            className={canClaim ? "text-gold" : "text-primary"}
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
          canClaim ? "bg-gold/30" : "bg-primary/20"
        }`}
        animate={{
          scale: isPressed ? 1.1 : [0.75, 0.85, 0.75],
        }}
        transition={{
          scale: { duration: 0.2 },
          default: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Main Button */}
      <motion.button
        className={`relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full flex flex-col items-center justify-center z-20 overflow-hidden border-4 border-card ${
          canClaim
            ? "bg-gradient-to-br from-gold/80 to-gold shadow-gold"
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
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {canClaim ? (
              <Check className="size-10 sm:size-12 text-primary-foreground" />
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
              canClaim ? "border-gold/50" : "border-primary/50"
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
