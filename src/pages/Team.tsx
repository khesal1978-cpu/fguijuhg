import { useState, forwardRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Zap, Copy, Share2, Plus, Loader2, Gift, UserPlus, TrendingUp, Link2, ChevronRight, Shield } from "lucide-react";
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

const TeamInner = forwardRef<HTMLDivElement, object>(function Team(_, ref) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { directReferrals, indirectReferrals, stats, loading, claiming, claimBonuses } = useReferrals();
  const [activeTab, setActiveTab] = useState<"direct" | "indirect">("direct");
  
  const currentTier = getMultiplierTier(stats.activeReferrals);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareReferralLink = async () => {
    const link = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join PingCaset",
          text: "Start mining crypto with me!",
          url: link,
        });
      } catch (error) {
        // User cancelled or permission denied - fallback to clipboard
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(link);
          toast.success("Link copied!");
        }
      }
    } else {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    }
  };

  const handleClaimBonuses = async () => {
    const result = await claimBonuses();
    if (result.total > 0) {
      toast.success(`Claimed ${result.total} CASET from ${result.claimed} referral(s)!`);
    } else {
      toast.info("No pending bonuses to claim");
    }
  };

  const displayedReferrals = activeTab === "direct" ? directReferrals : indirectReferrals;

  return (
    <div ref={ref} className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
      {/* Header with Claim Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">Invite friends & earn together</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClaimBonuses}
          disabled={claiming}
          className="flex items-center gap-1.5"
        >
          {claiming ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Gift className="size-4" />
          )}
          Claim
        </Button>
      </motion.div>

      {/* Security Groups Card */}
      <motion.button
        onClick={() => navigate('/groups')}
        className="w-full card-glass-strong p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="size-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-base font-semibold text-foreground">Security Groups</p>
            <p className="text-xs text-muted-foreground">Join groups • Earn together</p>
          </div>
        </div>
        <ChevronRight className="size-5 text-foreground/40" />
      </motion.button>
      {/* Stats Overview */}
      <motion.div 
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Direct Stats */}
        <div className="card-glass-strong p-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <UserPlus className="size-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground/70">Direct</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{stats.directTotal}</span>
            <span className="text-xs text-foreground/50">members</span>
          </div>
          <p className="text-xs text-primary font-semibold">+{stats.directEarnings} earned</p>
        </div>

        {/* Indirect Stats */}
        <div className="card-glass-strong p-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-gold/20 flex items-center justify-center">
              <Link2 className="size-4 text-gold" />
            </div>
            <span className="text-xs font-semibold text-foreground/70">Indirect</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{stats.indirectTotal}</span>
            <span className="text-xs text-foreground/50">members</span>
          </div>
          <p className="text-xs text-gold font-semibold">+{stats.indirectEarnings} earned</p>
        </div>
      </motion.div>

      {/* Total Earnings Summary */}
      <motion.div
        className="card-glass-strong p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Zap className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-foreground/60">Total Team Earnings</p>
            <p className="text-xl font-display font-bold text-foreground">{stats.totalEarnings} CASET</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/60">Active</p>
          <p className="text-lg font-bold text-primary">{stats.activeReferrals}</p>
        </div>
      </motion.div>

      {/* Mining Rate Boost Card */}
      <motion.div
        className="card-glass-strong p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <TrendingUp className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Mining Rate Boost</h3>
            <p className="text-xs text-foreground/60">Active referrals boost your mining rate</p>
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
          Both direct and indirect referrals count towards your multiplier!
        </p>
      </motion.div>

      {/* Referral Card */}
      <motion.div
        className="card-glass-strong p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        {/* Bonus Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-xs font-semibold text-gold">
            <Gift className="size-4" />
            Direct: +50
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold text-primary">
            <Link2 className="size-4" />
            Indirect: +25
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/15 border border-success/30 text-xs font-semibold text-success">
            <UserPlus className="size-4" />
            Friend: +100
          </span>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-foreground">2-Tier Referral System</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Earn from your referrals AND their referrals too!
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

      {/* Team Members with Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("direct")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "direct"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-white/[0.06] text-foreground/70 border border-white/[0.1] hover:bg-white/[0.1]"
            }`}
          >
            <UserPlus className="size-4" />
            Direct ({stats.directTotal})
          </button>
          <button
            onClick={() => setActiveTab("indirect")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "indirect"
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-white/[0.06] text-foreground/70 border border-white/[0.1] hover:bg-white/[0.1]"
            }`}
          >
            <Link2 className="size-4" />
            Indirect ({stats.indirectTotal})
          </button>
        </div>

        {/* Tab Description */}
        <p className="text-xs text-foreground/50 mb-3 px-1">
          {activeTab === "direct" 
            ? "Friends who signed up using your referral code"
            : "Friends of your friends (2nd level referrals)"
          }
        </p>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="size-6 animate-spin text-foreground/40" />
          </div>
        ) : displayedReferrals.length === 0 ? (
          <div className="card-glass-strong p-8 text-center border-2 border-dashed border-white/[0.1]">
            <Plus className="size-10 text-foreground/20 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground/70">
              {activeTab === "direct" ? "No direct referrals yet" : "No indirect referrals yet"}
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              {activeTab === "direct" 
                ? "Share your code to grow your team"
                : "Your direct referrals need to invite friends"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayedReferrals.map((referral, i) => (
                <motion.div
                  key={referral.id}
                  className="card-glass-subtle p-4 flex items-center gap-3"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <div className={`size-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg ${
                    activeTab === "direct"
                      ? "bg-gradient-to-br from-primary to-violet-500 shadow-primary/30"
                      : "bg-gradient-to-br from-gold to-amber-500 shadow-gold/30"
                  }`}>
                    {(referral.referred_profile?.display_name || "M")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {referral.referred_profile?.display_name || "Miner"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <span>
                        {((referral.created_at as any)?.toDate?.() ?? new Date(referral.created_at as any)).toLocaleDateString()}
                      </span>
                      {referral.is_active && (
                        <span className="flex items-center gap-1 text-success">
                          <span className="size-1.5 rounded-full bg-success animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                    activeTab === "direct"
                      ? "text-primary bg-primary/15 border-primary/20"
                      : "text-gold bg-gold/15 border-gold/20"
                  }`}>
                    <Zap className="size-4" />
                    +{Number(referral.bonus_earned).toFixed(0)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
});

export default memo(TeamInner);
