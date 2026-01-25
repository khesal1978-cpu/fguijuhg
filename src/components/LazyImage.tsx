import { useState, useCallback, memo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholder?: 'blur' | 'skeleton';
  blurDataURL?: string;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'skeleton',
  blurDataURL,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {placeholder === 'blur' && blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-lg scale-110"
            />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
        </div>
      )}

      {/* Actual image */}
      {!hasError && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${isLoaded ? '' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
});

// Avatar with lazy loading
interface LazyAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  fallback?: string;
  className?: string;
}

export const LazyAvatar = memo(function LazyAvatar({
  src,
  alt,
  size = 40,
  fallback,
  className = '',
}: LazyAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const initials = fallback || alt.charAt(0).toUpperCase();

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-muted flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {src && !hasError ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <motion.img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </>
      ) : (
        <span 
          className="text-muted-foreground font-medium"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
});
