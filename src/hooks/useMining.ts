import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized fetch active session
  const fetchActiveSession = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const session = await getActiveSession(user.uid);
      setActiveSession(session);
    } catch (error) {
      console.error('Error fetching mining session:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Subscribe to mining session changes
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToMiningSession(user.uid, (session) => {
      setActiveSession(session);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate time remaining and progress with optimized updates
  useEffect(() => {
    if (!activeSession) {
      setTimeRemaining(null);
      setProgress(0);
      return;
    }

    let animationFrameId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 1000; // Update every second

    const updateTimer = (timestamp: number) => {
      if (timestamp - lastUpdate >= UPDATE_INTERVAL) {
        lastUpdate = timestamp;
        
        const now = Date.now();
        const endsAt = activeSession.ends_at.toDate().getTime();
        const startedAt = activeSession.started_at.toDate().getTime();
        const totalDuration = endsAt - startedAt;
        const elapsed = now - startedAt;
        const remaining = endsAt - now;

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
      }
      
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeSession]);

  // Memoized start mining with debounce protection
  const startMining = useCallback(async () => {
    if (!user?.uid) {
      toast.error("Please sign in to start mining");
      return false;
    }

    if (isProcessing) {
      return false;
    }

    setIsProcessing(true);

    try {
      const result = await firebaseStartMining(user.uid);

      if (!result.success) {
        toast.error(result.error || "Failed to start mining");
        return false;
      }

      toast.success("Mining session started! ⛏️");
      await fetchActiveSession();
      return true;
    } catch (error) {
      console.error('Error starting mining:', error);
      toast.error("An error occurred. Please try again.");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user?.uid, isProcessing, fetchActiveSession]);

  // Memoized claim reward with debounce protection
  const claimReward = useCallback(async () => {
    if (!activeSession || !user?.uid) {
      toast.error("No active session to claim");
      return false;
    }

    if (progress < 100) {
      toast.error("Mining session not complete yet");
      return false;
    }

    if (isProcessing) {
      return false;
    }

    setIsProcessing(true);

    try {
      const result = await firebaseClaimReward(user.uid, activeSession.id);

      if (!result.success) {
        toast.error(result.error || "Failed to claim reward");
        return false;
      }

      toast.success(`+${result.amount} CASET claimed! 🎉`);
      await fetchActiveSession();
      await refreshProfile();
      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error("An error occurred. Please try again.");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [activeSession, user?.uid, progress, isProcessing, fetchActiveSession, refreshProfile]);

  // Memoized derived state
  const derivedState = useMemo(() => ({
    canStartMining: !activeSession && !isProcessing,
    canClaim: activeSession && progress >= 100 && !isProcessing,
    isMining: activeSession && progress < 100,
  }), [activeSession, progress, isProcessing]);

  return {
    activeSession,
    timeRemaining,
    progress,
    loading,
    startMining,
    claimReward,
    ...derivedState,
    isProcessing,
    refreshSession: fetchActiveSession,
  };
}
