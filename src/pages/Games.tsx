import { useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Coins, Sparkles, TicketPercent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpinWheel } from "@/components/games/SpinWheel";
import { ScratchCard } from "@/components/games/ScratchCard";
import { TasksPanel } from "@/components/games/TasksPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useGames } from "@/hooks/useGames";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Games() {
  const { profile } = useAuth();
  const { tasks, loading, spinning, scratching, playSpin, playScratch, claimTask } = useGames();
  const [activeTab, setActiveTab] = useState("spin");

  return (
    <motion.div 
      className="flex flex-col h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header 
        className="h-16 sm:h-20 shrink-0 px-4 md:px-8 flex items-center justify-between z-10"
        variants={itemVariants}
      >
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Games
          </h1>
          <p className="text-xs text-muted-foreground">
            Play & Earn CASET
          </p>
        </div>
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-card to-card/50 rounded-full border border-border shadow-card"
          whileHover={{ scale: 1.02 }}
        >
          <Coins className="size-4 text-gold animate-bounce-subtle" />
          <span className="text-sm font-bold text-foreground">
            {Number(profile?.balance || 0).toFixed(0)}
          </span>
        </motion.div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10 scrollbar-hide">
        <div className="max-w-[1400px] mx-auto">
          {/* Balance Card */}
          <motion.div
            className="glass-panel rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden"
            variants={itemVariants}
          >
            <div className="absolute -right-10 -top-10 size-40 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-2xl" />
            <div className="absolute -left-10 bottom-0 size-32 bg-gradient-to-tr from-gold/10 to-transparent rounded-full blur-xl" />
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                  Your Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <motion.span 
                    className="text-3xl sm:text-4xl font-display font-bold text-foreground"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {Number(profile?.balance || 0).toFixed(2)}
                  </motion.span>
                  <span className="text-lg text-primary font-bold">CASET</span>
                </div>
              </div>
              <motion.div 
                className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-gold/10 flex items-center justify-center border border-primary/10"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Gamepad2 className="size-8 sm:size-10 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Games Section */}
            <motion.div className="lg:col-span-2" variants={itemVariants}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-12 bg-gradient-to-r from-card to-card/50 border border-border rounded-xl p-1 mb-6">
                  <TabsTrigger
                    value="spin"
                    className="flex-1 h-10 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-dark data-[state=active]:text-primary-foreground font-bold text-sm transition-all duration-300"
                  >
                    <Sparkles className="size-4 mr-2" />
                    Spin Wheel
                  </TabsTrigger>
                  <TabsTrigger
                    value="scratch"
                    className="flex-1 h-10 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-dark data-[state=active]:text-primary-foreground font-bold text-sm transition-all duration-300"
                  >
                    <TicketPercent className="size-4 mr-2" />
                    Scratch Card
                  </TabsTrigger>
                </TabsList>

                <motion.div
                  className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border p-6 sm:p-8 shadow-card relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={activeTab}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute -right-10 -top-10 size-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
                  
                  <TabsContent value="spin" className="m-0 relative z-10">
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
                    <div className="mt-8 p-4 bg-gradient-to-r from-secondary/50 to-secondary/20 rounded-xl border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Win Chances
                      </p>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        {[
                          { value: '10', chance: '70%' },
                          { value: '20', chance: '20%' },
                          { value: '50', chance: '7%', gold: true },
                          { value: '100', chance: '2%', highlight: true },
                          { value: '500', chance: '1%', gold: true, special: true },
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            className={`p-2 bg-card rounded-lg border ${item.special ? 'border-gold/30' : 'border-border'}`}
                            whileHover={{ scale: 1.05, y: -2 }}
                          >
                            <p className={`font-bold ${item.gold ? 'text-gold' : item.highlight ? 'text-destructive' : 'text-foreground'}`}>
                              {item.value}
                            </p>
                            <p className="text-muted-foreground">{item.chance}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="scratch" className="m-0 relative z-10">
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
                    <div className="mt-8 p-4 bg-gradient-to-r from-secondary/50 to-secondary/20 rounded-xl border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Win Chances
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {[
                          { value: '5', chance: '70%' },
                          { value: '10', chance: '20%' },
                          { value: '30', chance: '10%', gold: true },
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            className={`p-2 bg-card rounded-lg border ${item.gold ? 'border-gold/30' : 'border-border'}`}
                            whileHover={{ scale: 1.05, y: -2 }}
                          >
                            <p className={`font-bold ${item.gold ? 'text-gold' : 'text-foreground'}`}>
                              {item.value}
                            </p>
                            <p className="text-muted-foreground">{item.chance}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </Tabs>
            </motion.div>

            {/* Tasks Panel */}
            <motion.div className="lg:col-span-1" variants={itemVariants}>
              <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border p-4 sm:p-6 shadow-card sticky top-4 relative overflow-hidden">
                <div className="absolute -right-10 top-0 size-32 bg-gradient-to-bl from-gold/10 to-transparent rounded-full blur-2xl" />
                <div className="relative z-10">
                  <TasksPanel tasks={tasks} loading={loading} onClaimTask={claimTask} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}