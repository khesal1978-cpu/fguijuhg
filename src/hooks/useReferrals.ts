import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Referral = Tables<"referrals">;

interface ReferralWithProfile extends Referral {
  referred_profile?: {
    display_name: string | null;
    total_mined: number;
    level: number;
    created_at: string;
  };
}

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<ReferralWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
  });

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    // Fetch referrals with referred user profiles
    const { data, error } = await supabase
      .from("referrals")
      .select(`
        *,
        referred_profile:profiles!referrals_referred_id_fkey(
          display_name,
          total_mined,
          level,
          created_at
        )
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReferrals(data as ReferralWithProfile[]);
      
      const total = data.length;
      const active = data.filter((r) => r.is_active).length;
      const earnings = data.reduce((sum, r) => sum + Number(r.bonus_earned), 0);
      
      setStats({
        totalReferrals: total,
        activeReferrals: active,
        totalEarnings: earnings,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Subscribe to new referrals
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("referrals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "referrals",
          filter: `referrer_id=eq.${user.id}`,
        },
        () => {
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchReferrals]);

  return { referrals, stats, loading, refresh: fetchReferrals };
}
