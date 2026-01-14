import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  total_mined: number;
  level: number;
  is_premium: boolean;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_leaderboard", {
      time_period: "all",
    });

    if (!error && data) {
      setLeaderboard(data as LeaderboardEntry[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return { leaderboard, loading, refresh: fetchLeaderboard };
}
