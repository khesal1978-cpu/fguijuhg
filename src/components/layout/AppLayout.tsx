import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ParticlesBackground } from "./ParticlesBackground";
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
        <ParticlesBackground />
        
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