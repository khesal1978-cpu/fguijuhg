import { motion, AnimatePresence } from "framer-motion";
import { Gauge, Layers, Timer, TrendingUp, Loader2, Coins, Zap } from "lucide-react";
import { MiningButton } from "@/components/dashboard/MiningButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { useAuth } from "@/contexts/AuthContext";
import { useMining } from "@/hooks/useMining";
import { useTransactions } from "@/hooks/useTransactions";
import { useState, useEffect } from "react";

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
  const { transactions, loading: txLoading } = useTransactions(5);
  
  const [liveEarnings, setLiveEarnings] = useState(0);

  useEffect(() => {
    if (!isMining || !profile?.mining_rate) {
      setLiveEarnings(0);
      return;
    }

    const perSecond = Number(profile.mining_rate) / 3600;
    const interval = setInterval(() => {
      setLiveEarnings((prev) => prev + perSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, profile?.mining_rate]);

  const handleMiningTap = async () => {
    if (canClaim) {
      await claimReward();
      setLiveEarnings(0);
    } else if (canStartMining) {
      await startMining();
    }
  };

  const formatTime = (num: number) => String(num).padStart(2, "0");

  const cycleDisplay = timeRemaining
    ? `${formatTime(timeRemaining.hours)}:${formatTime(timeRemaining.minutes)}:${formatTime(timeRemaining.seconds)}`
    : "00:00:00";

  if (miningLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-8 lg:py-8 max-w-[1200px] mx-auto w-full space-y-5 md:space-y-6">
      {/* Header */}
      <motion.header 
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor your mining activity
          </p>
        </div>
        <div 
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isMining 
              ? "bg-primary/10 border-primary/20 text-primary" 
              : canClaim 
                ? "bg-gold/10 border-gold/20 text-gold-dark"
                : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <span className={`size-1.5 rounded-full ${
            isMining ? "bg-primary animate-pulse" : canClaim ? "bg-gold" : "bg-destructive"
          }`} />
          {isMining ? "Mining Active" : canClaim ? "Ready to Claim" : "Inactive"}
        </div>
      </motion.header>

      {/* Mining Hero */}
      <motion.section
        className="glass-card rounded-2xl p-5 sm:p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Background accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        {/* Live Earnings Badge */}
        <AnimatePresence>
          {isMining && liveEarnings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 right-4 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 backdrop-blur-sm"
            >
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Session</p>
              <p className="text-sm font-bold text-primary flex items-center gap-1">
                <Zap className="size-3" />
                +{liveEarnings.toFixed(4)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance */}
        <div className="text-center mb-6 sm:mb-8 relative z-10">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Current Balance
          </p>
          <div className="flex items-center justify-center gap-2">
            <Coins className="size-7 sm:size-9 text-gold animate-bounce-soft" />
            <span className="text-3xl sm:text-5xl font-display font-bold text-foreground">
              {Number(profile?.balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-lg sm:text-2xl font-semibold text-primary">
              CASET
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <TrendingUp className="size-3" />
            +{Number(profile?.mining_rate || 10).toFixed(1)}/hr
          </div>
        </div>

        {/* Mining Button */}
        <MiningButton 
          progress={progress} 
          isMining={isMining}
          canClaim={canClaim}
          canStart={canStartMining}
          onTap={handleMiningTap}
          miningRate={Number(profile?.mining_rate || 10)}
        />

        {/* Timer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {canClaim ? (
              <span className="text-gold font-semibold">✨ Rewards ready to claim!</span>
            ) : isMining ? (
              <>
                Cycle ends in{" "}
                <span className="text-primary font-bold font-mono">{cycleDisplay}</span>
              </>
            ) : (
              <span className="text-destructive">Tap to start mining</span>
            )}
          </p>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <StatCard
          icon={<Gauge className="size-5" />}
          label="Mining Rate"
          value={Number(profile?.mining_rate || 10).toFixed(2)}
          unit="CASET/hr"
          iconBg="bg-gold/10"
          iconColor="text-gold-dark"
        />
        <StatCard
          icon={<Layers className="size-5" />}
          label="Total Mined"
          value={Number(profile?.total_mined || 0).toLocaleString()}
          unit="CASET"
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={<Timer className="size-5" />}
          label="Cycle Timer"
          value={isMining ? cycleDisplay : "Ready"}
          iconBg={isMining ? "bg-primary/10" : "bg-destructive/10"}
          iconColor={isMining ? "text-primary" : "text-destructive"}
        />
      </motion.div>

      {/* Activity */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-base font-display font-semibold text-foreground mb-3">
          Recent Activity
        </h2>
        <div className="glass-card rounded-xl overflow-hidden">
          {txLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No activity yet. Start mining!
            </div>
          ) : (
            transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ActivityItem
                  title={tx.description || tx.type}
                  subtitle={new Date(tx.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  amount={`${Number(tx.amount).toFixed(2)} CASET`}
                  isPositive={tx.amount > 0}
                />
              </motion.div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
}
