import { motion } from "framer-motion";
import { Users, Zap, Copy, Share2, Plus, Loader2, Gift, UserPlus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";

// Mining multiplier tiers based on active referrals
const MULTIPLIER_TIERS = [
  { min: 0, max: 0, multiplier: "1.0×", label: "Base Rate" },
  { min: 1, max: 2, multiplier: "1.2×", label: "" },
  { min: 3, max: 5, multiplier: "1.7×", label: "" },
  { min: 6, max: 10, multiplier: "2.0×", label: "" },
  { min: 11, max: 20, multiplier: "2.5×", label: "MAX" },
  { min: 21, max: Infinity, multiplier: "2.5×", label: "MAX" },
];

function getMultiplierTier(activeReferrals: number) {
  return MULTIPLIER_TIERS.find(tier => activeReferrals >= tier.min && activeReferrals <= tier.max) || MULTIPLIER_TIERS[0];
}

export default function Team() {
  const { profile } = useAuth();
  const { referrals, stats, loading } = useReferrals();
  
  const currentTier = getMultiplierTier(stats.activeReferrals);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    if (navigator.share) {
      navigator.share({
        title: "Join PingCaset",
        text: "Start mining crypto with me!",
        url: link,
      });
    } else {
      navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-display font-bold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground">Invite friends & earn together</p>
      </motion.div>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { label: "Team", value: stats.totalReferrals, icon: Users },
          { label: "Active", value: stats.activeReferrals, icon: Zap },
          { label: "Earned", value: stats.totalEarnings, highlight: true },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`card-glass-strong p-4 text-center ${stat.highlight ? 'border-primary/30' : ''}`}
          >
            {stat.icon && <stat.icon className="size-5 mx-auto mb-1.5 text-foreground/70" />}
            <p className="text-xs font-medium text-foreground/60 mb-1">{stat.label}</p>
            <p className={`text-2xl font-display font-bold ${stat.highlight ? 'text-primary' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Mining Rate Boost Card */}
      <motion.div
        className="card-glass-strong p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <TrendingUp className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Mining Rate Boost</h3>
            <p className="text-xs text-foreground/60">Invite friends to increase your mining rate</p>
          </div>
        </div>

        {/* Current Multiplier */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/15 border border-primary/30">
          <span className="text-sm font-medium text-foreground/70">Your Multiplier</span>
          <span className="text-xl font-display font-bold text-primary">
            {currentTier.multiplier} {currentTier.label && <span className="text-xs text-primary/70">({currentTier.label})</span>}
          </span>
        </div>

        {/* Multiplier Tiers Table */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 text-xs font-semibold text-foreground/60 pb-2 border-b border-white/[0.1]">
            <span>Active Referrals</span>
            <span className="text-right">Mining Multiplier</span>
          </div>
          {[
            { range: "0", multiplier: "1.0× (Base Rate)" },
            { range: "1–2", multiplier: "1.2×" },
            { range: "3–5", multiplier: "1.7×" },
            { range: "6–10", multiplier: "2.0×" },
            { range: "11–20", multiplier: "2.5× (MAX)" },
            { range: "21+", multiplier: "2.5× (MAX)" },
          ].map((tier, i) => {
            const isActive = 
              (tier.range === "0" && stats.activeReferrals === 0) ||
              (tier.range === "1–2" && stats.activeReferrals >= 1 && stats.activeReferrals <= 2) ||
              (tier.range === "3–5" && stats.activeReferrals >= 3 && stats.activeReferrals <= 5) ||
              (tier.range === "6–10" && stats.activeReferrals >= 6 && stats.activeReferrals <= 10) ||
              (tier.range === "11–20" && stats.activeReferrals >= 11 && stats.activeReferrals <= 20) ||
              (tier.range === "21+" && stats.activeReferrals >= 21);

            return (
              <div 
                key={i} 
                className={`grid grid-cols-2 text-sm py-2.5 px-2 rounded-lg ${isActive ? 'text-primary font-semibold bg-primary/10' : 'text-foreground/80'}`}
              >
                <span>{tier.range}</span>
                <span className="text-right font-semibold">{tier.multiplier}</span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-foreground/50 border-l-2 border-primary/30 pl-3">
          Hard cap at 2.5× ensures controlled token supply and prevents excessive inflation.
        </p>
      </motion.div>

      {/* Referral Card */}
      <motion.div
        className="card-glass-strong p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Bonus Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-xs font-semibold text-gold">
            <Gift className="size-4" />
            You get +25
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold text-primary">
            <UserPlus className="size-4" />
            Friend gets +50
          </span>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Invite & Earn</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Share your code and earn CASET when friends join
          </p>
        </div>

        {/* Referral Code */}
        <div className="flex gap-3">
          <button
            onClick={copyReferralCode}
            className="flex-1 flex items-center justify-between p-4 rounded-xl card-glass-subtle hover:border-primary/40 transition-colors"
          >
            <div className="text-left">
              <p className="text-xs font-medium text-foreground/60">Your Code</p>
              <p className="text-lg font-mono font-bold text-foreground tracking-wider">
                {profile?.referral_code || <Loader2 className="size-5 animate-spin inline" />}
              </p>
            </div>
            <Copy className="size-5 text-foreground/50" />
          </button>
          <Button onClick={shareReferralLink} className="gradient-primary btn-glow h-auto px-5">
            <Share2 className="size-5" />
          </Button>
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="size-5 text-primary" />
          My Team ({referrals.length})
        </h2>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="size-6 animate-spin text-foreground/40" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="card-glass-strong p-8 text-center border-2 border-dashed border-white/[0.1]">
            <Plus className="size-10 text-foreground/20 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground/70">No team members yet</p>
            <p className="text-xs text-foreground/50 mt-1">Share your code to grow your team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral, i) => (
              <motion.div
                key={referral.id}
                className="card-glass-subtle p-4 flex items-center gap-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-primary/30">
                  {(referral.referred_profile?.display_name || "M")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {referral.referred_profile?.display_name || "Miner"}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {((referral.created_at as any)?.toDate?.() ?? new Date(referral.created_at as any)).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/15 px-3 py-1.5 rounded-lg border border-primary/20">
                  <Zap className="size-4" />
                  +{Number(referral.bonus_earned).toFixed(0)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}