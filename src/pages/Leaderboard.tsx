import { motion } from "framer-motion";
import { Trophy, TrendingUp, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function Leaderboard() {
  const { user } = useAuth();
  const { leaderboard, loading } = useLeaderboard();

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3, 20);
  const userRank = leaderboard.find((entry) => entry.user_id === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 lg:py-10 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Trophy className="size-6 sm:size-7 text-gold" />
            Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Top miners worldwide
          </p>
        </div>
      </header>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No miners on the leaderboard yet. Start mining to be the first!
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <motion.div
              className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 2nd Place */}
              <div className="order-1 flex flex-col items-center pt-6 sm:pt-8">
                <div className="relative">
                  <div className="size-16 sm:size-20 md:size-24 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg">
                    <div className="size-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                      <span className="text-xl sm:text-2xl md:text-3xl">🥈</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-secondary text-foreground text-xs font-bold px-2 sm:px-3 py-1 rounded-full border border-border">
                    #2
                  </div>
                </div>
                <h3 className="mt-4 sm:mt-6 font-display font-bold text-foreground text-xs sm:text-sm md:text-base text-center truncate max-w-full px-1">
                  {topThree[1]?.user_id === user?.id ? "You" : topThree[1]?.display_name || "Miner"}
                </h3>
                <p className="text-primary font-bold text-sm sm:text-lg md:text-xl">
                  {Number(topThree[1]?.total_mined || 0).toLocaleString()}
                </p>
              </div>

              {/* 1st Place */}
              <div className="order-0 sm:order-1 flex flex-col items-center">
                <div className="relative">
                  <motion.div
                    className="size-20 sm:size-24 md:size-32 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="size-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                      <Crown className="size-8 sm:size-10 md:size-14 text-gold" />
                    </div>
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-gold">
                    #1
                  </div>
                </div>
                <h3 className="mt-4 sm:mt-6 font-display font-bold text-foreground text-sm sm:text-base md:text-lg text-center truncate max-w-full px-1">
                  {topThree[0]?.user_id === user?.id ? "You" : topThree[0]?.display_name || "Miner"}
                </h3>
                <p className="text-primary font-bold text-lg sm:text-xl md:text-2xl">
                  {Number(topThree[0]?.total_mined || 0).toLocaleString()}
                </p>
              </div>

              {/* 3rd Place */}
              <div className="order-2 flex flex-col items-center pt-10 sm:pt-12">
                <div className="relative">
                  <div className="size-14 sm:size-16 md:size-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center shadow-lg">
                    <div className="size-[calc(100%-8px)] rounded-full bg-card flex items-center justify-center">
                      <span className="text-lg sm:text-xl md:text-2xl">🥉</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold px-2 sm:px-3 py-1 rounded-full border border-orange-200 dark:border-orange-700">
                    #3
                  </div>
                </div>
                <h3 className="mt-4 sm:mt-6 font-display font-bold text-foreground text-xs sm:text-sm md:text-base text-center truncate max-w-full px-1">
                  {topThree[2]?.user_id === user?.id ? "You" : topThree[2]?.display_name || "Miner"}
                </h3>
                <p className="text-primary font-bold text-sm sm:text-lg md:text-xl">
                  {Number(topThree[2]?.total_mined || 0).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}

          {/* Leaderboard Table */}
          {restOfList.length > 0 && (
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-card overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-secondary/50 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                <div className="col-span-2">Rank</div>
                <div className="col-span-6">Miner</div>
                <div className="col-span-4 text-right">Mined</div>
              </div>

              {/* Rows */}
              {restOfList.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border last:border-0 transition-colors ${
                    entry.user_id === user?.id
                      ? "bg-accent/50"
                      : "hover:bg-secondary/30"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-bold text-muted-foreground">
                      {entry.rank}
                    </span>
                  </div>
                  <div className="col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="size-8 sm:size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground text-sm truncate">
                      {entry.user_id === user?.id ? "You" : entry.display_name || "Miner"}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center justify-end">
                    <span className="font-mono font-bold text-foreground text-sm">
                      {Number(entry.total_mined).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Your Position (if not in top 20) */}
              {userRank && userRank.rank > 20 && (
                <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-accent/50 border-t-2 border-primary/30">
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-bold text-primary">{userRank.rank}</span>
                  </div>
                  <div className="col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="size-8 sm:size-10 rounded-full bg-gradient-to-br from-primary to-gold border-2 border-primary flex-shrink-0" />
                    <span className="font-bold text-foreground text-sm">You</span>
                  </div>
                  <div className="col-span-4 flex items-center justify-end gap-1">
                    <span className="font-mono font-bold text-primary text-sm">
                      {Number(userRank.total_mined).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
