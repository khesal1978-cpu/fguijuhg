import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, BellRing, Pickaxe, Users, Wallet, Clock, Shield, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationSettingItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const NotificationSettingItem = memo(function NotificationSettingItem({
  icon,
  label,
  description,
  enabled,
  onChange,
  disabled,
}: NotificationSettingItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl card-glass-subtle">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-foreground/60">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onChange} 
        disabled={disabled}
      />
    </div>
  );
});

export const PushNotificationSettings = memo(function PushNotificationSettings() {
  const {
    isSupported,
    permissionStatus,
    isEnabled,
    isLoading,
    preferences,
    requestPermission,
    updatePreferences,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-destructive/20 border border-destructive/30 flex items-center justify-center">
            <BellOff className="size-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Push Notifications</h3>
            <p className="text-xs text-foreground/60">Not supported in this browser</p>
          </div>
        </div>
        <p className="text-sm text-foreground/60 p-4 rounded-xl bg-muted/50">
          Push notifications require a modern browser with service worker support. 
          Try using Chrome, Firefox, or Safari on a desktop or mobile device.
        </p>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Push Notifications</h3>
            <p className="text-xs text-foreground/60">
              {permissionStatus === 'denied' ? 'Blocked by browser' : 'Not enabled yet'}
            </p>
          </div>
        </div>

        {permissionStatus === 'denied' ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-foreground/80">
              Notifications are blocked. To enable them:
            </p>
            <ol className="text-xs text-foreground/60 mt-2 ml-4 list-decimal space-y-1">
              <li>Click the lock/info icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions</li>
              <li>Change from "Block" to "Allow"</li>
              <li>Reload the page</li>
            </ol>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl card-glass-strong text-center"
          >
            <BellRing className="size-12 text-primary mx-auto mb-4" />
            <h4 className="text-lg font-bold text-foreground mb-2">Stay Updated</h4>
            <p className="text-sm text-foreground/60 mb-4">
              Get instant alerts when your mining completes, referrals join, or rewards are ready!
            </p>
            <Button 
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full gradient-primary btn-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="size-4 mr-2" />
                  Enable Push Notifications
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center">
          <BellRing className="size-5 text-success" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Push Notifications</h3>
          <p className="text-xs text-success font-medium">Enabled ✓</p>
        </div>
      </div>

      <div className="space-y-2">
        <NotificationSettingItem
          icon={<Pickaxe className="size-5" />}
          label="Mining Complete"
          description="When your mining session ends"
          enabled={preferences.mining_complete}
          onChange={(enabled) => updatePreferences({ mining_complete: enabled })}
        />
        
        <NotificationSettingItem
          icon={<Users className="size-5" />}
          label="Referral Bonus"
          description="When someone joins with your code"
          enabled={preferences.referral_bonus}
          onChange={(enabled) => updatePreferences({ referral_bonus: enabled })}
        />
        
        <NotificationSettingItem
          icon={<Wallet className="size-5" />}
          label="Balance Updates"
          description="When your balance changes"
          enabled={preferences.balance_update}
          onChange={(enabled) => updatePreferences({ balance_update: enabled })}
        />
        
        <NotificationSettingItem
          icon={<Clock className="size-5" />}
          label="Daily Reminders"
          description="Reminder to mine daily"
          enabled={preferences.daily_reminder}
          onChange={(enabled) => updatePreferences({ daily_reminder: enabled })}
        />
        
        <NotificationSettingItem
          icon={<Shield className="size-5" />}
          label="Group Rewards"
          description="When group rewards are ready"
          enabled={preferences.group_reward}
          onChange={(enabled) => updatePreferences({ group_reward: enabled })}
        />
      </div>
    </div>
  );
});
