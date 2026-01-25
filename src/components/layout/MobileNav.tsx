import { Link, useLocation } from "react-router-dom";
import { memo, useMemo } from "react";
import { Home, Gamepad2, Users, Wallet, Settings } from "lucide-react";
import { usePendingBonuses } from "@/hooks/usePendingBonuses";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: Settings, label: "Settings", path: "/settings" },
] as const;

// Memoized nav item to prevent unnecessary re-renders
const NavItem = memo(function NavItem({ 
  icon: Icon, 
  label, 
  path, 
  isActive, 
  showBadge, 
  badgeCount 
}: { 
  icon: typeof Home; 
  label: string; 
  path: string; 
  isActive: boolean; 
  showBadge: boolean; 
  badgeCount: number;
}) {
  return (
    <Link
      to={path}
      className="relative flex flex-col items-center justify-center w-14 h-14 gap-0.5 active:scale-95 transition-transform duration-100"
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
    >
      {isActive && (
        <div className="absolute -top-0.5 w-6 h-1 bg-primary rounded-full animate-scale-in" />
      )}
      <div className="relative">
        <Icon 
          className={`size-5 transition-colors duration-150 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`} 
        />
        {showBadge && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full animate-scale-in">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </div>
      <span 
        className={`text-[10px] font-medium transition-colors duration-150 ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </Link>
  );
});

export const MobileNav = memo(function MobileNav() {
  const location = useLocation();
  const { count: pendingBonusCount } = usePendingBonuses();

  // Memoize active path check
  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={activePath === item.path}
            showBadge={item.path === "/team" && pendingBonusCount > 0}
            badgeCount={pendingBonusCount}
          />
        ))}
      </div>
    </nav>
  );
});
