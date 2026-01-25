export interface BonusTask {
  id: string;
  user_id: string;
  task_type: 'watch_ad' | 'share_app' | 'rate_app' | 'visit_whitepaper' | 'check_leaderboard' | 'play_extra_game';
  title: string;
  description: string;
  reward: number;
  is_completed: boolean;
  is_claimed: boolean;
  expires_at: Date;
  created_at: Date;
}

export const BONUS_TASK_TEMPLATES = [
  { type: 'watch_ad' as const, title: 'Watch a Video', description: 'Watch a short promo video', minReward: 10, maxReward: 15 },
  { type: 'share_app' as const, title: 'Share PingCaset', description: 'Share the app with a friend', minReward: 12, maxReward: 18 },
  { type: 'visit_whitepaper' as const, title: 'Read Whitepaper', description: 'Visit the whitepaper page', minReward: 8, maxReward: 12 },
  { type: 'check_leaderboard' as const, title: 'Check Leaderboard', description: 'View the top miners', minReward: 5, maxReward: 10 },
  { type: 'play_extra_game' as const, title: 'Play One More Game', description: 'Play a spin or scratch game', minReward: 10, maxReward: 20 },
] as const;
