import { ref, onMounted, onUnmounted, Ref } from 'vue';

/**
 * Lazy load images when they enter viewport
 */
export const useLazyImage = (imageRef: Ref<HTMLImageElement | null>) => {
  const isLoaded = ref(false);
  const isError = ref(false);
  let observer: IntersectionObserver | null = null;

  const loadImage = () => {
    if (!imageRef.value) return;

    const img = imageRef.value;
    const src = img.dataset.src;

    if (src) {
      img.src = src;
      img.onload = () => {
        isLoaded.value = true;
      };
      img.onerror = () => {
        isError.value = true;
      };
    }
  };

  onMounted(() => {
    if (!imageRef.value) return;

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer?.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(imageRef.value);
    } else {
      // Fallback for browsers without IntersectionObserver
      loadImage();
    }
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return {
    isLoaded,
    isError
  };
};

/**
 * Debounce function for performance optimization
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * Throttle function for performance optimization
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Track element visibility in viewport
 */
export const useIntersectionObserver = (
  elementRef: Ref<HTMLElement | null>,
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!elementRef.value) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          callback(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(elementRef.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return {
    disconnect: () => observer?.disconnect()
  };
};

/**
 * Measure component render performance
 */
export const usePerformanceMeasure = (componentName: string) => {
  const startTime = ref(0);
  const endTime = ref(0);
  const duration = ref(0);

  const start = () => {
    startTime.value = performance.now();
  };

  const end = () => {
    endTime.value = performance.now();
    duration.value = endTime.value - startTime.value;
    
    if (duration.value > 16) { // More than one frame (60fps)
      console.warn(`[Performance] ${componentName} took ${duration.value.toFixed(2)}ms to render`);
    }
  };

  onMounted(() => {
    start();
  });

  return {
    start,
    end,
    duration
  };
};

/**
 * Cache computed values to avoid re-computation
 */
export const useMemoize = <T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize: number = 100
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);

    // Limit cache size
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Virtual scrolling for large lists
 */
export const useVirtualScroll = <T>(
  items: Ref<T[]>,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) => {
  const scrollTop = ref(0);

  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight);
    const end = Math.ceil((scrollTop.value + containerHeight) / itemHeight);

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.value.length, end + overscan)
    };
  });

  const visibleItems = computed(() => {
    return items.value.slice(visibleRange.value.start, visibleRange.value.end);
  });

  const totalHeight = computed(() => {
    return items.value.length * itemHeight;
  });

  const offsetY = computed(() => {
    return visibleRange.value.start * itemHeight;
  });

  const onScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    scrollTop.value = target.scrollTop;
  };

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    onScroll
  };
};

import { computed } from 'vue';

/**
 * Detect if user prefers reduced motion
 */
export const usePrefersReducedMotion = () => {
  const prefersReducedMotion = ref(false);

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.value = mediaQuery.matches;

    mediaQuery.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches;
    });
  }

  return {
    prefersReducedMotion
  };
};

/**
 * Memory-efficient array chunk utility
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
