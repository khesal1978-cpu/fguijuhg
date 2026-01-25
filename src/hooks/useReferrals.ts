import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Referral, getReferrals, subscribeToReferrals, claimPendingBonuses } from "@/lib/firebase";

export function useReferrals() {
  const { user, refreshProfile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  // Memoized fetch function
  const fetchReferrals = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching referrals for user:', user.uid);
      const data = await getReferrals(user.uid);
      console.log('Fetched referrals:', data.length);
      setReferrals(data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Subscribe to referral changes (real-time updates)
  useEffect(() => {
    if (!user?.uid) return;

    console.log('Subscribing to referrals for user:', user.uid);
    const unsubscribe = subscribeToReferrals(user.uid, (data) => {
      console.log('Real-time referral update:', data.length);
      setReferrals(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Memoized claim bonuses with debounce protection
  const claimBonuses = useCallback(async () => {
    if (!user?.uid || claiming) return { claimed: 0, total: 0 };
    
    setClaiming(true);
    try {
      const result = await claimPendingBonuses(user.uid);
      if (result.total > 0) {
        // Refresh profile to show updated balance
        await refreshProfile();
      }
      return result;
    } catch (error) {
      console.error('Error claiming bonuses:', error);
      return { claimed: 0, total: 0 };
    } finally {
      setClaiming(false);
    }
  }, [user?.uid, claiming, refreshProfile]);

  // Memoized direct and indirect referrals
  const directReferrals = useMemo(() => 
    referrals.filter((r) => r.level === 1 || !r.level),
    [referrals]
  );

  const indirectReferrals = useMemo(() => 
    referrals.filter((r) => r.level === 2),
    [referrals]
  );

  // Memoized stats calculation
  const stats = useMemo(() => {
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.length;
    const totalEarnings = referrals.reduce((sum, r) => sum + (r.bonus_earned || 0), 0);
    
    // Direct stats
    const directTotal = directReferrals.length;
    const directActive = directReferrals.length;
    const directEarnings = directReferrals.reduce((sum, r) => sum + (r.bonus_earned || 0), 0);
    
    // Indirect stats
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
