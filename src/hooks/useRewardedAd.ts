import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeAdMob, showRewardedAd, prepareRewardedAd, isNativePlatform, calculateAdGameReward } from '@/lib/admob';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, addDoc, collection, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface UseRewardedAdOptions {
  rewardAmount?: number;
  rewardType?: 'coins' | 'spin' | 'scratch';
}

// Get today's session count from Firestore
const getTodaySessionCount = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = doc(db, 'user_ad_stats', `${userId}_${today}`);
  const snap = await getDoc(statsRef);
  return snap.exists() ? (snap.data().mining_sessions || 0) : 0;
};

// Increment today's session count
const incrementSessionCount = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = doc(db, 'user_ad_stats', `${userId}_${today}`);
  const snap = await getDoc(statsRef);
  const currentCount = snap.exists() ? (snap.data().mining_sessions || 0) : 0;
  const newCount = currentCount + 1;
  await setDoc(statsRef, { mining_sessions: newCount, date: today, user_id: userId }, { merge: true });
  return newCount;
};

// Get team claim count
const getTeamClaimCount = async (userId: string): Promise<number> => {
  const statsRef = doc(db, 'user_ad_stats', `${userId}_team_claims`);
  const snap = await getDoc(statsRef);
  return snap.exists() ? (snap.data().claim_count || 0) : 0;
};

// Increment team claim count
const incrementTeamClaimCount = async (userId: string): Promise<number> => {
  const statsRef = doc(db, 'user_ad_stats', `${userId}_team_claims`);
  const snap = await getDoc(statsRef);
  const currentCount = snap.exists() ? (snap.data().claim_count || 0) : 0;
  const newCount = currentCount + 1;
  await setDoc(statsRef, { claim_count: newCount, user_id: userId }, { merge: true });
  return newCount;
};

export function useRewardedAd(options: UseRewardedAdOptions = {}) {
  const { rewardAmount = 10, rewardType = 'coins' } = options;
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (isNativePlatform()) {
        const success = await initializeAdMob();
        setIsInitialized(success);
        setIsAvailable(success);
      }
    };
    init();
  }, []);

  // Watch ad and get reward
  const watchAd = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !profile) {
      toast.error('Please sign in to watch ads');
      return false;
    }

    if (!isNativePlatform()) {
      toast.info('Rewarded ads only work on mobile devices');
      return false;
    }

    setIsLoading(true);

    try {
      const reward = await showRewardedAd();

      if (reward) {
        const profileRef = doc(db, 'profiles', user.uid);
        
        await updateDoc(profileRef, {
          balance: (profile.balance || 0) + rewardAmount,
        });

        await refreshProfile();
        toast.success(`+${rewardAmount} CASET earned! 🎉`);
        
        await prepareRewardedAd();
        
        return true;
      } else {
        toast.info('Watch the full ad to earn rewards');
        return false;
      }
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      toast.error('Failed to load ad. Try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, profile, rewardAmount, refreshProfile]);

  // Watch ad for free game (spin/scratch) with limited rewards
  const watchAdForFreeGame = useCallback(async (): Promise<{ success: boolean; reward: number }> => {
    if (!user?.uid || !profile) {
      toast.error('Please sign in to watch ads');
      return { success: false, reward: 0 };
    }

    if (!isNativePlatform()) {
      toast.info('Rewarded ads only work on mobile devices');
      return { success: false, reward: 0 };
    }

    setIsLoading(true);

    try {
      const adReward = await showRewardedAd();

      if (adReward) {
        // Calculate reward: 40% = 10, 60% = 0
        const gameReward = calculateAdGameReward();
        
        if (gameReward > 0) {
          const profileRef = doc(db, 'profiles', user.uid);
          await updateDoc(profileRef, {
            balance: (profile.balance || 0) + gameReward,
          });

          // Add transaction
          await addDoc(collection(db, 'transactions'), {
            user_id: user.uid,
            type: rewardType === 'spin' ? 'ad_spin' : 'ad_scratch',
            amount: gameReward,
            description: `Free ${rewardType === 'spin' ? 'spin' : 'scratch'} via ad`,
            created_at: Timestamp.now(),
            metadata: { source: 'rewarded_ad' },
          });

          await refreshProfile();
          toast.success(`+${gameReward} CASET won! 🎉`);
        } else {
          toast.info('Unlucky! Try again next time 💀');
        }
        
        await prepareRewardedAd();
        
        return { success: true, reward: gameReward };
      } else {
        toast.info('Watch the full ad to play');
        return { success: false, reward: 0 };
      }
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      toast.error('Failed to load ad. Try again later.');
      return { success: false, reward: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, profile, rewardType, refreshProfile]);

  // Show ad for mining session (based on session number and timing)
  const showMiningAd = useCallback(async (timing: 'after_start' | 'before_claim'): Promise<boolean> => {
    if (!user?.uid || !isNativePlatform()) return true; // Skip if not native

    try {
      const sessionCount = await getTodaySessionCount(user.uid);
      
      // Determine if ad should show based on session number
      // Session 2 & 4: after_start
      // Session 3: before_claim
      const shouldShowAd = (
        (timing === 'after_start' && (sessionCount === 2 || sessionCount === 4)) ||
        (timing === 'before_claim' && sessionCount === 3)
      );

      if (!shouldShowAd) return true;

      setIsLoading(true);
      const reward = await showRewardedAd();
      setIsLoading(false);

      if (!reward) {
        toast.info('Watch the ad to continue');
        return false;
      }

      await prepareRewardedAd();
      return true;
    } catch (error) {
      console.error('Error with mining ad:', error);
      return true; // Allow to continue on error
    }
  }, [user?.uid]);

  // Increment session count (call when starting a new mining session)
  const trackMiningSession = useCallback(async (): Promise<number> => {
    if (!user?.uid) return 0;
    return await incrementSessionCount(user.uid);
  }, [user?.uid]);

  // Show ad for team claim (every other claim)
  const showTeamClaimAd = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !isNativePlatform()) return true;

    try {
      const claimCount = await incrementTeamClaimCount(user.uid);
      
      // Show ad on 2nd, 4th, 6th... claims
      if (claimCount % 2 !== 0) return true;

      setIsLoading(true);
      const reward = await showRewardedAd();
      setIsLoading(false);

      if (!reward) {
        toast.info('Watch the ad to claim your bonus');
        return false;
      }

      await prepareRewardedAd();
      return true;
    } catch (error) {
      console.error('Error with team claim ad:', error);
      return true;
    }
  }, [user?.uid]);

  return {
    watchAd,
    watchAdForFreeGame,
    showMiningAd,
    trackMiningSession,
    showTeamClaimAd,
    isLoading,
    isAvailable,
    isInitialized,
    isNative: isNativePlatform(),
  };
}
