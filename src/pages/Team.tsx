import { motion } from "framer-motion";
import { Bell, Users, Zap, Copy, Share2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const teamMembers = [
  { id: 1, name: "Julian W.", joinedDays: 2, hashrate: 45, isOnline: true },
  { id: 2, name: "Sarah Jenks", joinedDays: 5, hashrate: 32, isOnline: true },
  { id: 3, name: "Mike Ross", joinedDays: 7, hashrate: 0, isOnline: false },
  { id: 4, name: "David Kim", joinedDays: 14, hashrate: 62, isOnline: true },
];

const leaderboard = [
  { rank: 1, name: "CryptoK...", mined: 24500, isGold: true },
  { rank: 2, name: "MinerX99", mined: 18200, isSilver: true },
  { rank: 3, name: "HashQ...", mined: 15800, isBronze: true },
  { rank: 4, name: "SarahL", mined: 12100 },
  { rank: 5, name: "Daviddi", mined: 11450 },
  { rank: 6, name: "JessicaT", mined: 10200 },
];

export default function Team() {
  const copyReferralCode = () => {
    navigator.clipboard.writeText("PING-8821");
    toast.success("Referral code copied!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-20 shrink-0 px-4 md:px-8 flex items-center justify-between z-10 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">
              Dashboard
            </span>
            <span>›</span>
            <span className="text-foreground">Team & Referrals</span>
          </div>
          <h1 className="text-xl font-display font-bold text-foreground mt-1">
            Team Overview
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border border-card" />
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">Alex Morgan</p>
              <p className="text-xs text-primary font-medium">Level 4 Miner</p>
            </div>
            <div
              className="size-10 rounded-full bg-gradient-to-br from-primary to-gold border-2 border-card shadow-card"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10 scrollbar-hide">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
          {/* Top Section: Stats & Hero */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Stats Column */}
            <div className="xl:col-span-3 flex flex-col gap-4">
              <motion.div
                className="bg-card rounded-2xl p-5 border border-border shadow-card flex items-center justify-between group hover:border-primary/30 transition-colors"
                whileHover={{ y: -2 }}
              >
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                    Total Team
                  </p>
                  <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    24
                  </h3>
                </div>
                <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="size-6" />
                </div>
              </motion.div>

              <motion.div
                className="bg-card rounded-2xl p-5 border border-border shadow-card flex items-center justify-between group hover:border-primary/30 transition-colors"
                whileHover={{ y: -2 }}
              >
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                    Active Now
                  </p>
                  <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    18 <span className="text-sm font-normal text-muted-foreground">/ 24</span>
                  </h3>
                </div>
                <div className="size-12 rounded-xl bg-accent text-primary flex items-center justify-center relative">
                  <span className="animate-pulse absolute inset-0 rounded-xl bg-primary/20" />
                  <Zap className="size-6 relative z-10" />
                </div>
              </motion.div>

              <motion.div
                className="bg-card rounded-2xl p-5 border border-border shadow-card flex items-center justify-between group hover:border-primary/30 transition-colors"
                whileHover={{ y: -2 }}
              >
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                    Earnings
                  </p>
                  <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    12,500
                  </h3>
                  <p className="text-xs text-primary font-medium">+15% this week</p>
                </div>
                <div className="size-12 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </motion.div>
            </div>

            {/* Hero Referral Card */}
            <motion.div
              className="xl:col-span-9 rounded-3xl overflow-hidden relative shadow-glow bg-card border border-border flex flex-col md:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-accent to-transparent" />
              <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-3xl" />

              <div className="p-6 md:p-10 flex-1 relative z-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 w-fit mb-4">
                  <Sparkles className="size-4 text-gold-dark" />
                  <span className="text-xs font-bold text-gold-dark uppercase tracking-wide">
                    Premium Bonus Active
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4 leading-tight">
                  Invite friends & <br />
                  <span className="gradient-text bg-gradient-to-r from-primary to-primary-dark">
                    Earn Crypto Together
                  </span>
                </h2>

                <p className="text-muted-foreground mb-8 max-w-md text-sm md:text-base leading-relaxed">
                  Share your unique code. When friends join, you both get a{" "}
                  <strong className="text-foreground">500 PING</strong> starter
                  bonus and up to{" "}
                  <strong className="text-foreground">900 bonus hashrate</strong>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
                  <div
                    onClick={copyReferralCode}
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 flex items-center justify-between group hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Your Code
                      </span>
                      <span className="text-lg font-mono font-bold text-foreground tracking-widest">
                        PING-8821
                      </span>
                    </div>
                    <Copy className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <Button className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-glow shrink-0">
                    <Share2 className="size-4 mr-2" />
                    Share Link
                  </Button>
                </div>
              </div>

              {/* Illustration Area */}
              <div className="relative w-full md:w-1/3 h-48 md:h-auto bg-accent/30 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full p-8 flex items-center justify-center">
                  <div className="absolute size-48 border border-dashed border-primary/30 rounded-full animate-spin-slow" />
                  <div className="absolute size-32 border border-primary/20 rounded-full animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }} />
                  <div className="relative z-10 size-20 rounded-full bg-card shadow-xl flex items-center justify-center p-1">
                    <div className="size-full rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground">
                      <Users className="size-8" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section: Team Grid & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Grid */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-foreground">
                  My Team Network
                </h3>
                <div className="flex bg-secondary p-1 rounded-lg">
                  <button className="px-3 py-1 bg-card rounded-md shadow-sm text-xs font-bold text-foreground">
                    Grid
                  </button>
                  <button className="px-3 py-1 text-muted-foreground hover:text-foreground text-xs font-medium">
                    List
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-glow transition-all group cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div
                          className={`size-12 rounded-full bg-gradient-to-br from-primary/50 to-primary ${
                            !member.isOnline ? "grayscale opacity-70" : ""
                          }`}
                        />
                        <div
                          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-card ${
                            member.isOnline ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      </div>
                      <div>
                        <h4
                          className={`font-bold text-sm ${
                            member.isOnline
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {member.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Joined {member.joinedDays} days ago
                        </p>
                        <div
                          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md w-fit ${
                            member.isOnline
                              ? "text-primary bg-accent"
                              : "text-muted-foreground bg-secondary"
                          }`}
                        >
                          <Zap className="size-3" />
                          {member.isOnline ? `${member.hashrate} MH/s` : "Offline"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add New Card */}
                <div className="bg-secondary/50 border-2 border-dashed border-border p-4 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer min-h-[100px]">
                  <div className="size-10 rounded-full bg-card shadow-card flex items-center justify-center mb-2">
                    <Plus className="size-5 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    Invite New Member
                  </p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-card rounded-2xl shadow-card border border-border flex flex-col h-[500px] lg:h-auto overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col gap-3 bg-card z-10">
                <h3 className="text-lg font-display font-bold text-foreground">
                  Global Leaderboard
                </h3>
                <div className="flex p-1 bg-secondary rounded-xl w-full">
                  <button className="flex-1 py-1.5 rounded-lg bg-card shadow-sm text-xs font-bold text-foreground">
                    Weekly
                  </button>
                  <button className="flex-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground">
                    All Time
                  </button>
                </div>
              </div>

              {/* List Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-6">User</div>
                <div className="col-span-4 text-right">Mined</div>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-border items-center transition-colors ${
                      user.isGold
                        ? "hover:bg-gold/5"
                        : user.isBronze
                        ? "hover:bg-orange-50 dark:hover:bg-orange-900/10"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="col-span-2 flex justify-center">
                      {user.isGold ? (
                        <div className="size-6 bg-gold/20 text-gold-dark rounded-full flex items-center justify-center text-xs font-bold border border-gold/30">
                          1
                        </div>
                      ) : user.isSilver ? (
                        <div className="size-6 bg-secondary text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold border border-border">
                          2
                        </div>
                      ) : user.isBronze ? (
                        <div className="size-6 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold border border-orange-200 dark:border-orange-700">
                          3
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {user.rank}
                        </span>
                      )}
                    </div>
                    <div className="col-span-6 flex items-center gap-2">
                      <div className="size-6 rounded-full bg-gradient-to-br from-primary/30 to-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {user.name}
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      <span
                        className={`text-xs font-mono font-bold ${
                          user.rank <= 3 ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {user.mined.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Rank */}
              <div className="border-t border-primary/20 bg-accent/50 p-4">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 flex justify-center text-xs font-bold text-primary">
                    142
                  </div>
                  <div className="col-span-6 flex items-center gap-2">
                    <div className="size-6 rounded-full bg-gradient-to-br from-primary to-gold border border-primary/30" />
                    <span className="text-xs font-bold text-foreground">You</span>
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-xs font-mono font-bold text-primary">
                      2,450
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
