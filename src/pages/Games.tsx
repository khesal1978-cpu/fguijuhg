import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Coins, Sparkles, TicketPercent, Bell } from "lucide-react";
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 sm:h-20 shrink-0 px-4 md:px-8 flex items-center justify-between z-10 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Games
          </h1>
          <p className="text-xs text-muted-foreground">
            Play & Earn CASET
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border shadow-card">
            <Coins className="size-4 text-gold" />
            <span className="text-sm font-bold text-foreground">
              {Number(profile?.balance || 0).toFixed(0)}
            </span>
          </div>
          <button className="relative p-2 rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            <Bell className="size-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10 scrollbar-hide">
        <div className="max-w-[1400px] mx-auto">
          {/* Balance Card */}
          <motion.div
            className="glass-panel rounded-2xl p-4 sm:p-6 mb-6 shadow-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                  Your Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                    {Number(profile?.balance || 0).toFixed(2)}
                  </span>
                  <span className="text-lg text-primary font-bold">CASET</span>
                </div>
              </div>
              <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
                <Gamepad2 className="size-8 sm:size-10 text-primary" />
              </div>
            </div>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Games Section */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-12 bg-card border border-border rounded-xl p-1 mb-6">
                  <TabsTrigger
                    value="spin"
                    className="flex-1 h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-sm"
                  >
                    <Sparkles className="size-4 mr-2" />
                    Spin Wheel
                  </TabsTrigger>
                  <TabsTrigger
                    value="scratch"
                    className="flex-1 h-10 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-sm"
                  >
                    <TicketPercent className="size-4 mr-2" />
                    Scratch Card
                  </TabsTrigger>
                </TabsList>

                <motion.div
                  className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={activeTab}
                >
                  <TabsContent value="spin" className="m-0">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-display font-bold text-foreground mb-2">
                        Spin the Wheel
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Win up to <span className="text-gold font-bold">500 CASET</span>!
                      </p>
                    </div>
                    <SpinWheel onSpin={playSpin} spinning={spinning} cost={5} />
                    
                    {/* Odds Table */}
                    <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Win Chances
                      </p>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-card rounded-lg">
                          <p className="font-bold text-foreground">10</p>
                          <p className="text-muted-foreground">70%</p>
                        </div>
                        <div className="p-2 bg-card rounded-lg">
                          <p className="font-bold text-foreground">20</p>
                          <p className="text-muted-foreground">20%</p>
                        </div>
                        <div className="p-2 bg-card rounded-lg">
                          <p className="font-bold text-gold">50</p>
                          <p className="text-muted-foreground">7%</p>
                        </div>
                        <div className="p-2 bg-card rounded-lg">
                          <p className="font-bold text-destructive">100</p>
                          <p className="text-muted-foreground">2%</p>
                        </div>
                        <div className="p-2 bg-card rounded-lg border border-gold/30">
                          <p className="font-bold text-gold">500</p>
                          <p className="text-muted-foreground">1%</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="scratch" className="m-0">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-display font-bold text-foreground mb-2">
                        Scratch & Win
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Scratch to reveal your prize!
                      </p>
                    </div>
                    <ScratchCard onScratch={playScratch} scratching={scratching} cost={3} />
                    
                    {/* Odds Table */}
                    <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Win Chances
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-card rounded-lg">
                          <p className="font-bold text-foreground">5</p>
                          <p className="text-muted-foreground">70%</p>
                        </div>
                        <div className="p-2 bg-card rounded-lg">
                          <p className="font-bold text-foreground">10</p>
                          <p className="text-muted-foreground">20%</p>
                        </div>
                        <div className="p-2 bg-card rounded-lg border border-gold/30">
                          <p className="font-bold text-gold">30</p>
                          <p className="text-muted-foreground">10%</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </Tabs>
            </div>

            {/* Tasks Panel */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-card sticky top-4">
                <TasksPanel tasks={tasks} loading={loading} onClaimTask={claimTask} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
