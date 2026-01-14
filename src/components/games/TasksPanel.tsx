import { motion } from "framer-motion";
import { CheckCircle2, Circle, Gift, Users, Gamepad2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  task_type: string;
  progress: number;
  target: number;
  reward: number;
  is_completed: boolean;
  is_claimed: boolean;
}

interface TasksPanelProps {
  tasks: Task[];
  loading: boolean;
  onClaimTask: (taskId: string) => Promise<boolean>;
}

const TASK_CONFIG: Record<string, { icon: typeof Calendar; title: string; description: string }> = {
  daily_login: {
    icon: Calendar,
    title: "Daily Login",
    description: "Log in to the app daily",
  },
  invite_friends: {
    icon: Users,
    title: "Invite 10 Friends",
    description: "Refer 10 friends to earn bonus",
  },
  play_games: {
    icon: Gamepad2,
    title: "Play 50 Games",
    description: "Play spin or scratch 50 times",
  },
};

export function TasksPanel({ tasks, loading, onClaimTask }: TasksPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="size-5 text-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">Daily Tasks</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No active tasks available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const config = TASK_CONFIG[task.task_type] || {
              icon: Circle,
              title: task.task_type,
              description: "",
            };
            const IconComponent = config.icon;
            const progress = Math.min((task.progress / task.target) * 100, 100);

            return (
              <motion.div
                key={task.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  task.is_completed
                    ? "bg-accent/50 border-primary/30"
                    : "bg-card border-border"
                }`}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center ${
                      task.is_completed
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <IconComponent className="size-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {config.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs font-bold text-gold shrink-0">
                        <Gift className="size-3" />
                        +{task.reward}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {config.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                          {task.progress}/{task.target}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            task.is_completed ? "bg-primary" : "bg-primary/50"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Claim Button */}
                    {task.is_completed && !task.is_claimed && (
                      <Button
                        size="sm"
                        onClick={() => onClaimTask(task.id)}
                        className="w-full h-8 rounded-lg bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-gold-foreground font-bold text-xs shadow-gold"
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        Claim Reward
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
