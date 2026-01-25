// Native-like haptic feedback utilities
// Uses the Vibration API where available

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 20],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
  selection: [5],
};

export function haptic(type: HapticType = 'light'): void {
  // Check for vibration support
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Silently fail if vibration not supported
    }
  }
}

// Trigger haptic on button press
export function withHaptic<T extends (...args: any[]) => any>(
  fn: T,
  type: HapticType = 'light'
): T {
  return ((...args: Parameters<T>) => {
    haptic(type);
    return fn(...args);
  }) as T;
}

// Hook for haptic feedback
export function useHaptic() {
  return {
    light: () => haptic('light'),
    medium: () => haptic('medium'),
    heavy: () => haptic('heavy'),
    success: () => haptic('success'),
    warning: () => haptic('warning'),
    error: () => haptic('error'),
    selection: () => haptic('selection'),
  };
}
