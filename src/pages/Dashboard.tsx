import { motion } from "framer-motion";
import { Gauge, Layers, Timer, Coins, ChevronRight, Zap, Loader2 } from "lucide-react";
import { MiningButton } from "@/components/dashboard/MiningButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useMining } from "@/hooks/useMining";
import { useTransactions } from "@/hooks/useTransactions";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
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
        className="card-dark p-5 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="size-6 text-gold" />
          <span className="text-3xl font-display font-bold text-foreground">
            {Number(profile?.balance || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-sm font-medium text-primary">CASET</span>
        </div>
        {isMining && liveEarnings > 0 && (
          <motion.p 
            className="text-xs text-primary mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            +{liveEarnings.toFixed(4)} this session
          </motion.p>
        )}
      </motion.div>

      {/* Mining Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
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

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <Link to="/wallet" className="text-xs text-primary font-medium flex items-center">
            View all <ChevronRight className="size-3" />
          </Link>
        </div>
        
        <div className="card-dark divide-y divide-border">
          {txLoading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center">
              <Zap className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                className="flex items-center justify-between p-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">
                  +{Number(tx.amount).toFixed(2)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Microsoft for Startups Badge */}
      <motion.div
        className="flex items-center justify-center gap-2 pt-2 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-xs text-muted-foreground">Supported by</span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border">
          <svg 
            viewBox="0 0 23 23" 
            className="size-4"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#f25022" d="M1 1h10v10H1z"/>
            <path fill="#00a4ef" d="M1 12h10v10H1z"/>
            <path fill="#7fba00" d="M12 1h10v10H12z"/>
            <path fill="#ffb900" d="M12 12h10v10H12z"/>
          </svg>
          <span className="text-xs font-medium text-foreground">Microsoft for Startups</span>
        </div>
      </motion.div>
    </div>
  );
}
