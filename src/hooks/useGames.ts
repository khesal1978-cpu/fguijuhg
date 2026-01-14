import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface DailyTask {
  id: string;
  task_type: string;
  progress: number;
  target: number;
  reward: number;
  is_completed: boolean;
  is_claimed: boolean;
}

export function useGames() {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [scratching, setScratching] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_claimed", false);

    if (!error && data) {
      setTasks(data as DailyTask[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to task changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_tasks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks]);

  const playSpin = async (): Promise<SpinResult> => {
    if (!user) {
      toast.error("Please sign in to play");
      return { success: false, error: "Not authenticated" };
    }

    setSpinning(true);

    try {
      const { data, error } = await supabase.rpc("play_spin_wheel", {
        spin_cost: 5,
      });

      if (error) {
        toast.error("Failed to spin");
        return { success: false, error: error.message };
      }

      const result = data as unknown as SpinResult;

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
      const { data, error } = await supabase.rpc("play_scratch_card", {
        scratch_cost: 3,
      });

      if (error) {
        toast.error("Failed to scratch");
        return { success: false, error: error.message };
      }

      const result = data as unknown as ScratchResult;

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
    const { data, error } = await supabase.rpc("claim_task_reward", {
      task_id: taskId,
    });

    if (error) {
      toast.error("Failed to claim reward");
      return false;
    }

    const result = data as { success: boolean; reward?: number; error?: string };

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
