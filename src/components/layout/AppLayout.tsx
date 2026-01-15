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
          {/* Large morphing blobs */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-primary/8 to-accent/15 rounded-full blur-3xl animate-morph" />
          <div className="absolute -bottom-48 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-accent-foreground/8 to-primary/8 rounded-full blur-3xl animate-morph-reverse" />
          <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl animate-float" />
          
          {/* Floating particles - scattered */}
          <div className="absolute top-[10%] left-[15%] w-2 h-2 bg-primary/30 rounded-full animate-float" />
          <div className="absolute top-[20%] right-[20%] w-3 h-3 bg-accent-foreground/25 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-[35%] left-[8%] w-1.5 h-1.5 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[45%] right-[12%] w-2.5 h-2.5 bg-accent-foreground/20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[60%] left-[25%] w-2 h-2 bg-primary/25 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[70%] right-[30%] w-1.5 h-1.5 bg-accent-foreground/35 rounded-full animate-float" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-[80%] left-[40%] w-3 h-3 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[15%] left-[60%] w-2 h-2 bg-accent-foreground/30 rounded-full animate-float" style={{ animationDelay: '1.8s' }} />
          <div className="absolute top-[55%] left-[70%] w-1.5 h-1.5 bg-primary/35 rounded-full animate-float" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-[85%] right-[15%] w-2.5 h-2.5 bg-accent-foreground/25 rounded-full animate-float" style={{ animationDelay: '2.2s' }} />
          
          {/* Breathing rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full animate-breathe" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-accent-foreground/5 rounded-full animate-breathe" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-primary/8 rounded-full animate-breathe" style={{ animationDelay: '1s' }} />
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          {/* Gradient mesh */}
          <div className="absolute top-0 left-1/3 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          <div className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-transparent via-accent-foreground/5 to-transparent" />
          <div className="absolute left-0 top-1/3 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
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
