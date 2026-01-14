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
    <aside className="w-[260px] flex-shrink-0 hidden lg:flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
          <Hexagon className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-bold text-base text-foreground">
            PingCaset
          </h1>
          <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">
            Mining Hub
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={`size-[18px] ${isActive ? "text-primary" : ""}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Settings */}
        <div className="mt-auto pt-3 border-t border-border">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              location.pathname === "/settings"
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings className="size-[18px]" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-border space-y-3">
        {/* Profile */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-gold" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.display_name || "Miner"}
            </p>
            <p className="text-xs text-muted-foreground">
              Level {profile?.level || 1}
            </p>
          </div>
        </div>

        {/* Mining Power */}
        <div className="p-3 rounded-xl bg-accent/50 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Mining Power
            </span>
            <Zap className="size-3.5 text-primary" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground font-display">
              {profile?.mining_power || 50}
            </span>
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
