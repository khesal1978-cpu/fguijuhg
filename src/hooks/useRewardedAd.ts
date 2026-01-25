import { useState, useEffect, useCallback } from 'react';
import { initializeAdMob, showRewardedAd, prepareRewardedAd, isNativePlatform } from '@/lib/admob';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface UseRewardedAdOptions {
  rewardAmount?: number;
  rewardType?: 'coins' | 'spin' | 'scratch';
}

export function useRewardedAd(options: UseRewardedAdOptions = {}) {
  const { rewardAmount = 10, rewardType = 'coins' } = options;
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize AdMob on mount
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
      // For web, simulate the reward (development/testing only)
      toast.info('Rewarded ads only work on mobile devices');
      return false;
    }

    setIsLoading(true);

    try {
      const reward = await showRewardedAd();

      if (reward) {
        // User successfully watched the ad - give them the reward
        const profileRef = doc(db, 'profiles', user.uid);
        
        await updateDoc(profileRef, {
          balance: (profile.balance || 0) + rewardAmount,
        });

        await refreshProfile();
        toast.success(`+${rewardAmount} CASET earned! 🎉`);
        
        // Pre-load the next ad
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

  return {
    watchAd,
    isLoading,
    isAvailable,
    isInitialized,
    isNative: isNativePlatform(),
  };
}
