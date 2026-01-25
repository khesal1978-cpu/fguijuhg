import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Referral, getReferrals, subscribeToReferrals, claimPendingBonuses } from "@/lib/firebase";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import { toast } from "sonner";

export function useReferrals() {
  const { user, refreshProfile } = useAuth();
  const { showTeamClaimAd, isNative } = useRewardedAd();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  
  const isMountedRef = useRef(true);

  const fetchReferrals = useCallback(async () => {
    if (!user?.uid || !isMountedRef.current) {
      if (isMountedRef.current) setLoading(false);
      return;
    }

    try {
      console.log('Fetching referrals for user:', user.uid);
      const data = await getReferrals(user.uid);
      if (isMountedRef.current) {
        console.log('Fetched referrals:', data.length);
        setReferrals(data);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      
      try {
        console.log('Subscribing to referrals for user:', user.uid);
        unsubscribe = subscribeToReferrals(user.uid, (data) => {
          if (isActive && isMountedRef.current) {
            console.log('Real-time referral update:', data.length);
            setReferrals(data);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error subscribing to referrals:', error);
        fetchReferrals();
      }
    }, 100);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {}
      }
    };
  }, [user?.uid, fetchReferrals]);

  // Claim bonuses with ad integration (every 2nd claim shows an ad)
  const claimBonuses = useCallback(async () => {
    if (!user?.uid || claiming) return { claimed: 0, total: 0 };
    
    setClaiming(true);
    try {
      // Show ad on every 2nd claim
      if (isNative) {
        const adCompleted = await showTeamClaimAd();
        if (!adCompleted) {
          toast.info('Watch the ad to claim your bonus');
          setClaiming(false);
          return { claimed: 0, total: 0 };
        }
      }

      const result = await claimPendingBonuses(user.uid);
      if (result.total > 0) {
        await refreshProfile();
        toast.success(`+${result.total} CASET claimed from referrals! 🎉`);
      }
      return result;
    } catch (error) {
      console.error('Error claiming bonuses:', error);
      toast.error('Failed to claim bonuses');
      return { claimed: 0, total: 0 };
    } finally {
      if (isMountedRef.current) {
        setClaiming(false);
      }
    }
  }, [user?.uid, claiming, refreshProfile, showTeamClaimAd, isNative]);

  const directReferrals = useMemo(() => 
    referrals.filter((r) => r.level === 1 || !r.level),
    [referrals]
  );

  const indirectReferrals = useMemo(() => 
    referrals.filter((r) => r.level === 2),
    [referrals]
  );

  const stats = useMemo(() => {
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.length;
    const totalEarnings = referrals.reduce((sum, r) => sum + (r.bonus_earned || 0), 0);
    
    const directTotal = directReferrals.length;
    const directActive = directReferrals.length;
    const directEarnings = directReferrals.reduce((sum, r) => sum + (r.bonus_earned || 0), 0);
    
    const indirectTotal = indirectReferrals.length;
    const indirectActive = indirectReferrals.length;
    const indirectEarnings = indirectReferrals.reduce((sum, r) => sum + (r.bonus_earned || 0), 0);
    
    return {
      totalReferrals,
      activeReferrals,
      totalEarnings,
      directTotal,
      directActive,
      directEarnings,
      indirectTotal,
      indirectActive,
      indirectEarnings,
    };
  }, [referrals, directReferrals, indirectReferrals]);

  return { 
    referrals, 
    directReferrals,
    indirectReferrals,
    stats, 
    loading,
    claiming,
    claimBonuses,
    refresh: fetchReferrals 
  };
}
