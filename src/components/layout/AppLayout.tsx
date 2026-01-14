import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            {/* Morphing blob background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-foreground/20 rounded-full blur-xl animate-morph" />
            <div className="relative size-16 rounded-2xl bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center shadow-glow">
              <Loader2 className="size-8 animate-spin text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Loading</p>
            <p className="text-xs text-muted-foreground">Please wait...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden flex flex-col h-full">
        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Large morphing blob - top right */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-accent/10 rounded-full blur-3xl animate-morph" />
          
          {/* Secondary blob - bottom left */}
          <div className="absolute -bottom-48 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-accent-foreground/5 to-primary/5 rounded-full blur-3xl animate-morph-reverse" />
          
          {/* Small floating particles */}
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-accent-foreground/30 rounded-full animate-float delay-500" />
          <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-gold/15 rounded-full animate-float delay-1000" />
          
          {/* Breathing ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full animate-breathe" />
        </div>
        
        <motion.div 
          className="relative z-10 flex-1 overflow-y-auto pb-20 lg:pb-0 scrollbar-hide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <MobileNav />
    </div>
  );
}
