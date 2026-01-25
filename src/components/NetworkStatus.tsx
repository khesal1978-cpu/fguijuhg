import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';

export const NetworkStatus = memo(function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4 safe-area-top"
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          exit={{ y: -80 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <WifiOff className="size-4" />
            <span>You're Offline</span>
          </div>
          <p className="text-center text-xs text-white/80 mt-1">
            <AlertCircle className="size-3 inline mr-1" />
            Showing cached data. Mining & games unavailable until you reconnect.
          </p>
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600 to-green-600 text-white py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold safe-area-top"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Wifi className="size-4" />
          <span>Back Online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});