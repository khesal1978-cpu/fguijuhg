import { ReactNode } from "react";
import { Plus } from "lucide-react";

interface ActivityItemProps {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  amount: string;
  isPositive?: boolean;
}

export function ActivityItem({
  icon,
  title,
  subtitle,
  amount,
  isPositive = true,
}: ActivityItemProps) {
  return (
    <div className="flex items-center p-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
      <div className="size-10 rounded-full bg-accent/50 flex items-center justify-center text-primary mr-4">
        {icon || <Plus className="size-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-bold ${
            isPositive ? "text-primary" : "text-destructive"
          }`}
        >
          {isPositive ? "+" : "-"}
          {amount}
        </p>
      </div>
    </div>
  );
}
