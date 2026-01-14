import { motion } from "framer-motion";
import { History, Users, Zap, Clock, Loader2, Wallet as WalletIcon, TrendingUp, ArrowUpRight } from "lucide-react";
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
    <div className="px-4 py-6 md:px-8 lg:py-8 max-w-[800px] mx-auto w-full space-y-6 md:space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Wallet
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your earnings
        </p>
      </motion.header>

      {/* Balance Card */}
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-morph" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-gold/10 to-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-morph-reverse" />
        
        <div className="relative z-10 space-y-6">
          {/* Main Balance */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
                <WalletIcon className="size-4 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Balance
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-foreground">
                {Number(profile?.balance || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xl font-semibold text-primary">CASET</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="size-3.5 text-primary" />
              ≈ ${(Number(profile?.balance || 0) * 0.34).toFixed(2)} USD
            </p>
          </div>

          {/* Balance Split */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-accent/30 border border-border/50"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Available</span>
              </div>
              <p className="text-xl font-serif font-bold text-foreground">
                {Number(profile?.balance || 0).toLocaleString()}
              </p>
            </motion.div>
            <motion.div 
              className="p-4 rounded-2xl bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 rounded-full bg-gold" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-xl font-serif font-bold text-foreground">
                {Number(profile?.pending_balance || 0).toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Network: PingNet
            </div>
            <div className="relative">
              <Button 
                variant="secondary" 
                disabled 
                className="opacity-60 bg-gradient-to-r from-muted to-accent"
              >
                <ArrowUpRight className="size-4 mr-2" />
                Withdraw
              </Button>
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                SOON
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Transaction History */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
          <History className="size-4 text-primary" />
          Activity
        </h2>

        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <History className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-all duration-300"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-11 rounded-xl flex items-center justify-center ${
                      tx.type === "referral"
                        ? "bg-gradient-to-br from-gold/10 to-gold/20 text-gold-dark"
                        : "bg-gradient-to-br from-primary/10 to-accent/20 text-primary"
                    }`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary bg-gradient-to-r from-primary/5 to-accent/10 px-3 py-1.5 rounded-lg border border-primary/10">
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
