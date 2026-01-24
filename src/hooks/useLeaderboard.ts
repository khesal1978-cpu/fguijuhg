import { useState, useEffect, useCallback } from "react";
import { getLeaderboard } from "@/lib/firebase";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  total_mined: number;
  is_premium: boolean;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
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
