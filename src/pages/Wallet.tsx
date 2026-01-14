import { motion } from "framer-motion";
import { Bell, Settings, History, Users, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const transactions = [
  {
    id: 1,
    type: "referral",
    title: "Referral Bonus",
    subtitle: "From user @crypto_king",
    amount: "50.00",
    time: "2 mins ago",
    isPositive: true,
  },
  {
    id: 2,
    type: "mining",
    title: "Mining Reward",
    subtitle: "Daily session complete",
    amount: "12.50",
    time: "4 hours ago",
    isPositive: true,
  },
  {
    id: 3,
    type: "mining",
    title: "Mining Reward",
    subtitle: "Daily session complete",
    amount: "12.50",
    time: "Yesterday, 10:00 AM",
    isPositive: true,
  },
  {
    id: 4,
    type: "mining",
    title: "Mining Reward",
    subtitle: "Daily session complete",
    amount: "11.20",
    time: "Oct 24, 2023",
    isPositive: true,
  },
  {
    id: 5,
    type: "mining",
    title: "Mining Reward",
    subtitle: "Daily session complete",
    amount: "12.80",
    time: "Oct 23, 2023",
    isPositive: true,
  },
];

export default function Wallet() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-20 flex-none px-4 md:px-8 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Wallet Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your earnings and transactions
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative size-10 flex items-center justify-center rounded-full bg-card hover:bg-secondary text-muted-foreground transition-colors shadow-card border border-border">
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border border-card" />
          </button>
          <button className="hidden md:flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-card text-sm font-medium hover:bg-secondary text-muted-foreground transition-colors">
            <Settings className="size-4" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* Balance Hero Card */}
          <motion.section
            className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Decorative bg elements */}
            <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 bottom-0 size-40 bg-gold/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
              {/* Balance Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <Zap className="size-5 text-primary" />
                  <span className="text-sm font-medium tracking-wide uppercase">
                    Total Estimated Balance
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <h1 className="text-4xl lg:text-6xl font-display font-black text-foreground tracking-tight">
                    12,450.00
                  </h1>
                  <span className="text-xl lg:text-2xl font-bold text-primary">
                    PCT
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground font-medium">
                  ≈ $4,230.50 USD
                </div>
              </div>

              {/* Breakdown Pills */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1 bg-card/60 rounded-2xl p-4 border border-border shadow-card backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold text-primary uppercase">
                      Available
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">10,000.00</p>
                </div>
                <div className="flex-1 bg-card/60 rounded-2xl p-4 border border-gold/30 shadow-card backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full bg-gold" />
                    <span className="text-xs font-bold text-gold-dark uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">2,450.00</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-medium text-muted-foreground bg-card/50 px-3 py-1 rounded-full border border-border flex items-center gap-1">
                  <Clock className="size-3" />
                  Next Payout: 12h 45m
                </div>
                <div className="text-xs font-medium text-muted-foreground bg-card/50 px-3 py-1 rounded-full border border-border">
                  Network: PingNet Main
                </div>
              </div>

              {/* Disabled Button with Badge */}
              <div className="relative group">
                <Button
                  variant="secondary"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <Zap className="size-4 mr-2" />
                  Withdraw Funds
                </Button>
                <div className="absolute -top-3 -right-2 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md transform rotate-3 group-hover:rotate-0 transition-transform">
                  COMING SOON
                </div>
              </div>
            </div>
          </motion.section>

          {/* Transaction History */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <History className="size-5 text-muted-foreground" />
                Recent Activity
              </h3>
              <button className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
                View All
              </button>
            </div>

            {/* History List */}
            <div className="glass-panel rounded-2xl shadow-card overflow-hidden">
              <div className="flex flex-col">
                {transactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: tx.id * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`relative size-12 rounded-full flex items-center justify-center border ${
                          tx.type === "referral"
                            ? "bg-gold/10 text-gold-dark border-gold/30"
                            : "bg-accent text-primary border-primary/20"
                        }`}
                      >
                        {tx.type === "referral" ? (
                          <Users className="size-5" />
                        ) : (
                          <Zap className="size-5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {tx.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tx.subtitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded-md border border-primary/20">
                        + {tx.amount} PCT
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tx.time}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              <div className="p-3 bg-secondary/50 border-t border-border flex justify-center">
                <button className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  Load older transactions
                  <span className="text-[14px]">↓</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
