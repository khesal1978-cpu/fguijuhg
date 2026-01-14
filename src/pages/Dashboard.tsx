import { motion, AnimatePresence } from "framer-motion";
import { Gauge, Layers, Timer, TrendingUp, Loader2, Coins, Zap, Sparkles } from "lucide-react";
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
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-breathe" />
            <div className="relative size-14 rounded-2xl bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 lg:py-8 max-w-[1200px] mx-auto w-full space-y-6 md:space-y-8">
      {/* Header */}
      <motion.header 
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your mining activity
          </p>
        </div>
        <motion.div 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border backdrop-blur-sm ${
            isMining 
              ? "bg-primary/10 border-primary/30 text-primary" 
              : canClaim 
                ? "bg-gold/10 border-gold/30 text-gold-dark"
                : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className={`size-2 rounded-full ${
            isMining ? "bg-primary animate-pulse" : canClaim ? "bg-gold" : "bg-destructive"
          }`} />
          {isMining ? "Mining Active" : canClaim ? "Ready to Claim" : "Inactive"}
        </motion.div>
      </motion.header>

      {/* Mining Hero */}
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Animated background blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/10 to-accent-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-morph" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-gold/10 to-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-morph-reverse" />

        {/* Live Earnings Badge */}
        <AnimatePresence>
          {isMining && liveEarnings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-gradient-to-r from-primary/10 to-accent-foreground/10 border border-primary/20 rounded-2xl px-4 py-3 backdrop-blur-sm"
            >
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">This Session</p>
              <p className="text-base font-bold text-primary flex items-center gap-1.5 font-serif">
                <Sparkles className="size-4 animate-pulse-soft" />
                +{liveEarnings.toFixed(4)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance */}
        <div className="text-center mb-8 sm:mb-10 relative z-10">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.15em] mb-3">
            Current Balance
          </p>
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Coins className="size-8 sm:size-11 text-gold" />
            </motion.div>
            <span className="text-4xl sm:text-6xl font-serif font-bold text-foreground">
              {Number(profile?.balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xl sm:text-3xl font-semibold text-primary">
              CASET
            </span>
          </div>
          <motion.div 
            className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent/50 text-accent-foreground text-xs font-medium border border-accent-foreground/10"
            whileHover={{ scale: 1.05 }}
          >
            <TrendingUp className="size-3.5" />
            +{Number(profile?.mining_rate || 10).toFixed(1)} CASET/hr
          </motion.div>
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
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {canClaim ? (
              <motion.span 
                className="text-gold font-semibold flex items-center justify-center gap-2"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="size-4" />
                Rewards ready to claim!
                <Sparkles className="size-4" />
              </motion.span>
            ) : isMining ? (
              <>
                Cycle ends in{" "}
                <span className="text-primary font-bold font-mono text-base">{cycleDisplay}</span>
              </>
            ) : (
              <span className="text-destructive font-medium">Tap the button to start mining</span>
            )}
          </p>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Recent Activity
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          {txLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Zap className="size-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No activity yet. Start mining!</p>
            </div>
          ) : (
            transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
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
