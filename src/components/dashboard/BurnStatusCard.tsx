import { motion } from "framer-motion";
import { Flame, ShieldCheck, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { useBurning } from "@/hooks/useBurning";
import { Progress } from "@/components/ui/progress";

export function BurnStatusCard() {
  const {
    burnedAmount,
    recoveryStreak,
    totalBurned,
    totalRecovered,
    nextRecoveryAt,
    recoveryAmount,
    isAtRisk,
    hoursUntilBurn,
    recoveryProgress,
  } = useBurning();

  const hasActiveBurn = burnedAmount > 0;

  return (
    <motion.div
      className={`card-glass-strong p-4 space-y-4 ${
        isAtRisk ? "border-destructive/40" : hasActiveBurn ? "border-gold/40" : "border-primary/20"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`size-8 rounded-lg flex items-center justify-center ${
            isAtRisk 
              ? "bg-destructive/20 border border-destructive/30" 
              : hasActiveBurn 
              ? "bg-gold/20 border border-gold/30"
              : "bg-primary/20 border border-primary/30"
          }`}>
            {isAtRisk ? (
              <AlertTriangle className="size-4 text-destructive" />
            ) : hasActiveBurn ? (
              <Flame className="size-4 text-gold" />
            ) : (
              <ShieldCheck className="size-4 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isAtRisk 
                ? "Burn Warning" 
                : hasActiveBurn 
                ? "Recovery Mode"
                : "Protected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAtRisk 
                ? `${Math.floor(hoursUntilBurn)}h until penalty` 
                : hasActiveBurn 
                ? `${nextRecoveryAt} sessions to recover`
                : "Active miner status"}
            </p>
          </div>
        </div>
        
        {/* Streak Badge */}
        {recoveryStreak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <TrendingUp className="size-3" />
            {recoveryStreak} streak
          </div>
        )}
      </div>

      {/* Active Burn Info */}
      {hasActiveBurn && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Burned tokens</span>
            <span className="font-bold text-gold">{burnedAmount.toFixed(2)} CASET</span>
          </div>
          
          {/* Recovery Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Recovery progress</span>
              <span className="text-foreground font-medium">{Math.round(recoveryProgress)}%</span>
            </div>
            <Progress value={recoveryProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Complete {nextRecoveryAt} more session{nextRecoveryAt > 1 ? 's' : ''} to recover{' '}
              <span className="text-primary font-medium">{recoveryAmount.toFixed(2)} CASET</span>
            </p>
          </div>
        </div>
      )}

      {/* At Risk Warning */}
      {isAtRisk && !hasActiveBurn && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm font-medium">
            <Clock className="size-4" />
            Mine now to avoid 10% balance penalty!
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Inactive for {Math.floor(48 - hoursUntilBurn)}+ hours. Token burn activates after 48h inactivity.
          </p>
        </div>
      )}

      {/* Stats Row */}
      {(totalBurned > 0 || totalRecovered > 0) && (
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
          <div className="text-center">
            <p className="text-destructive font-semibold">{totalBurned.toFixed(0)}</p>
            <p className="text-muted-foreground">Total Burned</p>
          </div>
          <div className="text-center">
            <p className="text-primary font-semibold">{totalRecovered.toFixed(0)}</p>
            <p className="text-muted-foreground">Recovered</p>
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold">{recoveryStreak}</p>
            <p className="text-muted-foreground">Streak</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
