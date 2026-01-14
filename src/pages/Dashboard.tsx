import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Gauge, Layers, Timer, TrendingUp } from "lucide-react";
import { MiningButton } from "@/components/dashboard/MiningButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";

export default function Dashboard() {
  const [cycleTime, setCycleTime] = useState({ hours: 4, minutes: 23, seconds: 10 });
  const [balance, setBalance] = useState(1240.5);
  const [progress, setProgress] = useState(75);

  // Simulated countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCycleTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 5;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMine = () => {
    setBalance((prev) => prev + 0.1);
    setProgress((prev) => Math.min(prev + 0.5, 100));
  };

  const formatTime = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 lg:py-10 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Mining Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor your daily mining activities.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border shadow-card">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              System Stable
            </span>
          </div>
          <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-secondary">
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
          </button>
        </div>
      </header>

      {/* Hero Mining Section */}
      <motion.div
        className="glass-panel w-full rounded-3xl p-6 md:p-12 mb-8 flex flex-col items-center justify-center relative shadow-glow overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative corner accents */}
        <div className="absolute top-8 left-8 text-primary/10">
          <Layers className="size-16" />
        </div>
        <div className="absolute bottom-8 right-8 text-primary/10">
          <Gauge className="size-16" />
        </div>

        {/* Balance Display */}
        <div className="text-center mb-10 z-10">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Current Balance
          </h3>
          <div className="flex items-center justify-center gap-2 font-display text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            <span className="gradient-text bg-gradient-to-r from-foreground to-muted-foreground">
              {balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xl md:text-3xl text-primary font-medium mt-2">
              CASET
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            <TrendingUp className="size-4" />
            +2.4% last 24h
          </div>
        </div>

        {/* Mining Button */}
        <MiningButton progress={progress} isMining={true} onTap={handleMine} />

        {/* Status Text */}
        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Cycle Status:{" "}
            <span className="text-primary font-bold">Mining Active</span>
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          icon={<Gauge className="size-7" />}
          label="Mining Speed"
          value="10.00"
          unit="CASET/hr"
          iconBg="bg-gold/10"
          iconColor="text-gold-dark"
        />
        <StatCard
          icon={<Layers className="size-7" />}
          label="Total Mined"
          value="5,400"
          unit="CASET"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<Timer className="size-7" />}
          label="Cycle Ends In"
          value={`${formatTime(cycleTime.hours)}:${formatTime(
            cycleTime.minutes
          )}:${formatTime(cycleTime.seconds)}`}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-foreground">
            Recent Mining Logs
          </h3>
          <button className="text-sm text-primary font-medium hover:text-primary-dark transition-colors">
            View All
          </button>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
          <ActivityItem
            title="Mining Cycle Completed"
            subtitle="Today, 09:30 AM"
            amount="60.00 CASET"
          />
          <ActivityItem
            title="Referral Bonus"
            subtitle="Yesterday, 04:15 PM"
            amount="15.50 CASET"
          />
          <ActivityItem
            title="Mining Cycle Completed"
            subtitle="Yesterday, 09:30 AM"
            amount="60.00 CASET"
          />
        </div>
      </div>
    </div>
  );
}
