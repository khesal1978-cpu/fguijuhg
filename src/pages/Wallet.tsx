import { motion } from "framer-motion";
import { Bell, Settings, History, Users, Zap, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";

export default function Wallet() {
  const { profile } = useAuth();
  const { transactions, loading } = useTransactions(10);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <Users className="size-5" />;
      case "mining":
        return <Zap className="size-5" />;
      default:
        return <Zap className="size-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 sm:h-20 flex-none px-4 md:px-8 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground">
            Wallet
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your earnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative size-9 sm:size-10 flex items-center justify-center rounded-full bg-card hover:bg-secondary text-muted-foreground transition-colors shadow-card border border-border">
            <Bell className="size-4 sm:size-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Balance Hero Card */}
          <motion.section
            className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Decorative bg elements */}
            <div className="absolute -right-20 -top-20 size-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 bottom-0 size-40 bg-gold/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-end justify-between">
              {/* Balance Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <Zap className="size-4 sm:size-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium tracking-wide uppercase">
                    Total Balance
                  </span>
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black text-foreground tracking-tight">
                    {Number(profile?.balance || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h1>
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                    CASET
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                  ≈ ${(Number(profile?.balance || 0) * 0.34).toFixed(2)} USD
                </div>
              </div>

              {/* Breakdown Pills */}
              <div className="flex flex-row sm:flex-row gap-3 sm:gap-4 flex-1">
                <div className="flex-1 bg-card/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-card backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-bold text-primary uppercase">
                      Available
                    </span>
                  </div>
                  <p className="text-base sm:text-xl font-bold text-foreground">
                    {Number(profile?.balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex-1 bg-card/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gold/30 shadow-card backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full bg-gold" />
                    <span className="text-[10px] sm:text-xs font-bold text-gold-dark uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-base sm:text-xl font-bold text-foreground">
                    {Number(profile?.pending_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground bg-card/50 px-2 sm:px-3 py-1 rounded-full border border-border flex items-center gap-1">
                  <Clock className="size-3" />
                  Network: PingNet
                </div>
              </div>

              {/* Disabled Button with Badge */}
              <div className="relative group w-full sm:w-auto">
                <Button
                  variant="secondary"
                  disabled
                  className="opacity-50 cursor-not-allowed w-full sm:w-auto"
                >
                  <Zap className="size-4 mr-2" />
                  Withdraw
                </Button>
                <div className="absolute -top-3 -right-2 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md transform rotate-3 group-hover:rotate-0 transition-transform">
                  SOON
                </div>
              </div>
            </div>
          </motion.section>

          {/* Transaction History */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-base sm:text-lg font-display font-bold text-foreground flex items-center gap-2">
                <History className="size-4 sm:size-5 text-muted-foreground" />
                Activity
              </h3>
            </div>

            {/* History List */}
            <div className="glass-panel rounded-xl sm:rounded-2xl shadow-card overflow-hidden">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No transactions yet
                </div>
              ) : (
                <div className="flex flex-col">
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      className="flex items-center justify-between p-3 sm:p-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`relative size-10 sm:size-12 rounded-full flex items-center justify-center border ${
                            tx.type === "referral"
                              ? "bg-gold/10 text-gold-dark border-gold/30"
                              : "bg-accent text-primary border-primary/20"
                          }`}
                        >
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-foreground truncate">
                            {tx.description || tx.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded-md border border-primary/20">
                          +{Number(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
