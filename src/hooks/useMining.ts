import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MiningSession,
  getActiveSession,
  subscribeToMiningSession,
  startMiningSession as firebaseStartMining,
  claimMiningReward as firebaseClaimReward
} from "@/lib/firebase";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import { toast } from "sonner";

export function useMining() {
  const { user, refreshProfile } = useAuth();
  const { showMiningAd, trackMiningSession, isNative } = useRewardedAd();
  const [activeSession, setActiveSession] = useState<MiningSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isMountedRef = useRef(true);

  const fetchActiveSession = useCallback(async () => {
    if (!user?.uid || !isMountedRef.current) return;

    try {
      const session = await getActiveSession(user.uid);
      if (isMountedRef.current) {
        setActiveSession(session);
      }
    } catch (error) {
      console.error('Error fetching mining session:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchActiveSession();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchActiveSession]);

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;
    let isActive = true;
    
    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      
      try {
        unsubscribe = subscribeToMiningSession(user.uid, (session) => {
          if (isActive && isMountedRef.current) {
            setActiveSession(session);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error subscribing to mining session:', error);
      }
    }, 100);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {}
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!activeSession) {
      setTimeRemaining(null);
      setProgress(0);
      return;
    }

    let animationFrameId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 1000;

    const updateTimer = (timestamp: number) => {
      if (!isMountedRef.current) return;
      
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

      // Track session count and show ad for sessions 2 & 4
      const sessionNumber = await trackMiningSession();
      
      // Show ad after starting for sessions 2 and 4
      if (isNative && (sessionNumber === 2 || sessionNumber === 4)) {
        const adCompleted = await showMiningAd('after_start');
        if (!adCompleted) {
          // Ad was skipped, but we already started the session
          toast.info("Watch ads to support the app! ⛏️");
        }
      }

      toast.success("Mining session started! ⛏️");
      await fetchActiveSession();
      return true;
    } catch (error) {
      console.error('Error starting mining:', error);
      toast.error("An error occurred. Please try again.");
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [user?.uid, isProcessing, fetchActiveSession, trackMiningSession, showMiningAd, isNative]);

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
      // For session 3, show ad before claiming
      if (isNative) {
        const adCompleted = await showMiningAd('before_claim');
        if (!adCompleted) {
          toast.info("Watch the ad to claim your reward");
          setIsProcessing(false);
          return false;
        }
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
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error("An error occurred. Please try again.");
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [activeSession, user?.uid, progress, isProcessing, fetchActiveSession, refreshProfile, showMiningAd, isNative]);

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
