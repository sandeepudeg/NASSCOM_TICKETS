import React, { Suspense, lazy, ComponentType } from 'react';
import { performanceOptimizer } from '../../utils/performance';

/**
 * Lazy loading utility for React components
 * Implements performance optimization with proper loading states
 */

interface LazyLoaderProps {
  fallback?: React.ReactNode;
  onLoad?: (componentName: string) => void;
  preload?: boolean;
}

interface LazyComponentOptions {
  name: string;
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  preload?: boolean;
}

/**
 * Creates a lazy-loaded component with performance optimization
 */
export function createLazyComponent<T = any>({
  name,
  loader,
  fallback,
  preload = false
}: LazyComponentOptions): ComponentType<T> {
  const LazyComponent = lazy(loader);
  
  // Preload if requested
  if (preload) {
    performanceOptimizer.preloadCritical([name]);
  }
  
  return function LazyWrapper(props: T) {
    const defaultFallback = (
      <div 
        className="skeleton" 
        data-component={name}
        style={{ 
          height: '2.5rem', 
          borderRadius: 'var(--borderRadius-md)' 
        }}
      />
    );
    
    return (
      <Suspense fallback={fallback || defaultFallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: Omit<LazyComponentOptions, 'loader'>
) {
  return createLazyComponent({
    ...options,
    loader: () => Promise.resolve({ default: Component })
  });
}

/**
 * Hook for managing lazy loading state
 */
export function useLazyLoading(componentName: string) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    if (elementRef.current) {
      performanceOptimizer.lazyLoad(elementRef.current, componentName);
      
      const handleLoad = () => {
        setIsLoaded(true);
        setIsLoading(false);
      };
      
      elementRef.current.addEventListener('componentLoaded', handleLoad);
      
      return () => {
        elementRef.current?.removeEventListener('componentLoaded', handleLoad);
      };
    }
  }, [componentName]);
  
  const startLoading = React.useCallback(() => {
    setIsLoading(true);
  }, []);
  
  return {
    isLoaded,
    isLoading,
    elementRef,
    startLoading
  };
}

/**
 * Component for lazy loading images with proper aspect ratio
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string;
  fallback?: React.ReactNode;
}

export function LazyImage({ 
  aspectRatio = '16/9', 
  fallback, 
  className = '',
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  
  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);
  
  const defaultFallback = (
    <div 
      className="img-skeleton"
      style={{ aspectRatio }}
    />
  );
  
  if (hasError) {
    return fallback || defaultFallback;
  }
  
  return (
    <div 
      className="aspect-ratio"
      style={{ aspectRatio }}
    >
      {!isLoaded && (fallback || defaultFallback)}
      <img
        {...props}
        className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...props.style,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
}

/**
 * Skeleton component for loading states
 */
interface SkeletonProps {
  variant?: 'text' | 'button' | 'input' | 'card' | 'image';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'button': return 'btn-skeleton';
      case 'input': return 'input-skeleton';
      case 'card': return 'card-skeleton';
      case 'image': return 'img-skeleton';
      default: return 'text-skeleton';
    }
  };
  
  return (
    <div
      className={`skeleton ${getVariantClass()} ${className}`}
      style={{
        width: width || undefined,
        height: height || undefined
      }}
    />
  );
}

/**
 * Performance monitoring component
 */
export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    performanceOptimizer.measurePerformance();
    
    // Monitor for layout shifts
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as any).hadRecentInput) continue;
        
        const clsValue = (entry as any).value;
        if (clsValue > 0.1) {
          console.warn('Layout shift detected:', clsValue);
        }
      }
    });
    
    if ('PerformanceObserver' in window) {
      observer.observe({ entryTypes: ['layout-shift'] });
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return <>{children}</>;
}