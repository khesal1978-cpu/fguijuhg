import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type MiningSession = Tables<"mining_sessions">;

export function useMining() {
  const { user, refreshProfile } = useAuth();
  const [activeSession, setActiveSession] = useState<MiningSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch active mining session
  const fetchActiveSession = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("mining_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("is_claimed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveSession(data);
    } else {
      setActiveSession(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Calculate time remaining and progress
  useEffect(() => {
    if (!activeSession) {
      setTimeRemaining(null);
      setProgress(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const endsAt = new Date(activeSession.ends_at);
      const startedAt = new Date(activeSession.started_at);
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

  // Subscribe to mining session changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("mining-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mining_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchActiveSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchActiveSession]);

  const startMining = async () => {
    if (!user) {
      toast.error("Please sign in to start mining");
      return false;
    }

    const { data, error } = await supabase.rpc("start_mining_session");

    if (error) {
      toast.error("Failed to start mining session");
      return false;
    }

    const result = data as { success: boolean; error?: string; session_id?: string };

    if (!result.success) {
      toast.error(result.error || "Failed to start mining");
      return false;
    }

    toast.success("Mining session started! ⛏️");
    await fetchActiveSession();
    return true;
  };

  const claimReward = async () => {
    if (!activeSession) {
      toast.error("No active session to claim");
      return false;
    }

    if (progress < 100) {
      toast.error("Mining session not complete yet");
      return false;
    }

    const { data, error } = await supabase.rpc("claim_mining_reward", {
      session_id: activeSession.id,
    });

    if (error) {
      toast.error("Failed to claim reward");
      return false;
    }

    const result = data as { success: boolean; error?: string; amount?: number };

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
