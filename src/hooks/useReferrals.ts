import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Referral, getReferrals, subscribeToReferrals } from "@/lib/firebase";

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching referrals for user:', user.uid);
      const data = await getReferrals(user.uid);
      console.log('Fetched referrals:', data.length, data);
      setReferrals(data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Subscribe to referral changes (real-time updates)
  useEffect(() => {
    if (!user) return;

    console.log('Subscribing to referrals for user:', user.uid);
    const unsubscribe = subscribeToReferrals(user.uid, (data) => {
      console.log('Real-time referral update:', data.length, data);
      setReferrals(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Separate direct and indirect referrals
  const directReferrals = useMemo(() => 
    referrals.filter((r) => r.level === 1 || !r.level), // level 1 or undefined (legacy)
    [referrals]
  );

  const indirectReferrals = useMemo(() => 
    referrals.filter((r) => r.level === 2),
    [referrals]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const totalReferrals = referrals.length;
    // Count all referrals as active for now (is_active field was being set incorrectly)
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
    refresh: fetchReferrals 
  };
}
