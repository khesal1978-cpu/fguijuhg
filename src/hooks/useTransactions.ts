import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, getTransactions, subscribeToTransactions } from "@/lib/firebase";

export function useTransactions(limit = 10) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    const data = await getTransactions(user.uid, limit);
    setTransactions(data);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Subscribe to new transactions
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTransactions(user.uid, limit, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, limit]);

  return { transactions, loading, refresh: fetchTransactions };
}
