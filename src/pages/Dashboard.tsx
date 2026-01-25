import { motion } from "framer-motion";
import { Gauge, Layers, Timer, Coins, ChevronRight, Zap, Loader2 } from "lucide-react";
import { MiningButton } from "@/components/dashboard/MiningButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { BurnStatusCard } from "@/components/dashboard/BurnStatusCard";
import { useAuth } from "@/contexts/AuthContext";
import { useMining } from "@/hooks/useMining";
import { useTransactions } from "@/hooks/useTransactions";
import { useBurning } from "@/hooks/useBurning";
import { useState, useEffect, useCallback, memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { haptic } from "@/lib/haptics";

// Native-like spring animation config
const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 };
const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30, duration: 0.25 }
};

// Memoized activity item with forwardRef to avoid React warnings
const ActivityItemInner = forwardRef<HTMLDivElement, { tx: any; index: number }>(function ActivityItem({ tx, index }, ref) {
  return (
    <motion.div
      ref={ref}
      className="flex items-center justify-between p-4 list-item-glass active:bg-white/[0.04] transition-colors"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: index * 0.03 }}
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Zap className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{tx.description || tx.type}</p>
          <p className="text-xs text-foreground/60">
            {((tx.created_at as any)?.toDate?.() ?? new Date(tx.created_at as any)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
      <span className={`text-sm font-bold ${Number(tx.amount) >= 0 ? 'text-primary' : 'text-destructive'}`}>
        {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
      </span>
    </motion.div>
  );
});

const ActivityItem = memo(ActivityItemInner);

export default function Dashboard() {
  const { profile } = useAuth();
  const { 
    progress, 
    timeRemaining, 
    startMining, 
    claimReward, 
    canStartMining, 
    canClaim, 
    isMining,
    loading: miningLoading 
  } = useMining();
  const { transactions, loading: txLoading } = useTransactions(3);
  const { isAtRisk, burnedAmount } = useBurning();
  
  const [liveEarnings, setLiveEarnings] = useState(0);

  useEffect(() => {
    if (!isMining || !profile?.mining_rate) {
      setLiveEarnings(0);
      return;
    }

    const perSecond = Number(profile.mining_rate) / 3600;
    const interval = setInterval(() => {
      setLiveEarnings(prev => prev + perSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, profile?.mining_rate]);

  const handleMiningTap = useCallback(async () => {
    if (canClaim) {
      haptic('success');
      await claimReward();
      setLiveEarnings(0);
    } else if (canStartMining) {
      haptic('medium');
      await startMining();
    }
  }, [canClaim, canStartMining, claimReward, startMining]);

  const formatTime = (num: number) => String(num).padStart(2, "0");

  const cycleDisplay = timeRemaining
    ? `${formatTime(timeRemaining.hours)}:${formatTime(timeRemaining.minutes)}:${formatTime(timeRemaining.seconds)}`
    : "00:00:00";

  if (miningLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6 select-none">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        {...fadeInUp}
      >
        <div>
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <h1 className="text-xl font-display font-bold text-foreground">
            {profile?.display_name || "Miner"}
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isMining 
            ? "bg-primary/10 text-primary" 
            : canClaim 
            ? "bg-gold/10 text-gold"
            : "bg-muted text-muted-foreground"
        }`}>
          <span className={`size-1.5 rounded-full ${
            isMining ? "bg-primary animate-pulse" : canClaim ? "bg-gold" : "bg-muted-foreground"
          }`} />
          {isMining ? "Mining" : canClaim ? "Ready" : "Idle"}
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        className="card-glass-strong p-6 text-center active:scale-[0.98] transition-transform will-change-transform"
        {...fadeInUp}
        transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.05 }}
      >
        <p className="text-xs font-medium text-foreground/60 mb-2">Total Balance</p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="size-7 text-gold" />
          <span className="text-4xl font-display font-bold text-foreground">
            {Number(profile?.balance || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-base font-semibold text-primary">CASET</span>
        </div>
        {isMining && liveEarnings > 0 && (
          <motion.p 
            className="text-sm font-medium text-primary mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            +{liveEarnings.toFixed(4)} this session
          </motion.p>
        )}
      </motion.div>

      {/* Mining Button */}
      <motion.div
        {...fadeInUp}
        transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <MiningButton 
          progress={progress} 
          isMining={isMining}
          canClaim={canClaim}
          canStart={canStartMining}
          onTap={handleMiningTap}
          miningRate={Number(profile?.mining_rate || 10)}
        />
        
        {/* Timer */}
        <p className="text-center text-sm text-muted-foreground">
          {canClaim ? (
            <span className="text-gold font-medium">Rewards ready!</span>
          ) : isMining ? (
            <>Ends in <span className="text-foreground font-mono font-medium">{cycleDisplay}</span></>
          ) : (
            <span className="text-muted-foreground">Tap to start mining</span>
          )}
        </p>
      </motion.div>

      {/* Burn Status - Only show if at risk or has burned tokens */}
      {(isAtRisk || burnedAmount > 0) && (
        <BurnStatusCard />
      )}

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-3 gap-3"
        {...fadeInUp}
        transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.15 }}
      >
        <StatCard
          icon={<Gauge className="size-4" />}
          label="Rate"
          value={`${Number(profile?.mining_rate || 10).toFixed(0)}`}
          unit="/session"
          highlight
        />
        <StatCard
          icon={<Layers className="size-4" />}
          label="Mined"
          value={Number(profile?.total_mined || 0).toLocaleString()}
        />
        <StatCard
          icon={<Timer className="size-4" />}
          label="Sessions"
          value="4/day"
        />
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        {...fadeInUp}
        transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
          <Link 
            to="/wallet" 
            className="text-xs text-primary font-semibold flex items-center gap-0.5 active:opacity-70 transition-opacity"
            onClick={() => haptic('light')}
          >
            View all <ChevronRight className="size-4" />
          </Link>
        </div>
        
        <div className="card-glass-strong divide-y divider-glass overflow-hidden rounded-2xl">
          {txLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-foreground/40" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Zap className="size-10 text-foreground/20 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground/60">No activity yet</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <ActivityItem key={tx.id} tx={tx} index={i} />
            ))
          )}
        </div>
      </motion.div>

    </div>
  );
}
