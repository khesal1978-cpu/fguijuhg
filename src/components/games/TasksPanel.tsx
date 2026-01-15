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
    description: "Log in to earn coins",
  },
  invite_friends: {
    icon: Users,
    title: "Invite Friends",
    description: "Refer 10 friends to earn",
  },
  play_games: {
    icon: Gamepad2,
    title: "Play Games",
    description: "Play 50 games to earn",
  },
};

export function TasksPanel({ tasks, loading, onClaimTask }: TasksPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="size-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No active tasks</p>
        <p className="text-xs opacity-70">Check back later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => {
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-3 rounded-xl border transition-all ${
              task.is_completed
                ? "bg-primary/5 border-primary/20"
                : "bg-background border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  task.is_completed
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <IconComponent className="size-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {config.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary shrink-0">
                    <Gift className="size-3" />
                    +{task.reward}
                  </div>
                </div>
                
                {/* Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        task.is_completed ? "bg-primary" : "bg-primary/50"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                    {task.progress}/{task.target}
                  </span>
                </div>

                {/* Claim Button */}
                {task.is_completed && !task.is_claimed && (
                  <Button
                    size="sm"
                    onClick={() => onClaimTask(task.id)}
                    className="w-full h-7 mt-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
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
  );
}
