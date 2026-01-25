import { useState, useEffect, useCallback, useRef } from "react";
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
  
  // Track mounted state
  const isMountedRef = useRef(true);

  const fetchTasks = useCallback(async () => {
    if (!user?.uid || !isMountedRef.current) return;

    try {
      const data = await getDailyTasks(user.uid);
      if (isMountedRef.current) {
        setTasks(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  // Initial mount and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Subscribe to task changes with proper cleanup
  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    // Delay subscription to avoid rapid mount/unmount issues
    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      
      try {
        unsubscribe = subscribeToTasks(user.uid, (updatedTasks) => {
          if (isActive && isMountedRef.current) {
            setTasks(updatedTasks);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error subscribing to tasks:', error);
        // Fallback to one-time fetch
        fetchTasks();
      }
    }, 100);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Ignore unsubscribe errors during cleanup
        }
      }
    };
  }, [user?.uid, fetchTasks]);

  const playSpin = async (): Promise<SpinResult> => {
    if (!user?.uid) {
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
      if (isMountedRef.current) {
        setSpinning(false);
      }
    }
  };

  const playScratch = async (): Promise<ScratchResult> => {
    if (!user?.uid) {
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
      if (isMountedRef.current) {
        setScratching(false);
      }
    }
  };

  const claimTask = async (taskId: string): Promise<boolean> => {
    if (!user?.uid) {
      toast.error("Please sign in");
      return false;
    }

    try {
      const result = await claimTaskReward(user.uid, taskId);

      if (!result.success) {
        toast.error(result.error || "Failed to claim");
        return false;
      }

      toast.success(`+${result.reward} CASET claimed! 🎉`);
      await refreshProfile();
      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error claiming task:', error);
      toast.error("Failed to claim reward");
      return false;
    }
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
