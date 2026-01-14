import { motion } from "framer-motion";
import { History, Users, Zap, Clock, Loader2, Wallet as WalletIcon } from "lucide-react";
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
    <div className="px-4 py-5 md:px-8 lg:py-8 max-w-[800px] mx-auto w-full space-y-5 md:space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Wallet
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your earnings
        </p>
      </motion.header>

      {/* Balance Card */}
      <motion.section
        className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 space-y-5">
          {/* Main Balance */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <WalletIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Balance
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                {Number(profile?.balance || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-lg font-semibold text-primary">CASET</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${(Number(profile?.balance || 0) * 0.34).toFixed(2)} USD
            </p>
          </div>

          {/* Balance Split */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="size-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Available</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {Number(profile?.balance || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="size-1.5 rounded-full bg-gold" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Pending</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {Number(profile?.pending_balance || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Network: PingNet
            </div>
            <div className="relative">
              <Button variant="secondary" disabled className="opacity-50">
                <Zap className="size-4 mr-2" />
                Withdraw
              </Button>
              <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded">
                SOON
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Transaction History */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          Activity
        </h2>

        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-full flex items-center justify-center ${
                      tx.type === "referral"
                        ? "bg-gold/10 text-gold-dark"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.description || tx.type}
                      </p>
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
                  <span className="text-sm font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                    +{Number(tx.amount).toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
