import { memo } from "react";
import { motion } from "framer-motion";
import { Play, Coins, Loader2, Smartphone, Sparkles, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRewardedAd } from "@/hooks/useRewardedAd";

interface WatchAdButtonProps {
  rewardAmount?: number;
  className?: string;
}

export const WatchAdButton = memo(function WatchAdButton({ 
  rewardAmount = 15,
  className = ""
}: WatchAdButtonProps) {
  const { watchAd, isLoading, isNative } = useRewardedAd({ rewardAmount });

  if (!isNative) {
    return (
      <div className={`card-glass-subtle p-4 rounded-xl ${className}`}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <Smartphone className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Watch Ads for Coins</p>
            <p className="text-xs text-muted-foreground/70">Available on mobile app only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Button
        onClick={watchAd}
        disabled={isLoading}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-primary-foreground font-semibold shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 mr-2 animate-spin" />
            Loading Ad...
          </>
        ) : (
          <>
            <Play className="size-5 mr-2 fill-current" />
            Watch Ad
            <div className="ml-2 flex items-center gap-1 px-2 py-0.5 bg-background/20 rounded-full">
              <Coins className="size-3.5" />
              <span className="text-sm">+{rewardAmount}</span>
            </div>
          </>
        )}
      </Button>
    </motion.div>
  );
});

interface FreeGameAdButtonProps {
  gameType: 'spin' | 'scratch';
  onReward: (reward: number) => void;
  remainingAds: number;
  className?: string;
}

export const FreeGameAdButton = memo(function FreeGameAdButton({
  gameType,
  onReward,
  remainingAds,
  className = ""
}: FreeGameAdButtonProps) {
  const { watchAdForFreeGame, isLoading } = useRewardedAd({ 
    rewardType: gameType 
  });

  const handleClick = async () => {
    const result = await watchAdForFreeGame(gameType);
    if (result.success) {
      onReward(result.reward);
    }
  };

  if (remainingAds <= 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={`rounded-lg border-muted-foreground/30 ${className}`}
      >
        <Play className="size-4 mr-1.5 text-muted-foreground" />
        No ads left today
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className={`rounded-lg border-primary/30 hover:bg-primary/10 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin mr-1.5" />
      ) : (
        <Play className="size-4 mr-1.5 fill-current text-primary" />
      )}
      Watch Ad ({remainingAds}/3)
      {gameType === 'spin' ? (
        <Sparkles className="size-3.5 ml-1.5 text-primary" />
      ) : (
        <TicketPercent className="size-3.5 ml-1.5 text-primary" />
      )}
    </Button>
  );
});
