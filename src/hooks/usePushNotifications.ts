import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  requestNotificationPermission,
  getNotificationPreferences,
  updateNotificationPreferences,
  setupForegroundMessageHandler,
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  triggerNotification,
  PushNotificationPayload,
  NotificationType,
} from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface NotificationPreferences {
  mining_complete: boolean;
  referral_bonus: boolean;
  balance_update: boolean;
  daily_reminder: boolean;
  group_reward: boolean;
}

const defaultPreferences: NotificationPreferences = {
  mining_complete: true,
  referral_bonus: true,
  balance_update: true,
  daily_reminder: true,
  group_reward: true,
};

export function usePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check support on mount
  useEffect(() => {
    async function checkSupport() {
      const supported = await isPushNotificationSupported();
      setIsSupported(supported);
      setPermissionStatus(getNotificationPermissionStatus());
    }
    checkSupport();
  }, []);

  // Load preferences when user logs in
  useEffect(() => {
    if (!user?.uid) return;

    async function loadPreferences() {
      const prefs = await getNotificationPreferences(user!.uid);
      if (prefs) {
        setPreferences(prefs);
      }
    }
    loadPreferences();
  }, [user?.uid]);

  // Set up foreground message handler
  useEffect(() => {
    if (!user?.uid || permissionStatus !== 'granted') return;

    const handleNotification = (payload: PushNotificationPayload) => {
      // Show toast for foreground notifications
      toast(payload.title, {
        description: payload.body,
        action: payload.data?.route ? {
          label: 'View',
          onClick: () => navigate(payload.data!.route!),
        } : undefined,
      });
    };

    unsubscribeRef.current = setupForegroundMessageHandler(handleNotification);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user?.uid, permissionStatus, navigate]);

  // Handle service worker messages (notification clicks)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.route) {
        navigate(event.data.route);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!user?.uid || !isSupported) return false;

    setIsLoading(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      
      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');
        toast.success('Push notifications enabled!');
        return true;
      } else {
        setPermissionStatus(getNotificationPermissionStatus());
        if (Notification.permission === 'denied') {
          toast.error('Notifications blocked. Please enable in browser settings.');
        }
        return false;
      }
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      toast.error('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isSupported]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user?.uid) return;

    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    try {
      await updateNotificationPreferences(user.uid, updated);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('[Push] Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  }, [user?.uid, preferences]);

  // Trigger a notification (for testing or manual triggers)
  const sendNotification = useCallback(async (
    type: NotificationType, 
    data?: Record<string, string>
  ) => {
    if (permissionStatus !== 'granted') {
      console.log('[Push] Cannot send - no permission');
      return;
    }

    // Check if this type is enabled in preferences
    if (!preferences[type]) {
      console.log('[Push] Notification type disabled:', type);
      return;
    }

    await triggerNotification(type, data);
  }, [permissionStatus, preferences]);

  return {
    isSupported,
    permissionStatus,
    isEnabled: permissionStatus === 'granted',
    isLoading,
    preferences,
    fcmToken,
    requestPermission,
    updatePreferences,
    sendNotification,
  };
}
