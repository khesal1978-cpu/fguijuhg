import { motion } from "framer-motion";
import { Users, Zap, Copy, Share2, Plus, Loader2, Gift, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";

export default function Team() {
  const { profile } = useAuth();
  const { referrals, stats, loading } = useReferrals();

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
            className={`card-dark p-3 text-center ${stat.highlight ? 'border-primary/20 bg-primary/5' : ''}`}
          >
            {stat.icon && <stat.icon className="size-4 mx-auto mb-1 text-muted-foreground" />}
            <p className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</p>
            <p className={`text-xl font-display font-bold ${stat.highlight ? 'text-primary' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Referral Card */}
      <motion.div
        className="card-dark p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Bonus Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-medium text-gold">
            <Gift className="size-3" />
            You get +25
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <UserPlus className="size-3" />
            Friend gets +50
          </span>
        </div>

        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Invite & Earn</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Share your code and earn CASET when friends join
          </p>
        </div>

        {/* Referral Code */}
        <div className="flex gap-2">
          <button
            onClick={copyReferralCode}
            className="flex-1 flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground">Your Code</p>
              <p className="text-base font-mono font-bold text-foreground tracking-wider">
                {profile?.referral_code || <Loader2 className="size-4 animate-spin inline" />}
              </p>
            </div>
            <Copy className="size-4 text-muted-foreground" />
          </button>
          <Button onClick={shareReferralLink} className="gradient-primary btn-glow h-auto px-4">
            <Share2 className="size-4" />
          </Button>
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="size-4 text-primary" />
          My Team ({referrals.length})
        </h2>

        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="card-dark p-6 text-center border-2 border-dashed">
            <Plus className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your code to grow your team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral, i) => (
              <motion.div
                key={referral.id}
                className="card-dark p-3 flex items-center gap-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="size-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {(referral.referred_profile?.display_name || "M")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {referral.referred_profile?.display_name || "Miner"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">
                  <Zap className="size-3" />
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
