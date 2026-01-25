import { memo } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, BellOff, CheckCheck, Coins, Pickaxe, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { haptic } from '@/lib/haptics';

interface NotificationPanelProps {
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'mining_complete':
      return <Pickaxe className="h-5 w-5 text-primary" />;
    case 'referral_bonus':
      return <Users className="h-5 w-5 text-primary" />;
    case 'balance_update':
      return <Coins className="h-5 w-5 text-primary" />;
    case 'welcome':
      return <Gift className="h-5 w-5 text-primary" />;
    case 'claim_reminder':
      return <Bell className="h-5 w-5 text-destructive" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

export const NotificationPanel = memo(function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    requestPushPermission,
    pushPermissionStatus 
  } = useNotifications();

  const handleMarkAllRead = async () => {
    haptic('light');
    await markAllAsRead();
  };

  const handleEnablePush = async () => {
    haptic('medium');
    await requestPushPermission();
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      haptic('light');
      await markAsRead(notificationId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-16 right-4 left-4 z-50 max-w-md mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Push notification banner */}
      {pushPermissionStatus === 'default' && (
        <div className="p-3 bg-primary/10 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Enable Push Notifications</p>
              <p className="text-xs text-muted-foreground truncate">
                Get alerts even when app is closed
              </p>
            </div>
            <Button size="sm" onClick={handleEnablePush} className="shrink-0">
              Enable
            </Button>
          </div>
        </div>
      )}

      {/* Notifications list */}
      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              You'll see mining rewards, referral bonuses, and more here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(notification.created_at, { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
});
