import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Gamepad2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-2xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all duration-300 active-scale"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -inset-2.5 bg-gradient-to-br from-primary/15 to-accent-foreground/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <item.icon 
                    className={`size-5 relative z-10 transition-colors duration-300 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`} 
                  />
                </motion.div>
              </div>
              <span 
                className={`text-[10px] font-medium transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
