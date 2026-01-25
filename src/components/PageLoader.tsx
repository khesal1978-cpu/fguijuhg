import { memo } from "react";
import { Loader2 } from "lucide-react";

export const PageLoader = memo(() => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-12 rounded-2xl bg-primary/20 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
));

PageLoader.displayName = "PageLoader";
