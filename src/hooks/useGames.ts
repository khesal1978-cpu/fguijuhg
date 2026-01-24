import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DailyTask,
  getDailyTasks,
  subscribeToTasks,
  playSpinWheel,
  playScratchCard,
  claimTaskReward
} from "@/lib/firebase";
import { toast } from "sonner";

interface SpinResult {
  success: boolean;
  reward?: number;
  net?: number;
  error?: string;
}

interface ScratchResult {
  success: boolean;
  reward?: number;
  net?: number;
  error?: string;
}

export function useGames() {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [scratching, setScratching] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    const data = await getDailyTasks(user.uid);
    setTasks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to task changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTasks(user.uid, (updatedTasks) => {
      setTasks(updatedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const playSpin = async (): Promise<SpinResult> => {
    if (!user) {
      toast.error("Please sign in to play");
      return { success: false, error: "Not authenticated" };
    }

    setSpinning(true);

    try {
      const result = await playSpinWheel(user.uid, 5);

      if (!result.success) {
        toast.error(result.error || "Failed to spin");
        return result;
      }

      await refreshProfile();
      return result;
    } finally {
      setSpinning(false);
    }
  };

  const playScratch = async (): Promise<ScratchResult> => {
    if (!user) {
      toast.error("Please sign in to play");
      return { success: false, error: "Not authenticated" };
    }

    setScratching(true);

    try {
      const result = await playScratchCard(user.uid, 3);

      if (!result.success) {
        toast.error(result.error || "Failed to scratch");
        return result;
      }

      await refreshProfile();
      return result;
    } finally {
      setScratching(false);
    }
  };

  const claimTask = async (taskId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    const result = await claimTaskReward(user.uid, taskId);

    if (!result.success) {
      toast.error(result.error || "Failed to claim");
      return false;
    }

    toast.success(`+${result.reward} CASET claimed! 🎉`);
    await refreshProfile();
    await fetchTasks();
    return true;
  };

  return {
    tasks,
    loading,
    spinning,
    scratching,
    playSpin,
    playScratch,
    claimTask,
    refreshTasks: fetchTasks,
  };
}
