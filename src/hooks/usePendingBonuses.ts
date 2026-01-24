import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToPendingBonuses } from "@/lib/firebase";

export function usePendingBonuses() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      setTotal(0);
      return;
    }

    const unsubscribe = subscribeToPendingBonuses(user.uid, (c, t) => {
      setCount(c);
      setTotal(t);
    });

    return () => unsubscribe();
  }, [user]);

  return { count, total };
}
