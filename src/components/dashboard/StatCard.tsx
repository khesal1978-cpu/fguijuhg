import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  unit,
  iconBg = "bg-accent",
  iconColor = "text-primary",
}: StatCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3 hover-lift">
      <div className={`size-11 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-lg font-display font-bold text-foreground truncate">
          {value}
          {unit && <span className="text-xs font-medium text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
