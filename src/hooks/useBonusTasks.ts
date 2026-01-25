import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { BonusTask, BONUS_TASK_TEMPLATES } from '@/types/bonusTasks';
import { toast } from 'sonner';

export function useBonusTasks() {
  const { user, profile, refreshProfile } = useAuth();
  const [bonusTasks, setBonusTasks] = useState<BonusTask[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Subscribe to bonus tasks with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!user?.uid) {
      setBonusTasks([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    // Delay subscription to prevent rapid mount/unmount issues
    const timeoutId = setTimeout(async () => {
      if (!isActive) return;

      try {
        const bonusTasksRef = collection(db, 'bonus_tasks');
        const q = query(
          bonusTasksRef,
          where('user_id', '==', user.uid)
        );

        // Try to get initial data first to check permissions
        try {
          const snapshot = await getDocs(q);
          if (!isActive || !isMountedRef.current) return;
          
          const tasks: BonusTask[] = [];
          const now = new Date();
          
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const expiresAt = data.expires_at?.toDate() || new Date();
            
            // Only include non-expired tasks
            if (expiresAt > now || !data.is_claimed) {
              tasks.push({
                id: docSnap.id,
                user_id: data.user_id,
                task_type: data.task_type,
                title: data.title,
                description: data.description,
                reward: data.reward,
                is_completed: data.is_completed,
                is_claimed: data.is_claimed,
                expires_at: expiresAt,
                created_at: data.created_at?.toDate() || new Date(),
              });
            }
          });

          // Sort by created_at desc, filter out claimed
          const activeTasks = tasks
            .filter(t => !t.is_claimed)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
          
          setBonusTasks(activeTasks);
          setLoading(false);
          
          // Now set up realtime listener
          unsubscribe = onSnapshot(
            q, 
            (snapshot) => {
              if (!isActive || !isMountedRef.current) return;
              
              const tasks: BonusTask[] = [];
              const now = new Date();
              
              snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const expiresAt = data.expires_at?.toDate() || new Date();
                
                if (expiresAt > now || !data.is_claimed) {
                  tasks.push({
                    id: docSnap.id,
                    user_id: data.user_id,
                    task_type: data.task_type,
                    title: data.title,
                    description: data.description,
                    reward: data.reward,
                    is_completed: data.is_completed,
                    is_claimed: data.is_claimed,
                    expires_at: expiresAt,
                    created_at: data.created_at?.toDate() || new Date(),
                  });
                }
              });

              const activeTasks = tasks
                .filter(t => !t.is_claimed)
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
              
              setBonusTasks(activeTasks);
            },
            (error) => {
              // Silently handle permission errors - collection may not exist yet
              if (error.code !== 'permission-denied') {
                console.error('[BONUS_TASKS] Realtime error:', error);
              }
            }
          );
        } catch (error: any) {
          // Permission denied means collection doesn't exist or no access yet - this is OK
          if (error?.code === 'permission-denied') {
            // Silently continue - bonus tasks will be created when conditions are met
            setBonusTasks([]);
            setLoading(false);
          } else {
            console.error('[BONUS_TASKS] Query error:', error);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('[BONUS_TASKS] Setup error:', error);
        if (isActive && isMountedRef.current) {
          setLoading(false);
        }
      }
    }, 150);

    return () => {
      isActive = false;
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [user?.uid]);

  // Generate a random bonus task when daily tasks are all completed
  const generateBonusTask = useCallback(async () => {
    if (!user?.uid) return null;

    // Pick a random template
    const template = BONUS_TASK_TEMPLATES[Math.floor(Math.random() * BONUS_TASK_TEMPLATES.length)];
    
    // Random reward between min and max
    const reward = Math.floor(Math.random() * (template.maxReward - template.minReward + 1)) + template.minReward;
    
    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
      const bonusTasksRef = collection(db, 'bonus_tasks');
      const docRef = await addDoc(bonusTasksRef, {
        user_id: user.uid,
        task_type: template.type,
        title: template.title,
        description: template.description,
        reward,
        is_completed: false,
        is_claimed: false,
        expires_at: Timestamp.fromDate(expiresAt),
        created_at: Timestamp.now(),
      });

      toast.success(`🎁 Bonus Task Unlocked! +${reward} CASET available`);
      
      return {
        id: docRef.id,
        ...template,
        reward,
        expires_at: expiresAt,
      };
    } catch (error) {
      console.error('Error generating bonus task:', error);
      return null;
    }
  }, [user?.uid]);

  // Complete a bonus task
  const completeBonusTask = useCallback(async (taskId: string) => {
    if (!user?.uid) return false;

    try {
      const taskRef = doc(db, 'bonus_tasks', taskId);
      await updateDoc(taskRef, { is_completed: true });
      return true;
    } catch (error) {
      console.error('Error completing bonus task:', error);
      return false;
    }
  }, [user?.uid]);

  // Claim a bonus task reward
  const claimBonusTask = useCallback(async (taskId: string) => {
    if (!user?.uid || !profile) return false;

    const task = bonusTasks.find(t => t.id === taskId);
    if (!task || !task.is_completed || task.is_claimed) {
      toast.error('Cannot claim this task');
      return false;
    }

    try {
      // Update task as claimed
      const taskRef = doc(db, 'bonus_tasks', taskId);
      await updateDoc(taskRef, { is_claimed: true });

      // Update user balance
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        balance: (profile.balance || 0) + task.reward,
      });

      // Add transaction
      const transactionsRef = collection(db, 'transactions');
      await addDoc(transactionsRef, {
        user_id: user.uid,
        type: 'bonus_task',
        amount: task.reward,
        description: `Bonus Task: ${task.title}`,
        created_at: Timestamp.now(),
        metadata: { task_type: task.task_type },
      });

      await refreshProfile();
      toast.success(`+${task.reward} CASET claimed!`);
      return true;
    } catch (error) {
      console.error('Error claiming bonus task:', error);
      toast.error('Failed to claim reward');
      return false;
    }
  }, [user?.uid, profile, bonusTasks, refreshProfile]);

  // Check if all daily tasks are completed - memoized to prevent excessive calls
  const checkAndGenerateBonusTask = useCallback(async (dailyTasks: Array<{ is_completed: boolean; is_claimed: boolean }>) => {
    if (!user?.uid) return;

    // Check if all daily tasks are completed AND claimed
    const allCompleted = dailyTasks.length > 0 && dailyTasks.every(t => t.is_completed && t.is_claimed);
    
    if (!allCompleted) return;

    // Check if we already have an active bonus task today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasActiveBonusToday = bonusTasks.some(t => {
      const taskDate = new Date(t.created_at);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    if (!hasActiveBonusToday) {
      await generateBonusTask();
    }
  }, [user?.uid, bonusTasks, generateBonusTask]);

  return {
    bonusTasks,
    loading,
    generateBonusTask,
    completeBonusTask,
    claimBonusTask,
    checkAndGenerateBonusTask,
  };
}
