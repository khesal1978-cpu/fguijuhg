import { memo } from 'react';
import { motion } from 'framer-motion';

// Skeleton loader for text
export const SkeletonText = memo(function SkeletonText({ 
  width = '100%',
  height = '1rem',
  className = '',
}: { 
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <motion.div
      className={`bg-muted rounded animate-pulse ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
});

// Skeleton loader for cards
export const SkeletonCard = memo(function SkeletonCard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-2xl bg-card border border-border ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
});

// Skeleton for list items
export const SkeletonListItem = memo(function SkeletonListItem({
  showAvatar = true,
  className = '',
}: {
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 ${className}`}>
      {showAvatar && (
        <div className="size-12 rounded-xl bg-muted animate-pulse flex-shrink-0" />
      )}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-5 w-16 bg-muted rounded animate-pulse" />
    </div>
  );
});

// Skeleton for stat cards
export const SkeletonStatCard = memo(function SkeletonStatCard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-2xl bg-card border border-border ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="size-8 rounded-lg bg-muted animate-pulse" />
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-6 w-20 bg-muted rounded animate-pulse" />
    </div>
  );
});

// Skeleton for avatar
export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full bg-muted animate-pulse ${className}`}
      style={{ width: size, height: size }}
    />
  );
});

// Skeleton for image
export const SkeletonImage = memo(function SkeletonImage({
  aspectRatio = '16/9',
  className = '',
}: {
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full bg-muted rounded-xl animate-pulse ${className}`}
      style={{ aspectRatio }}
    />
  );
});

// Full page skeleton
export const SkeletonPage = memo(function SkeletonPage() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-16 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Main card */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="h-4 w-24 mx-auto bg-muted rounded animate-pulse mb-3" />
        <div className="h-10 w-40 mx-auto bg-muted rounded animate-pulse" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* List */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    </div>
  );
});
