import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Referral, getReferrals, subscribeToReferrals } from "@/lib/firebase";

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
  });

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    const data = await getReferrals(user.uid);
    setReferrals(data);
    
    const total = data.length;
    const active = data.filter((r) => r.is_active).length;
    const earnings = data.reduce((sum, r) => sum + r.bonus_earned, 0);
    
    setStats({
      totalReferrals: total,
      activeReferrals: active,
      totalEarnings: earnings,
    });
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Subscribe to referral changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToReferrals(user.uid, (data) => {
      setReferrals(data);
      
      const total = data.length;
      const active = data.filter((r) => r.is_active).length;
      const earnings = data.reduce((sum, r) => sum + r.bonus_earned, 0);
      
      setStats({
        totalReferrals: total,
        activeReferrals: active,
        totalEarnings: earnings,
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { referrals, stats, loading, refresh: fetchReferrals };
}
