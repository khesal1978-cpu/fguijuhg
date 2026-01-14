import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  LogOut,
  Hexagon,
  Gamepad2,
  Zap,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-[280px] flex-shrink-0 hidden lg:flex flex-col h-full bg-card/80 backdrop-blur-xl border-r border-border/50">
      {/* Logo */}
      <div className="h-18 flex items-center gap-3 px-6 py-5 border-b border-border/50">
        <motion.div 
          className="relative size-11 rounded-xl bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center shadow-glow"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Hexagon className="size-6 text-primary-foreground" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent-foreground animate-breathe opacity-50 blur-md -z-10" />
        </motion.div>
        <div>
          <h1 className="font-serif font-bold text-lg text-foreground tracking-tight">
            PingCaset
          </h1>
          <p className="text-[10px] text-primary font-semibold uppercase tracking-[0.2em]">
            Mining Hub
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-accent-foreground rounded-r-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <item.icon className={`size-5 ${isActive ? "text-primary" : ""}`} />
              </motion.div>
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <Sparkles className="size-3 text-primary ml-auto animate-pulse-soft" />
              )}
            </Link>
          );
        })}

        {/* Settings */}
        <div className="mt-auto pt-4 border-t border-border/50">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              location.pathname === "/settings"
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Settings className="size-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {/* Profile */}
        <motion.div 
          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-accent/30 border border-border/50"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="relative">
            <div className="size-11 rounded-full bg-gradient-to-br from-primary via-accent-foreground to-gold animate-rotate-slow" 
                 style={{ animationDuration: '8s' }} />
            <div className="absolute inset-0.5 rounded-full bg-card flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {(profile?.display_name || "M")[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.display_name || "Miner"}
            </p>
            <p className="text-xs text-muted-foreground">
              Level {profile?.level || 1} • {profile?.is_premium ? "⭐ PRO" : "Free"}
            </p>
          </div>
        </motion.div>

        {/* Mining Power */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent-foreground/5 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Mining Power
            </span>
            <Zap className="size-3.5 text-primary animate-pulse-soft" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground font-serif">
              {profile?.mining_power || 50}
            </span>
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-accent-foreground rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${profile?.mining_power || 50}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Logout */}
        <motion.button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="size-4" />
          Logout
        </motion.button>
      </div>
    </aside>
  );
}
