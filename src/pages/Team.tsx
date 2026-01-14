import { motion } from "framer-motion";
import { Bell, Users, Zap, Copy, Share2, Plus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function Team() {
  const { profile, user } = useAuth();
  const { referrals, stats, loading: referralsLoading } = useReferrals();
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard();

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
      toast.success("Referral link copied!");
    }
  };

  // Find current user's rank
  const userRank = leaderboard.find((entry) => entry.user_id === user?.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 sm:h-20 shrink-0 px-4 md:px-8 flex items-center justify-between z-10 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Team
          </h1>
          <p className="text-xs text-muted-foreground">
            Referrals & Network
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative p-2 rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            <Bell className="size-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10 scrollbar-hide">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <motion.div
              className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border shadow-card"
              whileHover={{ y: -2 }}
            >
              <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                Team
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                {stats.totalReferrals}
              </h3>
            </motion.div>

            <motion.div
              className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border shadow-card"
              whileHover={{ y: -2 }}
            >
              <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                Active
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                {stats.activeReferrals}
              </h3>
            </motion.div>

            <motion.div
              className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border shadow-card"
              whileHover={{ y: -2 }}
            >
              <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                Earned
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-primary">
                {stats.totalEarnings}
              </h3>
            </motion.div>
          </div>

          {/* Hero Referral Card */}
          <motion.div
            className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-glow bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-accent to-transparent" />
            <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-3xl" />

            <div className="p-4 sm:p-6 md:p-10 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 w-fit mb-4">
                <Sparkles className="size-3 sm:size-4 text-gold-dark" />
                <span className="text-[10px] sm:text-xs font-bold text-gold-dark uppercase tracking-wide">
                  Earn +50 per referral
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-3 leading-tight">
                Invite & Earn
              </h2>

              <p className="text-muted-foreground mb-6 max-w-md text-sm leading-relaxed">
                Share your code. Both you and your friend get{" "}
                <strong className="text-foreground">bonus CASET</strong>!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div
                  onClick={copyReferralCode}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 flex items-center justify-between group hover:border-primary transition-colors cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Your Code
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-foreground tracking-widest">
                      {profile?.referral_code || "LOADING..."}
                    </span>
                  </div>
                  <Copy className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <Button 
                  onClick={shareReferralLink}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-glow"
                >
                  <Share2 className="size-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Team Grid & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Members */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-lg font-display font-bold text-foreground">
                My Team ({referrals.length})
              </h3>

              {referralsLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="bg-secondary/50 border-2 border-dashed border-border p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-full bg-card shadow-card flex items-center justify-center mb-3">
                    <Plus className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground mb-1">
                    No team members yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Share your code to grow your team!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {referrals.map((referral) => (
                    <motion.div
                      key={referral.id}
                      className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-glow transition-all"
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="size-10 sm:size-12 rounded-full bg-gradient-to-br from-primary/50 to-primary" />
                          <div
                            className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-card ${
                              referral.is_active ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {referral.referred_profile?.display_name || "Miner"}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1 text-xs font-bold text-primary bg-accent px-2 py-1 rounded-md w-fit mt-2">
                            <Zap className="size-3" />
                            +{Number(referral.bonus_earned).toFixed(0)} earned
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-card rounded-2xl shadow-card border border-border flex flex-col max-h-[400px] lg:max-h-none overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-display font-bold text-foreground">
                  Leaderboard
                </h3>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {leaderboardLoading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No miners yet
                  </div>
                ) : (
                  leaderboard.slice(0, 10).map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between px-4 py-3 border-b border-border last:border-0 ${
                        entry.user_id === user?.id ? "bg-accent/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-bold ${
                            entry.rank === 1
                              ? "text-gold"
                              : entry.rank === 2
                              ? "text-muted-foreground"
                              : entry.rank === 3
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                        <div className="size-8 rounded-full bg-gradient-to-br from-primary/30 to-primary" />
                        <span className="text-sm font-semibold text-foreground truncate max-w-[80px] sm:max-w-[120px]">
                          {entry.user_id === user?.id ? "You" : entry.display_name || "Miner"}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-primary">
                        {Number(entry.total_mined).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* User Rank */}
              {userRank && userRank.rank > 10 && (
                <div className="border-t border-primary/20 bg-accent/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">
                        #{userRank.rank}
                      </span>
                      <div className="size-8 rounded-full bg-gradient-to-br from-primary to-gold" />
                      <span className="text-sm font-bold text-foreground">You</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-primary">
                      {Number(userRank.total_mined).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
