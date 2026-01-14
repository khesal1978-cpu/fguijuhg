import { motion } from "framer-motion";
import { Bell, Gauge, Layers, Timer, TrendingUp, Loader2 } from "lucide-react";
import { MiningButton } from "@/components/dashboard/MiningButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { useAuth } from "@/contexts/AuthContext";
import { useMining } from "@/hooks/useMining";
import { useTransactions } from "@/hooks/useTransactions";

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

  const handleMiningTap = async () => {
    if (canClaim) {
      await claimReward();
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
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 lg:py-10 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Mining Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor your daily mining activities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border shadow-card">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              {isMining ? "Mining Active" : "Ready"}
            </span>
          </div>
          <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-secondary">
            <Bell className="size-5" />
          </button>
        </div>
      </header>

      {/* Hero Mining Section */}
      <motion.div
        className="glass-panel w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-12 mb-6 lg:mb-8 flex flex-col items-center justify-center relative shadow-glow overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative corner accents - hidden on mobile */}
        <div className="hidden sm:block absolute top-8 left-8 text-primary/10">
          <Layers className="size-16" />
        </div>
        <div className="hidden sm:block absolute bottom-8 right-8 text-primary/10">
          <Gauge className="size-16" />
        </div>

        {/* Balance Display */}
        <div className="text-center mb-6 sm:mb-10 z-10">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Current Balance
          </h3>
          <div className="flex items-center justify-center gap-2 font-display text-3xl sm:text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            <span className="gradient-text bg-gradient-to-r from-foreground to-muted-foreground">
              {Number(profile?.balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-lg sm:text-xl md:text-3xl text-primary font-medium mt-1 sm:mt-2">
              CASET
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            <TrendingUp className="size-3 sm:size-4" />
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
        />

        {/* Status Text */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {canClaim ? (
              <span className="text-gold font-bold">Rewards ready to claim!</span>
            ) : isMining ? (
              <>Cycle Ends In: <span className="text-primary font-bold">{cycleDisplay}</span></>
            ) : (
              <span>Tap to start a new mining cycle</span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 lg:mb-8">
        <StatCard
          icon={<Gauge className="size-6 sm:size-7" />}
          label="Mining Rate"
          value={Number(profile?.mining_rate || 10).toFixed(2)}
          unit="CASET/hr"
          iconBg="bg-gold/10"
          iconColor="text-gold-dark"
        />
        <StatCard
          icon={<Layers className="size-6 sm:size-7" />}
          label="Total Mined"
          value={Number(profile?.total_mined || 0).toLocaleString()}
          unit="CASET"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<Timer className="size-6 sm:size-7" />}
          label="Cycle Timer"
          value={isMining ? cycleDisplay : "Ready"}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Recent Activity
          </h3>
        </div>
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-card">
          {txLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions yet. Start mining to earn CASET!
            </div>
          ) : (
            transactions.map((tx) => (
              <ActivityItem
                key={tx.id}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
