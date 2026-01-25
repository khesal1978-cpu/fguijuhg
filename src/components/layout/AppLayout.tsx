import { Outlet, Navigate, useLocation } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { memo, useMemo, useEffect, useRef } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";

// Memoized ambient gradient to prevent re-renders
const AmbientGlow = memo(() => (
  <>
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none will-change-transform" 
      style={{
        background: 'radial-gradient(ellipse at center top, hsl(262 83% 58% / 0.08) 0%, transparent 60%)',
        filter: 'blur(60px)',
      }}
      aria-hidden="true"
    />
    <div 
      className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none will-change-transform" 
      style={{
        background: 'radial-gradient(circle, hsl(262 83% 58% / 0.05) 0%, transparent 60%)',
        filter: 'blur(80px)',
      }}
      aria-hidden="true"
    />
  </>
));

AmbientGlow.displayName = "AmbientGlow";

export const AppLayout = memo(function AppLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation();
  
  // Set up notification triggers for mining, referrals, balance changes
  useNotificationTriggers();

  // Scroll to top on route change (native behavior)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname]);

  // Set up swipe navigation
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Memoize loading state UI
  const loadingUI = useMemo(() => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="relative size-12 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  ), []);

  if (loading) {
    return loadingUI;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-background dark overflow-hidden select-none">
      <main className="flex-1 relative flex flex-col h-full">
        {/* Ambient glow effects - GPU accelerated */}
        <AmbientGlow />
        
        {/* Safe area padding for notched devices */}
        <div 
          ref={scrollRef}
          className="relative z-10 flex-1 overflow-y-auto pb-20 scrollbar-hide overscroll-none"
          data-scrollable="true"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingTop: 'var(--safe-area-top)',
            paddingLeft: 'var(--safe-area-left)',
            paddingRight: 'var(--safe-area-right)',
          }}
        >
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
});
