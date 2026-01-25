import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { AppNotification, NotificationType } from '@/types/notifications';
import { haptic } from '@/lib/haptics';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (type: NotificationType, title: string, message: string, data?: Record<string, unknown>) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  pushPermissionStatus: NotificationPermission | 'unsupported';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  // Check push notification support
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermissionStatus(Notification.permission);
    } else {
      setPushPermissionStatus('unsupported');
    }
  }, []);

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: AppNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newNotifications.push({
          id: doc.id,
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          is_read: data.is_read,
          created_at: data.created_at?.toDate() || new Date(),
        });
      });
      
      // Check for new unread notifications and trigger haptic
      const prevUnread = notifications.filter(n => !n.is_read).length;
      const newUnread = newNotifications.filter(n => !n.is_read).length;
      if (newUnread > prevUnread && prevUnread > 0) {
        haptic('medium');
      }
      
      setNotifications(newNotifications);
      setLoading(false);
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length, 
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { is_read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const batch = writeBatch(db);
      notifications
        .filter(n => !n.is_read)
        .forEach(n => {
          const notificationRef = doc(db, 'notifications', n.id);
          batch.update(notificationRef, { is_read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.uid, notifications]);

  const addNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) => {
    if (!user?.uid) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        user_id: user.uid,
        type,
        title,
        message,
        data: data || null,
        is_read: false,
        created_at: Timestamp.now(),
      });

      // Show browser notification if permission granted
      if (pushPermissionStatus === 'granted' && 'Notification' in window) {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: type,
        });
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [user?.uid, pushPermissionStatus]);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermissionStatus(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    requestPushPermission,
    pushPermissionStatus,
  }), [notifications, unreadCount, loading, markAsRead, markAllAsRead, addNotification, requestPushPermission, pushPermissionStatus]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
