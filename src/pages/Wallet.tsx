import { motion } from "framer-motion";
import { History, Clock, Loader2, Wallet as WalletIcon, TrendingUp, ArrowUpRight, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";

export default function Wallet() {
  const { profile } = useAuth();
  const { transactions, loading } = useTransactions(10);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <Users className="size-4" />;
      default:
        return <Zap className="size-4" />;
    }
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>
        <p className="text-sm text-muted-foreground">Manage your earnings</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        className="card-glass-strong p-6 space-y-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <WalletIcon className="size-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground/70">Total Balance</span>
        </div>
        
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-foreground">
              {Number(profile?.balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-base font-semibold text-primary">CASET</span>
          </div>
          <p className="text-sm text-foreground/60 mt-2 flex items-center gap-1.5">
            <TrendingUp className="size-4 text-success" />
            ≈ ${(Number(profile?.balance || 0) * 0.34).toFixed(2)} USD
          </p>
        </div>

        {/* Balance Split */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.1]">
          <div className="p-4 rounded-xl card-glass-subtle">
            <p className="text-xs font-medium text-foreground/60 mb-1">Available</p>
            <p className="text-xl font-display font-bold text-foreground">
              {Number(profile?.balance || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gold/15 border border-gold/30">
            <p className="text-xs font-medium text-foreground/60 mb-1">Pending</p>
            <p className="text-xl font-display font-bold text-foreground">
              {Number(profile?.pending_balance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.1]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/60">
            <Clock className="size-4" />
            Network: PingNet
          </div>
          <div className="relative">
            <Button variant="secondary" disabled className="opacity-50 text-sm h-10">
              <ArrowUpRight className="size-4 mr-1.5" />
              Withdraw
            </Button>
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              SOON
            </span>
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <History className="size-5 text-primary" />
          Activity
        </h2>

        <div className="card-glass-strong divide-y divider-glass">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-foreground/40" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <History className="size-10 text-foreground/20 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground/60">No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                className="flex items-center justify-between p-4 list-item-glass"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${
                    tx.type === "referral"
                      ? "bg-gold/20 border border-gold/30 text-gold"
                      : "bg-primary/20 border border-primary/30 text-primary"
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tx.description || tx.type}</p>
                    <p className="text-xs text-foreground/60">
                      {((tx.created_at as any)?.toDate?.() ?? new Date(tx.created_at as any)).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">
                  +{Number(tx.amount).toFixed(2)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
