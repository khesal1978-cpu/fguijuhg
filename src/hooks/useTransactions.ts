import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, getTransactions, subscribeToTransactions } from "@/lib/firebase";

export function useTransactions(limit = 10) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track mounted state
  const isMountedRef = useRef(true);

  const fetchTransactions = useCallback(async () => {
    if (!user?.uid || !isMountedRef.current) return;

    try {
      const data = await getTransactions(user.uid, limit);
      if (isMountedRef.current) {
        setTransactions(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.uid, limit]);

  // Initial mount and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Subscribe to transactions with proper cleanup
  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    // Delay subscription slightly to avoid rapid mount/unmount issues
    const timeoutId = setTimeout(() => {
      if (!isActive) return;
      
      try {
        unsubscribe = subscribeToTransactions(user.uid, limit, (txs) => {
          if (isActive && isMountedRef.current) {
            setTransactions(txs);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error subscribing to transactions:', error);
        // Fallback to one-time fetch
        fetchTransactions();
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
  }, [user?.uid, limit, fetchTransactions]);

  return { transactions, loading, refresh: fetchTransactions };
}
