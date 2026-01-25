export type NotificationType = 
  | 'mining_complete' 
  | 'referral_bonus' 
  | 'balance_update' 
  | 'welcome'
  | 'claim_reminder';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationPreferences {
  mining_complete: boolean;
  referral_bonus: boolean;
  balance_update: boolean;
  push_enabled: boolean;
}
