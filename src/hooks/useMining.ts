import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MiningSession,
  getActiveSession,
  subscribeToMiningSession,
  startMiningSession as firebaseStartMining,
  claimMiningReward as firebaseClaimReward
} from "@/lib/firebase";
import { toast } from "sonner";

export function useMining() {
  const { user, refreshProfile } = useAuth();
  const [activeSession, setActiveSession] = useState<MiningSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch active mining session
  const fetchActiveSession = useCallback(async () => {
    if (!user) return;

    const session = await getActiveSession(user.uid);
    setActiveSession(session);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Subscribe to mining session changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMiningSession(user.uid, (session) => {
      setActiveSession(session);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate time remaining and progress
  useEffect(() => {
    if (!activeSession) {
      setTimeRemaining(null);
      setProgress(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const endsAt = activeSession.ends_at.toDate();
      const startedAt = activeSession.started_at.toDate();
      const totalDuration = endsAt.getTime() - startedAt.getTime();
      const elapsed = now.getTime() - startedAt.getTime();
      const remaining = endsAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        setProgress(100);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const startMining = async () => {
    if (!user) {
      toast.error("Please sign in to start mining");
      return false;
    }

    const result = await firebaseStartMining(user.uid);

    if (!result.success) {
      toast.error(result.error || "Failed to start mining");
      return false;
    }

    toast.success("Mining session started! ⛏️");
    await fetchActiveSession();
    return true;
  };

  const claimReward = async () => {
    if (!activeSession || !user) {
      toast.error("No active session to claim");
      return false;
    }

    if (progress < 100) {
      toast.error("Mining session not complete yet");
      return false;
    }

    const result = await firebaseClaimReward(user.uid, activeSession.id);

    if (!result.success) {
      toast.error(result.error || "Failed to claim reward");
      return false;
    }

    toast.success(`+${result.amount} CASET claimed! 🎉`);
    await fetchActiveSession();
    await refreshProfile();
    return true;
  };

  const canStartMining = !activeSession;
  const canClaim = activeSession && progress >= 100;
  const isMining = activeSession && progress < 100;

  return {
    activeSession,
    timeRemaining,
    progress,
    loading,
    startMining,
    claimReward,
    canStartMining,
    canClaim,
    isMining,
    refreshSession: fetchActiveSession,
  };
}
