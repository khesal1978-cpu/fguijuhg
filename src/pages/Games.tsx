import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Sparkles, TicketPercent, Gift, WifiOff } from "lucide-react";
import { SpinWheel } from "@/components/games/SpinWheel";
import { ScratchCard } from "@/components/games/ScratchCard";
import { TasksPanel } from "@/components/games/TasksPanel";
import { BonusTasksPanel } from "@/components/games/BonusTasksPanel";
import { WatchAdButton } from "@/components/games/WatchAdButton";
import { useAuth } from "@/contexts/AuthContext";
import { useGames } from "@/hooks/useGames";
import { useBonusTasks } from "@/hooks/useBonusTasks";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function Games() {
  const { profile } = useAuth();
  const { tasks, loading, spinning, scratching, playSpin, playScratch, claimTask } = useGames();
  const { bonusTasks, loading: bonusLoading, completeBonusTask, claimBonusTask, checkAndGenerateBonusTask } = useBonusTasks();
  const { isOnline } = useNetworkStatus();
  const [activeGame, setActiveGame] = useState<"spin" | "scratch">("spin");

  // Check if all daily tasks are completed to generate bonus tasks
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      checkAndGenerateBonusTask(tasks);
    }
  }, [loading, tasks, checkAndGenerateBonusTask]);

  return (
    <div className="px-4 py-6 pb-24 max-w-lg mx-auto w-full space-y-5">
      {/* Header */}
      <motion.header 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Games</h1>
          <p className="text-xs text-muted-foreground">Play & earn coins</p>
        </div>
        <motion.div 
          className="flex items-center gap-1.5 px-3 py-1.5 card-glass-subtle rounded-full"
          whileHover={{ scale: 1.02 }}
        >
          <Coins className="size-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            {Number(profile?.balance || 0).toFixed(0)}
          </span>
        </motion.div>
      </motion.header>

      {/* Watch Ad for Free Coins */}
      <WatchAdButton rewardAmount={15} />

      {/* Game Selector */}
      <motion.div 
        className="flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={() => setActiveGame("spin")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
            activeGame === "spin"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "card-glass-strong text-foreground/70 hover:text-foreground"
          }`}
        >
          <Sparkles className="size-5" />
          Spin Wheel
        </button>
        <button
          onClick={() => setActiveGame("scratch")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
            activeGame === "scratch"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "card-glass-strong text-foreground/70 hover:text-foreground"
          }`}
        >
          <TicketPercent className="size-5" />
          Scratch Card
        </button>
      </motion.div>

      {/* Active Game */}
      <motion.div
        key={activeGame}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`card-glass-strong p-6 ${!isOnline ? 'opacity-60' : ''}`}
      >
        {/* Offline Overlay */}
        {!isOnline && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <WifiOff className="size-12 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">Games Unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">Connect to internet to play</p>
          </div>
        )}
        
        {isOnline && activeGame === "spin" && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-foreground">
                Spin the Wheel
              </h2>
              <p className="text-sm text-foreground/60 mt-1">
                Win up to <span className="text-primary font-bold">500</span> coins!
              </p>
            </div>
            <SpinWheel onSpin={playSpin} spinning={spinning} cost={5} />
          </div>
        )}
        
        {isOnline && activeGame === "scratch" && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-display font-bold text-foreground">
                Scratch & Win
              </h2>
              <p className="text-sm text-foreground/60 mt-1">
                Win up to <span className="text-primary font-bold">100</span> coins!
              </p>
            </div>
            <ScratchCard onScratch={playScratch} scratching={scratching} cost={3} />
          </div>
        )}
      </motion.div>

      {/* Bonus Tasks (shown when daily tasks are all completed) */}
      {bonusTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="card-glass-strong p-5"
        >
          <BonusTasksPanel 
            tasks={bonusTasks} 
            loading={bonusLoading} 
            onComplete={completeBonusTask}
            onClaim={claimBonusTask}
          />
        </motion.div>
      )}

      {/* Daily Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass-strong p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Gift className="size-5 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground">Daily Tasks</h3>
        </div>
        <TasksPanel tasks={tasks} loading={loading} onClaimTask={claimTask} />
      </motion.div>
    </div>
  );
}
