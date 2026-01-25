import { AdMob, RewardAdOptions, RewardAdPluginEvents, AdMobRewardItem, AdLoadInfo } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Test Ad Unit IDs - REPLACE WITH YOUR PRODUCTION IDS BEFORE PUBLISHING
const REWARDED_AD_ID = {
  android: 'ca-app-pub-3940256099942544/5224354917', // Test ID
  ios: 'ca-app-pub-3940256099942544/1712485313', // Test ID
};

let isInitialized = false;
let rewardedAdLoaded = false;

// Initialize AdMob
export const initializeAdMob = async (): Promise<boolean> => {
  // Only initialize on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('[AdMob] Not on native platform, skipping initialization');
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    await AdMob.initialize({
      testingDevices: [], // Add your test device IDs here in development
      initializeForTesting: true, // Set to false in production
    });

    // Set up event listeners
    AdMob.addListener(RewardAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      console.log('[AdMob] Rewarded ad loaded:', info);
      rewardedAdLoaded = true;
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error: any) => {
      console.error('[AdMob] Rewarded ad failed to load:', error);
      rewardedAdLoaded = false;
    });

    AdMob.addListener(RewardAdPluginEvents.Showed, () => {
      console.log('[AdMob] Rewarded ad showed');
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
      console.error('[AdMob] Rewarded ad failed to show:', error);
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] Rewarded ad dismissed');
      rewardedAdLoaded = false;
      // Pre-load the next ad
      prepareRewardedAd();
    });

    isInitialized = true;
    console.log('[AdMob] Initialized successfully');
    
    // Pre-load the first rewarded ad
    await prepareRewardedAd();
    
    return true;
  } catch (error) {
    console.error('[AdMob] Initialization failed:', error);
    return false;
  }
};

// Prepare (pre-load) a rewarded ad
export const prepareRewardedAd = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform() || !isInitialized) {
    return false;
  }

  try {
    const adId = Capacitor.getPlatform() === 'ios' 
      ? REWARDED_AD_ID.ios 
      : REWARDED_AD_ID.android;

    const options: RewardAdOptions = {
      adId,
      isTesting: true, // Set to false in production
    };

    await AdMob.prepareRewardVideoAd(options);
    return true;
  } catch (error) {
    console.error('[AdMob] Failed to prepare rewarded ad:', error);
    return false;
  }
};

// Show a rewarded ad and return the reward
export const showRewardedAd = async (): Promise<AdMobRewardItem | null> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[AdMob] Not on native platform');
    return null;
  }

  if (!isInitialized) {
    await initializeAdMob();
  }

  try {
    // Create a promise that resolves when the user earns a reward
    const rewardPromise = new Promise<AdMobRewardItem | null>((resolve) => {
      let hasRewarded = false;

      const setupListeners = async () => {
        const rewardListener = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          (reward: AdMobRewardItem) => {
            console.log('[AdMob] User earned reward:', reward);
            hasRewarded = true;
            rewardListener.remove();
            resolve(reward);
          }
        );

        const dismissListener = await AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => {
            dismissListener.remove();
            if (!hasRewarded) {
              resolve(null);
            }
          }
        );

        const failListener = await AdMob.addListener(
          RewardAdPluginEvents.FailedToShow,
          () => {
            failListener.remove();
            resolve(null);
          }
        );

        // Timeout after 60 seconds
        setTimeout(() => {
          if (!hasRewarded) {
            resolve(null);
          }
        }, 60000);
      };

      setupListeners();
    });

    // Show the ad
    await AdMob.showRewardVideoAd();

    // Wait for reward
    const reward = await rewardPromise;
    return reward;
  } catch (error) {
    console.error('[AdMob] Failed to show rewarded ad:', error);
    // Try to prepare the next ad
    prepareRewardedAd();
    return null;
  }
};

// Check if a rewarded ad is ready to show
export const isRewardedAdReady = (): boolean => {
  return Capacitor.isNativePlatform() && isInitialized && rewardedAdLoaded;
};

// Check if we're on a native platform
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};
