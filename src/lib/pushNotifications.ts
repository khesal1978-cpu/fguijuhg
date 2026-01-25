import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { haptic } from './haptics';

// Firebase config (reuse from firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDempbrEElfOwm8TRMdxuCeKTfnXAAWBB0",
  authDomain: "wajud-973e0.firebaseapp.com",
  projectId: "wajud-973e0",
  storageBucket: "wajud-973e0.firebasestorage.app",
  messagingSenderId: "683758607731",
  appId: "1:683758607731:web:79fdc2ae2470614b073906",
  measurementId: "G-5BWP0N42BD"
};

// VAPID key for web push (you'll need to generate this in Firebase Console)
const VAPID_KEY = 'YOUR_VAPID_KEY'; // Replace with actual key from Firebase Console

let messagingInstance: Messaging | null = null;

// Initialize messaging
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('[FCM] Push notifications not supported in this browser');
      return null;
    }
    
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('[FCM] Error initializing messaging:', error);
    return null;
  }
}

// Notification types
export type NotificationType = 
  | 'mining_complete'
  | 'referral_bonus'
  | 'balance_update'
  | 'daily_reminder'
  | 'welcome'
  | 'group_reward';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
  requireInteraction?: boolean;
}

// User FCM token storage
interface FCMTokenDoc {
  token: string;
  user_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  device_info: {
    platform: string;
    userAgent: string;
  };
  notification_preferences: {
    mining_complete: boolean;
    referral_bonus: boolean;
    balance_update: boolean;
    daily_reminder: boolean;
    group_reward: boolean;
  };
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('[FCM] Notifications not supported');
      return null;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    console.log('[FCM] Permission:', permission);
    
    if (permission !== 'granted') {
      console.log('[FCM] Permission denied');
      return null;
    }
    
    // Get messaging instance
    const messaging = await getMessagingInstance();
    if (!messaging) return null;
    
    // Get service worker registration
    let swRegistration: ServiceWorkerRegistration | undefined;
    
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Service worker registered');
      } catch (swError) {
        console.error('[FCM] Service worker registration failed:', swError);
      }
    }
    
    // Get FCM token
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });
    
    if (token) {
      console.log('[FCM] Token obtained');
      
      // Store token in Firestore
      await saveUserToken(userId, token);
      
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return null;
  }
}

// Save FCM token to Firestore
async function saveUserToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcm_tokens', userId);
    const tokenDoc = await getDoc(tokenRef);
    
    const tokenData: Partial<FCMTokenDoc> = {
      token,
      user_id: userId,
      updated_at: Timestamp.now(),
      device_info: {
        platform: navigator.platform || 'unknown',
        userAgent: navigator.userAgent || 'unknown',
      },
    };
    
    if (!tokenDoc.exists()) {
      // Create new token document with default preferences
      await setDoc(tokenRef, {
        ...tokenData,
        created_at: Timestamp.now(),
        notification_preferences: {
          mining_complete: true,
          referral_bonus: true,
          balance_update: true,
          daily_reminder: true,
          group_reward: true,
        },
      });
    } else {
      // Update existing token
      await updateDoc(tokenRef, tokenData);
    }
    
    console.log('[FCM] Token saved to Firestore');
  } catch (error) {
    console.error('[FCM] Error saving token:', error);
  }
}

// Get user's notification preferences
export async function getNotificationPreferences(userId: string): Promise<FCMTokenDoc['notification_preferences'] | null> {
  try {
    const tokenRef = doc(db, 'fcm_tokens', userId);
    const tokenDoc = await getDoc(tokenRef);
    
    if (tokenDoc.exists()) {
      return (tokenDoc.data() as FCMTokenDoc).notification_preferences;
    }
    return null;
  } catch (error) {
    console.error('[FCM] Error getting preferences:', error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string, 
  preferences: Partial<FCMTokenDoc['notification_preferences']>
): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcm_tokens', userId);
    await updateDoc(tokenRef, {
      notification_preferences: preferences,
      updated_at: Timestamp.now(),
    });
    console.log('[FCM] Preferences updated');
  } catch (error) {
    console.error('[FCM] Error updating preferences:', error);
  }
}

// Listen for foreground messages
export function setupForegroundMessageHandler(
  onNotification: (payload: PushNotificationPayload) => void
): (() => void) | null {
  let unsubscribe: (() => void) | null = null;
  
  getMessagingInstance().then(messaging => {
    if (!messaging) return;
    
    unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      
      haptic('medium');
      
      const notification: PushNotificationPayload = {
        title: payload.notification?.title || 'Ping Caset',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/favicon.ico',
        data: payload.data as Record<string, string>,
      };
      
      onNotification(notification);
    });
  });
  
  return () => unsubscribe?.();
}

// Send local notification (for in-app triggers)
export async function sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('[FCM] Cannot send local notification - no permission');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction || false,
    });
    
    haptic('light');
    console.log('[FCM] Local notification sent');
  } catch (error) {
    console.error('[FCM] Error sending local notification:', error);
  }
}

// Queue a notification to be sent via Cloud Function
export async function queuePushNotification(
  userId: string,
  type: NotificationType,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    await addDoc(collection(db, 'notification_queue'), {
      user_id: userId,
      type,
      payload,
      status: 'pending',
      created_at: Timestamp.now(),
    });
    console.log('[FCM] Notification queued:', type);
  } catch (error) {
    console.error('[FCM] Error queuing notification:', error);
  }
}

// Check if push notifications are available
export async function isPushNotificationSupported(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const supported = await isSupported();
    return supported;
  } catch {
    return false;
  }
}

// Get current permission status
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Predefined notification templates
export const notificationTemplates: Record<NotificationType, (data?: Record<string, string>) => PushNotificationPayload> = {
  mining_complete: (data) => ({
    title: '⛏️ Mining Complete!',
    body: `Your mining session has ended. You earned ${data?.amount || '0'} CASET!`,
    icon: '/favicon.ico',
    tag: 'mining-complete',
    data: { type: 'mining_complete', route: '/' },
    requireInteraction: true,
  }),
  
  referral_bonus: (data) => ({
    title: '🎉 Referral Bonus!',
    body: `${data?.name || 'Someone'} joined using your code! You earned ${data?.amount || '50'} CASET!`,
    icon: '/favicon.ico',
    tag: 'referral-bonus',
    data: { type: 'referral_bonus', route: '/team' },
    requireInteraction: true,
  }),
  
  balance_update: (data) => ({
    title: '💰 Balance Updated',
    body: `Your balance changed by ${data?.amount || '0'} CASET.`,
    icon: '/favicon.ico',
    tag: 'balance-update',
    data: { type: 'balance_update', route: '/wallet' },
  }),
  
  daily_reminder: () => ({
    title: '⏰ Daily Mining Reminder',
    body: "Don't forget to start your mining session today!",
    icon: '/favicon.ico',
    tag: 'daily-reminder',
    data: { type: 'daily_reminder', route: '/' },
    requireInteraction: true,
  }),
  
  welcome: (data) => ({
    title: '👋 Welcome to Ping Caset!',
    body: `Start mining to earn CASET tokens. ${data?.bonus ? `You got ${data.bonus} CASET bonus!` : ''}`,
    icon: '/favicon.ico',
    tag: 'welcome',
    data: { type: 'welcome', route: '/' },
  }),
  
  group_reward: (data) => ({
    title: '🛡️ Group Reward Ready!',
    body: `Your group "${data?.groupName || 'Security Group'}" has a reward of ${data?.amount || '0'} CASET ready to claim!`,
    icon: '/favicon.ico',
    tag: 'group-reward',
    data: { type: 'group_reward', route: '/groups' },
    requireInteraction: true,
  }),
};

// Helper to trigger a notification from a template
export async function triggerNotification(
  type: NotificationType, 
  data?: Record<string, string>
): Promise<void> {
  const payload = notificationTemplates[type](data);
  await sendLocalNotification(payload);
}
