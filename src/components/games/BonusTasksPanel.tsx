import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, CheckCircle2, Share2, BookOpen, Trophy, Gamepad2, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BonusTask } from '@/types/bonusTasks';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';

interface BonusTasksPanelProps {
  tasks: BonusTask[];
  loading: boolean;
  onComplete: (taskId: string) => Promise<boolean>;
  onClaim: (taskId: string) => Promise<boolean>;
}

const TASK_ICONS: Record<string, typeof Gift> = {
  watch_ad: Play,
  share_app: Share2,
  visit_whitepaper: BookOpen,
  check_leaderboard: Trophy,
  play_extra_game: Gamepad2,
};

export const BonusTasksPanel = memo(function BonusTasksPanel({ 
  tasks, 
  loading, 
  onComplete, 
  onClaim 
}: BonusTasksPanelProps) {
  const navigate = useNavigate();

  if (loading || tasks.length === 0) {
    return null;
  }

  const handleTaskAction = async (task: BonusTask) => {
    haptic('light');
    
    if (task.is_completed && !task.is_claimed) {
      await onClaim(task.id);
      return;
    }

    // Navigate or complete based on task type
    switch (task.task_type) {
      case 'visit_whitepaper':
        navigate('/whitepaper');
        await onComplete(task.id);
        break;
      case 'check_leaderboard':
        navigate('/wallet');
        await onComplete(task.id);
        break;
      case 'share_app':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'PingCaset - Mine CASET Tokens',
              text: 'Join me on PingCaset and earn free crypto!',
              url: window.location.origin,
            });
            await onComplete(task.id);
          } catch (e) {
            // User cancelled share
          }
        } else {
          navigator.clipboard.writeText(window.location.origin);
          await onComplete(task.id);
        }
        break;
      case 'play_extra_game':
        // Already on games page, just mark complete after they play
        break;
      case 'watch_ad':
        // Simulate watching ad
        await onComplete(task.id);
        break;
      default:
        await onComplete(task.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Bonus Tasks</h3>
        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-bold text-primary">
          LIMITED TIME
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => {
          const Icon = TASK_ICONS[task.task_type] || Gift;
          const expiresIn = formatDistanceToNow(task.expires_at, { addSuffix: true });

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />

              <div className="relative p-4">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="size-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 shrink-0">
                        <Gift className="size-3 text-primary" />
                        <span className="text-xs font-bold text-primary">+{task.reward}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="size-3" />
                        <span>Expires {expiresIn}</span>
                      </div>

                      {task.is_completed ? (
                        task.is_claimed ? (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            Claimed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleTaskAction(task)}
                            className="h-7 px-3 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
                          >
                            <Gift className="size-3 mr-1" />
                            Claim
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(task)}
                          className="h-7 px-3 rounded-lg border-primary/30 text-xs font-semibold hover:bg-primary/10"
                        >
                          {task.task_type === 'play_extra_game' ? 'Play Now' : 'Do Task'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
});
