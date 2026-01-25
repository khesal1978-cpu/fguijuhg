import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

/**
 * Hook that listens to user events and triggers notifications
 * - Mining session completion
 * - Referral bonuses
 * - Balance changes
 */
export function useNotificationTriggers() {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const prevBalanceRef = useRef<number | null>(null);
  const prevMiningSessionRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

  // Track balance changes
  useEffect(() => {
    if (!profile) return;

    const currentBalance = profile.balance;
    const prevBalance = prevBalanceRef.current;

    // Skip initial load
    if (prevBalance === null) {
      prevBalanceRef.current = currentBalance;
      return;
    }

    // Skip if no change
    if (prevBalance === currentBalance) return;

    const difference = currentBalance - prevBalance;
    prevBalanceRef.current = currentBalance;

    // Don't notify on balance decrease (games, burns, etc)
    if (difference < 0) return;

    // Notify on significant balance increase (>= 5 CASET)
    if (difference >= 5 && !initialLoadRef.current) {
      addNotification(
        'balance_update',
        'Balance Updated! 💰',
        `You received +${difference} CASET. Your new balance is ${currentBalance} CASET.`,
        { amount: difference, newBalance: currentBalance }
      );
    }
  }, [profile?.balance, addNotification]);

  // Track mining session completion
  useEffect(() => {
    if (!user?.uid) return;

    const sessionsRef = collection(db, 'mining_sessions');
    const q = query(
      sessionsRef,
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          const sessionId = change.doc.id;
          
          // Check if session just became claimable (is_active = false, is_claimed = false)
          if (!data.is_active && !data.is_claimed && prevMiningSessionRef.current !== sessionId) {
            prevMiningSessionRef.current = sessionId;
            
            addNotification(
              'mining_complete',
              'Mining Complete! ⛏️',
              `Your mining session is ready! Claim ${data.earned_amount} CASET now before it expires.`,
              { sessionId, earnedAmount: data.earned_amount }
            );
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user?.uid, addNotification]);

  // Track new referral bonuses
  useEffect(() => {
    if (!user?.uid) return;

    const pendingBonusesRef = collection(db, 'pending_bonuses');
    const q = query(
      pendingBonusesRef,
      where('user_id', '==', user.uid),
      where('claimed', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !initialLoadRef.current) {
          const data = change.doc.data();
          
          addNotification(
            'referral_bonus',
            'Referral Bonus! 🎉',
            `You earned ${data.amount} CASET from a referral. Go to Team page to claim!`,
            { amount: data.amount, fromUser: data.from_user_id }
          );
        }
      });
    });

    // Mark initial load complete after first snapshot
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [user?.uid, addNotification]);
}
