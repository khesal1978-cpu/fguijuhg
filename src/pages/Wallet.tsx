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
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
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
        className="card-dark p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <WalletIcon className="size-4 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Total Balance</span>
        </div>
        
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-foreground">
              {Number(profile?.balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-sm font-medium text-primary">CASET</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="size-3 text-success" />
            ≈ ${(Number(profile?.balance || 0) * 0.34).toFixed(2)} USD
          </p>
        </div>

        {/* Balance Split */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-[10px] text-muted-foreground mb-1">Available</p>
            <p className="text-lg font-display font-bold text-foreground">
              {Number(profile?.balance || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gold/5 border border-gold/20">
            <p className="text-[10px] text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-display font-bold text-foreground">
              {Number(profile?.pending_balance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Network: PingNet
          </div>
          <div className="relative">
            <Button variant="secondary" disabled className="opacity-50 text-xs h-8">
              <ArrowUpRight className="size-3 mr-1" />
              Withdraw
            </Button>
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
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
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <History className="size-4 text-primary" />
          Activity
        </h2>

        <div className="card-dark divide-y divide-border">
          {loading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center">
              <History className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                className="flex items-center justify-between p-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${
                    tx.type === "referral"
                      ? "bg-gold/10 text-gold"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">
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
