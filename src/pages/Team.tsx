import { motion } from "framer-motion";
import { Users, Zap, Copy, Share2, Plus, Sparkles, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

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
    const text = encodeURIComponent(`Join me on PingCaset and start mining crypto! Use my code ${profile?.referral_code} to get 50 CASET bonus! 🚀💰`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, "_blank");
  };

  return (
    <motion.div 
      className="flex flex-col h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header 
        className="h-16 sm:h-20 shrink-0 px-4 md:px-8 flex items-center justify-between z-10"
        variants={itemVariants}
      >
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Team
          </h1>
          <p className="text-xs text-muted-foreground">
            Referrals & Network
          </p>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10 scrollbar-hide">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Stats Row */}
          <motion.div className="grid grid-cols-3 gap-2 sm:gap-4" variants={itemVariants}>
            <motion.div
              className="bg-gradient-to-br from-card to-card/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border shadow-card"
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                Team
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                {stats.totalReferrals}
              </h3>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-card to-card/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border shadow-card"
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                Active
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                {stats.activeReferrals}
              </h3>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-card to-card/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border shadow-card"
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <p className="text-muted-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                Earned
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-primary">
                {stats.totalEarnings}
              </h3>
            </motion.div>
          </motion.div>

          {/* Hero Referral Card */}
          <motion.div
            className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-glow bg-gradient-to-br from-card via-card to-card/80 border border-border"
            variants={itemVariants}
          >
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-accent/50 to-transparent" />
            <div className="absolute -right-20 -top-20 size-72 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-3xl" />
            <div className="absolute -left-10 bottom-0 size-48 bg-gradient-to-tr from-gold/10 to-transparent rounded-full blur-2xl" />

            <div className="p-5 sm:p-6 md:p-10 relative z-10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="size-3 sm:size-4 text-gold-dark" />
                  <span className="text-[10px] sm:text-xs font-bold text-gold-dark uppercase tracking-wide">
                    You get +25 CASET
                  </span>
                </motion.div>
                <motion.div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <Gift className="size-3 sm:size-4 text-primary" />
                  <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide">
                    Friend gets +50 CASET
                  </span>
                </motion.div>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-3 leading-tight">
                Invite & Earn
              </h2>

              <p className="text-muted-foreground mb-6 max-w-md text-sm leading-relaxed">
                Share your code. You earn{" "}
                <strong className="text-gold">25 CASET</strong> and your friend gets{" "}
                <strong className="text-primary">50 CASET</strong> bonus!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <motion.div
                  onClick={copyReferralCode}
                  className="flex-1 bg-gradient-to-r from-secondary to-secondary/50 border border-border rounded-xl px-4 py-3.5 flex items-center justify-between group hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Your Code
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold text-foreground tracking-widest">
                      {profile?.referral_code || (
                        <Loader2 className="size-4 animate-spin inline" />
                      )}
                    </span>
                  </div>
                  <Copy className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.div>
                <Button 
                  onClick={shareReferralLink}
                  className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-glow transition-all duration-300"
                >
                  <Share2 className="size-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Share on X Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={shareOnX}
                  variant="outline"
                  className="w-full sm:w-auto border-border hover:border-foreground hover:bg-secondary transition-all duration-300"
                >
                  <svg className="size-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Team Members Grid */}
          <motion.div className="flex flex-col gap-4" variants={itemVariants}>
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <Users className="size-5 text-primary" />
              My Team ({referrals.length})
            </h3>

            {referralsLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : referrals.length === 0 ? (
              <motion.div 
                className="bg-gradient-to-br from-secondary/50 to-secondary/20 border-2 border-dashed border-border p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center"
                whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
              >
                <motion.div 
                  className="size-14 rounded-full bg-gradient-to-br from-card to-secondary shadow-card flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Plus className="size-6 text-primary" />
                </motion.div>
                <p className="text-sm font-bold text-muted-foreground mb-1">
                  No team members yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Share your code to grow your team!
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {referrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    className="bg-gradient-to-br from-card to-card/50 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="size-10 sm:size-12 rounded-full bg-gradient-to-br from-primary/50 to-primary animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
                        <div
                          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-card ${
                            referral.is_active ? "bg-primary animate-pulse" : "bg-muted"
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
                        <div className="flex items-center gap-1 text-xs font-bold text-primary bg-gradient-to-r from-primary/15 to-primary/5 px-2 py-1 rounded-md w-fit mt-2 border border-primary/20">
                          <Zap className="size-3" />
                          +{Number(referral.bonus_earned).toFixed(0)} earned
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}