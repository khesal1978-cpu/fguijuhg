import { motion, AnimatePresence } from "framer-motion";
import { Gauge, Layers, Timer, TrendingUp, Loader2, Coins, Zap } from "lucide-react";
import { MiningButton } from "@/components/dashboard/MiningButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { useAuth } from "@/contexts/AuthContext";
import { useMining } from "@/hooks/useMining";
import { useTransactions } from "@/hooks/useTransactions";
import { useState, useEffect } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="px-4 py-6 md:px-8 lg:px-12 lg:py-10 max-w-[1400px] mx-auto w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header 
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 lg:mb-8"
        variants={itemVariants}
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Mining Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor your daily mining activities
          </p>
        </div>
        <motion.div 
          className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-card backdrop-blur-sm ${
            isMining 
              ? "bg-primary/10 border-primary/30" 
              : canClaim 
              ? "bg-gold/10 border-gold/30"
              : "bg-destructive/10 border-destructive/30"
          }`}
          animate={isMining ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className={`w-2 h-2 rounded-full ${
            isMining ? "bg-primary animate-pulse" : canClaim ? "bg-gold animate-pulse" : "bg-destructive"
          }`} />
          <span className={`text-xs font-bold ${
            isMining ? "text-primary" : canClaim ? "text-gold" : "text-destructive"
          }`}>
            {isMining ? "Mining Active" : canClaim ? "Ready to Claim" : "Inactive"}
          </span>
        </motion.div>
      </motion.header>

      {/* Hero Mining Section */}
      <motion.div
        className="glass-panel w-full rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 mb-6 lg:mb-8 flex flex-col items-center justify-center relative overflow-hidden"
        variants={itemVariants}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        
        {/* Animated background particles */}
        {isMining && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-gradient-to-t from-primary/60 to-primary/20 rounded-full"
                initial={{ 
                  x: `${Math.random() * 100}%`, 
                  y: "110%",
                  opacity: 0 
                }}
                animate={{ 
                  y: "-10%",
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        )}

        {/* Decorative corner accents */}
        <div className="hidden sm:block absolute top-8 left-8 text-primary/10">
          <Layers className="size-20" />
        </div>
        <div className="hidden sm:block absolute bottom-8 right-8 text-primary/10">
          <Gauge className="size-20" />
        </div>

        {/* Balance Display */}
        <div className="text-center mb-8 sm:mb-10 z-10">
          <motion.h3 
            className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Current Balance
          </motion.h3>
          <motion.div 
            className="flex items-center justify-center gap-2 font-display text-3xl sm:text-4xl md:text-6xl font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Coins className="size-8 sm:size-10 md:size-12 text-gold animate-bounce-subtle" />
            <span className="gradient-text bg-gradient-to-r from-foreground via-foreground to-muted-foreground">
              {Number(profile?.balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-lg sm:text-xl md:text-3xl text-primary font-semibold mt-1 sm:mt-2">
              CASET
            </span>
          </motion.div>
          <motion.div 
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent/50 text-accent-foreground text-xs font-semibold border border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <TrendingUp className="size-3.5" />
            +{Number(profile?.mining_rate || 10).toFixed(1)}/hr
          </motion.div>
        </div>

        {/* Live Earnings Counter */}
        <AnimatePresence>
          {isMining && liveEarnings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 rounded-xl px-4 py-2.5 z-10 backdrop-blur-sm"
            >
              <p className="text-xs text-muted-foreground font-medium">This Session</p>
              <p className="text-lg font-display font-bold text-primary flex items-center gap-1.5">
                <Zap className="size-4" />
                +{liveEarnings.toFixed(4)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mining Button */}
        <MiningButton 
          progress={progress} 
          isMining={isMining}
          canClaim={canClaim}
          canStart={canStartMining}
          onTap={handleMiningTap}
          miningRate={Number(profile?.mining_rate || 10)}
        />

        {/* Status Text */}
        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {canClaim ? (
              <motion.span 
                className="text-gold font-bold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ✨ Rewards ready to claim! ✨
              </motion.span>
            ) : isMining ? (
              <>Cycle Ends In: <span className="text-primary font-bold font-mono">{cycleDisplay}</span></>
            ) : (
              <span className="text-destructive">Mining inactive - Tap to start!</span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 lg:mb-8"
        variants={itemVariants}
      >
        <StatCard
          icon={<Gauge className="size-6 sm:size-7" />}
          label="Mining Rate"
          value={Number(profile?.mining_rate || 10).toFixed(2)}
          unit="CASET/hr"
          iconBg="bg-gradient-to-br from-gold/20 to-gold/5"
          iconColor="text-gold-dark"
        />
        <StatCard
          icon={<Layers className="size-6 sm:size-7" />}
          label="Total Mined"
          value={Number(profile?.total_mined || 0).toLocaleString()}
          unit="CASET"
          iconBg="bg-gradient-to-br from-primary/20 to-primary/5"
          iconColor="text-primary"
        />
        <StatCard
          icon={<Timer className="size-6 sm:size-7" />}
          label="Cycle Timer"
          value={isMining ? cycleDisplay : "Ready"}
          iconBg={isMining ? "bg-gradient-to-br from-primary/20 to-primary/5" : "bg-gradient-to-br from-destructive/20 to-destructive/5"}
          iconColor={isMining ? "text-primary" : "text-destructive"}
        />
      </motion.div>

      {/* Recent Activity */}
      <motion.div className="flex-1" variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Recent Activity
          </h3>
        </div>
        <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-card">
          {txLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions yet. Start mining to earn CASET!
            </div>
          ) : (
            transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
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
      </motion.div>
    </motion.div>
  );
}