/**
 * TicketIQ Design System - Performance Utilities
 * Helper functions for optimizing component loading and performance
 */

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private observer: IntersectionObserver | null = null;
  private loadedComponents = new Set<string>();
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  
  constructor() {
    this.setupIntersectionObserver();
  }
  
  private setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadComponent(entry.target as HTMLElement);
            }
          });
        },
        {
          rootMargin: '50px', // Load 50px before entering viewport
          threshold: 0.1
        }
      );
    }
  }
  
  /**
   * Register a component for lazy loading
   */
  lazyLoad(element: HTMLElement, componentName: string): void {
    if (this.observer && !this.loadedComponents.has(componentName)) {
      element.setAttribute('data-component', componentName);
      this.observer.observe(element);
    }
  }
  
  /**
   * Load a component when it enters the viewport
   */
  private async loadComponent(element: HTMLElement): Promise<void> {
    const componentName = element.getAttribute('data-component');
    if (!componentName || this.loadedComponents.has(componentName)) {
      return;
    }
    
    try {
      // Remove skeleton loading state
      element.classList.remove('skeleton');
      
      // Mark as loaded
      this.loadedComponents.add(componentName);
      
      // Stop observing this element
      if (this.observer) {
        this.observer.unobserve(element);
      }
      
      // Dispatch loaded event
      const event = new CustomEvent('componentLoaded', {
        detail: { componentName, element }
      });
      element.dispatchEvent(event);
      
    } catch (error) {
      console.warn(`Failed to load component ${componentName}:`, error);
    }
  }
  
  /**
   * Preload critical components
   */
  preloadCritical(components: string[]): void {
    components.forEach(component => {
      this.loadedComponents.add(component);
    });
  }
  
  /**
   * Measure and report performance metrics
   */
  measurePerformance(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Measure paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        console.log(`${entry.name}: ${entry.startTime}ms`);
      });
      
      // Measure layout shift
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            console.warn(`Cumulative Layout Shift: ${clsValue}`);
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      }
    }
  }
  
  /**
   * Optimize images for better performance
   */
  optimizeImages(): void {
    const images = document.querySelectorAll('img[data-optimize]');
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      
      // Add loading="lazy" for off-screen images
      if (!imageElement.loading) {
        imageElement.loading = 'lazy';
      }
      
      // Add decoding="async" for better performance
      if (!imageElement.decoding) {
        imageElement.decoding = 'async';
      }
      
      // Set up aspect ratio to prevent layout shift
      const aspectRatio = imageElement.getAttribute('data-aspect-ratio');
      if (aspectRatio && imageElement.parentElement) {
        imageElement.parentElement.style.aspectRatio = aspectRatio;
      }
    });
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedComponents.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceOptimizer.measurePerformance();
      performanceOptimizer.optimizeImages();
    });
  } else {
    performanceOptimizer.measurePerformance();
    performanceOptimizer.optimizeImages();
  }
}