import { motion } from "framer-motion";
import { Users, Zap, Copy, Share2, Plus, Loader2, Gift, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";

export default function Team() {
  const { profile } = useAuth();
  const { referrals, stats, loading: referralsLoading } = useReferrals();

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
        text: "Start mining crypto with me! You'll get 50 CASET bonus!",
        url: link,
      });
    } else {
      navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
    }
  };

  const shareOnX = () => {
    const link = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    const text = encodeURIComponent(`Join me on PingCaset and start mining! Use my code ${profile?.referral_code} to get 50 CASET bonus! 🚀💰`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, "_blank");
  };

  return (
    <div className="px-4 py-5 md:px-8 lg:py-8 max-w-[1000px] mx-auto w-full space-y-5 md:space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Invite friends & earn together
        </p>
      </motion.header>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-3 gap-2 sm:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {[
          { label: "Team", value: stats.totalReferrals },
          { label: "Active", value: stats.activeReferrals },
          { label: "Earned", value: stats.totalEarnings, isPrimary: true },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-3 sm:p-4 text-center">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-xl sm:text-2xl font-display font-bold ${stat.isPrimary ? 'text-primary' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Referral Card */}
      <motion.section
        className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 space-y-4">
          {/* Bonus Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-[10px] sm:text-xs font-semibold text-gold-dark">
              <Gift className="size-3" />
              You get +25 CASET
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] sm:text-xs font-semibold text-primary">
              <UserPlus className="size-3" />
              Friend gets +50 CASET
            </span>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">
              Invite & Earn
            </h2>
            <p className="text-sm text-muted-foreground">
              Share your code and earn <strong className="text-gold-dark">25 CASET</strong> while your friend gets <strong className="text-primary">50 CASET</strong>!
            </p>
          </div>

          {/* Referral Code */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={copyReferralCode}
              className="flex-1 flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors active-scale"
            >
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Your Code
                </p>
                <p className="text-base font-mono font-bold text-foreground tracking-widest">
                  {profile?.referral_code || <Loader2 className="size-4 animate-spin inline" />}
                </p>
              </div>
              <Copy className="size-4 text-muted-foreground" />
            </button>
            <Button onClick={shareReferralLink} className="gradient-primary text-primary-foreground shadow-glow">
              <Share2 className="size-4 mr-2" />
              Share
            </Button>
          </div>

          {/* X Share */}
          <Button variant="outline" onClick={shareOnX} className="w-full sm:w-auto">
            <svg className="size-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </Button>
        </div>
      </motion.section>

      {/* Team Members */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="size-4 text-primary" />
          My Team ({referrals.length})
        </h2>

        {referralsLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-border">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No team members yet</p>
            <p className="text-xs text-muted-foreground">Share your code to grow your team!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {referrals.map((referral, index) => (
              <motion.div
                key={referral.id}
                className="glass-card p-4 rounded-xl flex items-center gap-3 hover-lift"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className="relative">
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary to-gold" />
                  <div className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                    referral.is_active ? "bg-primary" : "bg-muted"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {referral.referred_profile?.display_name || "Miner"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md flex items-center gap-1">
                  <Zap className="size-3" />
                  +{Number(referral.bonus_earned).toFixed(0)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
