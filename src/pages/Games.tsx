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
    <div className="px-4 py-6 md:px-8 lg:py-8 max-w-[1200px] mx-auto w-full space-y-6 md:space-y-8">
      {/* Header */}
      <motion.header 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Games
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Play & earn CASET
          </p>
        </div>
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full"
          whileHover={{ scale: 1.03 }}
        >
          <Coins className="size-5 text-gold animate-bounce-subtle" />
          <span className="text-sm font-bold text-foreground font-serif">
            {Number(profile?.balance || 0).toFixed(0)}
          </span>
        </motion.div>
      </motion.header>

      {/* Balance Card */}
      <motion.section
        className="glass-card rounded-3xl p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-accent-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-morph" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              Your Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                {Number(profile?.balance || 0).toFixed(2)}
              </span>
              <span className="text-lg font-semibold text-primary">CASET</span>
            </div>
          </div>
          <motion.div 
            className="size-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-foreground/10 flex items-center justify-center border border-primary/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Gamepad2 className="size-8 text-primary" />
          </motion.div>
        </div>
      </motion.section>

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Games Section */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-12 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-1.5 mb-5">
              <TabsTrigger
                value="spin"
                className="flex-1 h-9 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-foreground data-[state=active]:text-primary-foreground font-medium text-sm transition-all duration-300"
              >
                <Sparkles className="size-4 mr-2" />
                Spin Wheel
              </TabsTrigger>
              <TabsTrigger
                value="scratch"
                className="flex-1 h-9 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-foreground data-[state=active]:text-primary-foreground font-medium text-sm transition-all duration-300"
              >
                <TicketPercent className="size-4 mr-2" />
                Scratch Card
              </TabsTrigger>
            </TabsList>

            <div className="glass-card rounded-3xl p-6 sm:p-8">
              <TabsContent value="spin" className="m-0">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                    Spin the Wheel
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Win up to <span className="text-gold font-semibold">500 CASET</span>!
                  </p>
                </div>
                <SpinWheel onSpin={playSpin} spinning={spinning} cost={5} />
                
                {/* Odds */}
                <div className="mt-8 p-5 bg-gradient-to-r from-muted/50 to-accent/30 rounded-2xl border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Win Chances
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { value: '10', chance: '70%' },
                      { value: '20', chance: '20%' },
                      { value: '50', chance: '7%', highlight: true },
                      { value: '100', chance: '2%' },
                      { value: '500', chance: '1%', highlight: true },
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        className={`p-3 bg-card rounded-xl border ${item.highlight ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10' : 'border-border/50'}`}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <p className={`text-base font-serif font-bold ${item.highlight ? 'text-gold' : 'text-foreground'}`}>{item.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.chance}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scratch" className="m-0">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                    Scratch & Win
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Scratch to reveal your prize!
                  </p>
                </div>
                <ScratchCard onScratch={playScratch} scratching={scratching} cost={3} />
                
                {/* Odds */}
                <div className="mt-8 p-5 bg-gradient-to-r from-muted/50 to-accent/30 rounded-2xl border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Win Chances
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { value: '5', chance: '70%' },
                      { value: '10', chance: '20%' },
                      { value: '30', chance: '10%', highlight: true },
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        className={`p-3 bg-card rounded-xl border ${item.highlight ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10' : 'border-border/50'}`}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <p className={`text-base font-serif font-bold ${item.highlight ? 'text-gold' : 'text-foreground'}`}>{item.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.chance}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>

        {/* Tasks Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="glass-card rounded-3xl p-5 sm:p-6 sticky top-4">
            <TasksPanel tasks={tasks} loading={loading} onClaimTask={claimTask} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
