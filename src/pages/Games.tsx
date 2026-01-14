import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Coins, Sparkles, TicketPercent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpinWheel } from "@/components/games/SpinWheel";
import { ScratchCard } from "@/components/games/ScratchCard";
import { TasksPanel } from "@/components/games/TasksPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useGames } from "@/hooks/useGames";

export default function Games() {
  const { profile } = useAuth();
  const { tasks, loading, spinning, scratching, playSpin, playScratch, claimTask } = useGames();
  const [activeTab, setActiveTab] = useState("spin");

  return (
    <div className="px-4 py-5 md:px-8 lg:py-8 max-w-[1200px] mx-auto w-full space-y-5 md:space-y-6">
      {/* Header */}
      <motion.header 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Games
          </h1>
          <p className="text-sm text-muted-foreground">
            Play & earn CASET
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full">
          <Coins className="size-4 text-gold animate-bounce-soft" />
          <span className="text-sm font-bold text-foreground">
            {Number(profile?.balance || 0).toFixed(0)}
          </span>
        </div>
      </motion.header>

      {/* Balance Card */}
      <motion.section
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Your Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                {Number(profile?.balance || 0).toFixed(2)}
              </span>
              <span className="text-base font-semibold text-primary">CASET</span>
            </div>
          </div>
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="size-7 text-primary" />
          </div>
        </div>
      </motion.section>

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Games Section */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-11 bg-card border border-border rounded-xl p-1 mb-4">
              <TabsTrigger
                value="spin"
                className="flex-1 h-9 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm transition-all"
              >
                <Sparkles className="size-4 mr-2" />
                Spin Wheel
              </TabsTrigger>
              <TabsTrigger
                value="scratch"
                className="flex-1 h-9 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm transition-all"
              >
                <TicketPercent className="size-4 mr-2" />
                Scratch Card
              </TabsTrigger>
            </TabsList>

            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <TabsContent value="spin" className="m-0">
                <div className="text-center mb-5">
                  <h2 className="text-lg font-display font-bold text-foreground mb-1">
                    Spin the Wheel
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Win up to <span className="text-gold font-semibold">500 CASET</span>!
                  </p>
                </div>
                <SpinWheel onSpin={playSpin} spinning={spinning} cost={5} />
                
                {/* Odds */}
                <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Win Chances
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { value: '10', chance: '70%' },
                      { value: '20', chance: '20%' },
                      { value: '50', chance: '7%', gold: true },
                      { value: '100', chance: '2%' },
                      { value: '500', chance: '1%', gold: true },
                    ].map((item, i) => (
                      <div key={i} className={`p-2 bg-card rounded-lg border ${item.gold ? 'border-gold/20' : 'border-border'}`}>
                        <p className={`text-sm font-bold ${item.gold ? 'text-gold' : 'text-foreground'}`}>{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">{item.chance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scratch" className="m-0">
                <div className="text-center mb-5">
                  <h2 className="text-lg font-display font-bold text-foreground mb-1">
                    Scratch & Win
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Scratch to reveal your prize!
                  </p>
                </div>
                <ScratchCard onScratch={playScratch} scratching={scratching} cost={3} />
                
                {/* Odds */}
                <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Win Chances
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { value: '5', chance: '70%' },
                      { value: '10', chance: '20%' },
                      { value: '30', chance: '10%', gold: true },
                    ].map((item, i) => (
                      <div key={i} className={`p-2 bg-card rounded-lg border ${item.gold ? 'border-gold/20' : 'border-border'}`}>
                        <p className={`text-sm font-bold ${item.gold ? 'text-gold' : 'text-foreground'}`}>{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">{item.chance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>

        {/* Tasks Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="glass-card rounded-2xl p-4 sm:p-5 sticky top-4">
            <TasksPanel tasks={tasks} loading={loading} onClaimTask={claimTask} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
