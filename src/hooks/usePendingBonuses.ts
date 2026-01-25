import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToPendingBonuses } from "@/lib/firebase";

export function usePendingBonuses() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setCount(0);
      setTotal(0);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    // Delay subscription to avoid rapid mount/unmount issues
    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      
      try {
        unsubscribe = subscribeToPendingBonuses(user.uid, (c, t) => {
          if (isActive && isMountedRef.current) {
            setCount(c);
            setTotal(t);
          }
        });
      } catch (error) {
        console.error('Error subscribing to pending bonuses:', error);
      }
    }, 100);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Ignore unsubscribe errors during cleanup
        }
      }
    };
  }, [user?.uid]);

  return { count, total };
}
