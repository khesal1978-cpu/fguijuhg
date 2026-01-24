import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface BurnStatus {
  burnedAmount: number;
  recoveryStreak: number;
  totalBurned: number;
  totalRecovered: number;
  nextRecoveryAt: number; // Sessions needed for next recovery
  recoveryAmount: number; // Amount to recover at next milestone
  isAtRisk: boolean; // >24h since last mining
  hoursUntilBurn: number; // Hours until next burn event
  recoveryProgress: number; // 0-100 progress to next recovery
}

export function useBurning(): BurnStatus {
  const { profile } = useAuth();

  return useMemo(() => {
    const burnedAmount = profile?.burned_amount || 0;
    const recoveryStreak = profile?.recovery_streak || 0;
    const totalBurned = profile?.total_burned || 0;
    const totalRecovered = profile?.total_recovered || 0;
    const lastMiningAt = profile?.last_mining_at;

    // Calculate hours since last mining
    let hoursSinceLastMining = 0;
    if (lastMiningAt) {
      const lastMiningDate = (lastMiningAt as any)?.toDate?.() ?? new Date(lastMiningAt as any);
      hoursSinceLastMining = (Date.now() - lastMiningDate.getTime()) / (1000 * 60 * 60);
    }

    // At risk if >24h since last mining
    const isAtRisk = hoursSinceLastMining > 24;
    
    // Hours until burn (48h threshold)
    const hoursUntilBurn = Math.max(0, 48 - hoursSinceLastMining);

    // Recovery milestones: every 4 sessions = recover 25% of burned
    const sessionsPerRecovery = 4;
    const sessionsUntilNextRecovery = sessionsPerRecovery - (recoveryStreak % sessionsPerRecovery);
    const nextRecoveryAt = sessionsUntilNextRecovery;

    // Calculate recovery amount (25% of remaining burned per milestone)
    const recoveryAmount = burnedAmount > 0 ? Math.min(burnedAmount, burnedAmount * 0.25) : 0;

    // Progress to next recovery (0-100)
    const recoveryProgress = ((recoveryStreak % sessionsPerRecovery) / sessionsPerRecovery) * 100;

    return {
      burnedAmount,
      recoveryStreak,
      totalBurned,
      totalRecovered,
      nextRecoveryAt,
      recoveryAmount,
      isAtRisk,
      hoursUntilBurn,
      recoveryProgress,
    };
  }, [profile]);
}
