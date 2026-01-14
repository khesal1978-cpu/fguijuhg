import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react";

const topMiners = [
  { rank: 1, name: "CryptoKing", mined: 24500, change: "+12%" },
  { rank: 2, name: "MinerX99", mined: 18200, change: "+8%" },
  { rank: 3, name: "HashQueen", mined: 15800, change: "+5%" },
];

const leaderboardData = [
  { rank: 4, name: "SarahLee", mined: 12100, change: "+3%" },
  { rank: 5, name: "Daviddi", mined: 11450, change: "+2%" },
  { rank: 6, name: "JessicaT", mined: 10200, change: "+4%" },
  { rank: 7, name: "BlockMaster", mined: 9800, change: "+1%" },
  { rank: 8, name: "HashPro", mined: 9200, change: "+6%" },
  { rank: 9, name: "CryptoWolf", mined: 8900, change: "+2%" },
  { rank: 10, name: "MineQueen", mined: 8500, change: "-1%" },
];

export default function Leaderboard() {
  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 lg:py-10 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Trophy className="size-7 text-gold" />
            Global Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Top miners from around the world
          </p>
        </div>
        <div className="flex p-1 bg-secondary rounded-xl">
          <button className="px-4 py-2 bg-card rounded-lg shadow-sm text-sm font-bold text-foreground">
            Weekly
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Monthly
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            All Time
          </button>
        </div>
      </header>

      {/* Top 3 Podium */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 2nd Place */}
        <div className="order-1 flex flex-col items-center pt-8">
          <div className="relative">
            <div className="size-20 md:size-24 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg">
              <div className="size-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                <span className="text-2xl md:text-3xl">🥈</span>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-secondary text-foreground text-xs font-bold px-3 py-1 rounded-full border border-border">
              #2
            </div>
          </div>
          <h3 className="mt-6 font-display font-bold text-foreground text-sm md:text-base">
            {topMiners[1].name}
          </h3>
          <p className="text-primary font-bold text-lg md:text-xl">
            {topMiners[1].mined.toLocaleString()}
          </p>
          <span className="text-xs text-primary font-medium">{topMiners[1].change}</span>
        </div>

        {/* 1st Place */}
        <div className="order-0 md:order-1 flex flex-col items-center">
          <div className="relative">
            <motion.div
              className="size-24 md:size-32 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="size-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                <Crown className="size-10 md:size-14 text-gold" />
              </div>
            </motion.div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-xs font-bold px-3 py-1 rounded-full shadow-gold">
              #1
            </div>
          </div>
          <h3 className="mt-6 font-display font-bold text-foreground text-base md:text-lg">
            {topMiners[0].name}
          </h3>
          <p className="text-primary font-bold text-xl md:text-2xl">
            {topMiners[0].mined.toLocaleString()}
          </p>
          <span className="text-xs text-primary font-medium">{topMiners[0].change}</span>
        </div>

        {/* 3rd Place */}
        <div className="order-2 flex flex-col items-center pt-12">
          <div className="relative">
            <div className="size-16 md:size-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center shadow-lg">
              <div className="size-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                <span className="text-xl md:text-2xl">🥉</span>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-200 dark:border-orange-700">
              #3
            </div>
          </div>
          <h3 className="mt-6 font-display font-bold text-foreground text-sm md:text-base">
            {topMiners[2].name}
          </h3>
          <p className="text-primary font-bold text-lg md:text-xl">
            {topMiners[2].mined.toLocaleString()}
          </p>
          <span className="text-xs text-primary font-medium">{topMiners[2].change}</span>
        </div>
      </motion.div>

      {/* Leaderboard Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/50 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Miner</div>
          <div className="col-span-3 text-right">Total Mined</div>
          <div className="col-span-3 text-right">Change</div>
        </div>

        {/* Rows */}
        {leaderboardData.map((user, index) => (
          <motion.div
            key={user.rank}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="col-span-1 flex items-center">
              <span className="text-sm font-bold text-muted-foreground">
                {user.rank}
              </span>
            </div>
            <div className="col-span-5 flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary" />
              <span className="font-semibold text-foreground">{user.name}</span>
            </div>
            <div className="col-span-3 flex items-center justify-end">
              <span className="font-mono font-bold text-foreground">
                {user.mined.toLocaleString()}
              </span>
            </div>
            <div className="col-span-3 flex items-center justify-end gap-1">
              <TrendingUp
                className={`size-4 ${
                  user.change.startsWith("+")
                    ? "text-primary"
                    : "text-destructive rotate-180"
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  user.change.startsWith("+")
                    ? "text-primary"
                    : "text-destructive"
                }`}
              >
                {user.change}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Your Position */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-accent/50 border-t-2 border-primary/30">
          <div className="col-span-1 flex items-center">
            <span className="text-sm font-bold text-primary">142</span>
          </div>
          <div className="col-span-5 flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-gold border-2 border-primary" />
            <span className="font-bold text-foreground">You</span>
          </div>
          <div className="col-span-3 flex items-center justify-end">
            <span className="font-mono font-bold text-primary">2,450</span>
          </div>
          <div className="col-span-3 flex items-center justify-end gap-1">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-sm font-semibold text-primary">+18%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
