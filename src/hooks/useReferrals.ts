import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Referral, getReferrals, subscribeToReferrals } from "@/lib/firebase";

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    const data = await getReferrals(user.uid);
    setReferrals(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Subscribe to referral changes (real-time updates)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToReferrals(user.uid, (data) => {
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
    const activeReferrals = referrals.filter((r) => r.is_active).length;
    const totalEarnings = referrals.reduce((sum, r) => sum + r.bonus_earned, 0);
    
    // Direct stats
    const directTotal = directReferrals.length;
    const directActive = directReferrals.filter((r) => r.is_active).length;
    const directEarnings = directReferrals.reduce((sum, r) => sum + r.bonus_earned, 0);
    
    // Indirect stats
    const indirectTotal = indirectReferrals.length;
    const indirectActive = indirectReferrals.filter((r) => r.is_active).length;
    const indirectEarnings = indirectReferrals.reduce((sum, r) => sum + r.bonus_earned, 0);
    
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
