/**
 * TicketIQ Design System - Accessibility Utilities
 * WCAG 2.1 AA Compliance Helpers
 */

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: Element): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
      .filter(el => this.isVisible(el)) as HTMLElement[];
  }

  /**
   * Check if an element is visible and focusable
   */
  static isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  /**
   * Trap focus within a container (for modals, dropdowns)
   */
  static trapFocus(container: Element, initialFocus?: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus initial element or first focusable element
    if (initialFocus && focusableElements.includes(initialFocus)) {
      initialFocus.focus();
    } else if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Restore focus to a previously focused element
   */
  static restoreFocus(element: HTMLElement | null): void {
    if (element && this.isVisible(element)) {
      element.focus();
    }
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation for lists, menus, tabs
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      onSelect?: (index: number) => void;
    } = {}
  ): number {
    const { orientation = 'vertical', wrap = true, onSelect } = options;
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap && currentIndex === items.length - 1 ? 0 : 
                    Math.min(currentIndex + 1, items.length - 1);
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap && currentIndex === 0 ? items.length - 1 : 
                    Math.max(currentIndex - 1, 0);
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap && currentIndex === items.length - 1 ? 0 : 
                    Math.min(currentIndex + 1, items.length - 1);
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = wrap && currentIndex === 0 ? items.length - 1 : 
                    Math.max(currentIndex - 1, 0);
        }
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(currentIndex);
        return currentIndex;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
      onSelect?.(newIndex);
    }

    return newIndex;
  }

  /**
   * Add keyboard navigation to a container
   */
  static addArrowNavigation(
    container: Element,
    itemSelector: string,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      onSelect?: (element: HTMLElement, index: number) => void;
    } = {}
  ): () => void {
    let currentIndex = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
      const activeElement = document.activeElement as HTMLElement;
      const activeIndex = items.indexOf(activeElement);
      
      if (activeIndex !== -1) {
        currentIndex = activeIndex;
      }

      currentIndex = this.handleArrowNavigation(event, items, currentIndex, {
        ...options,
        onSelect: options.onSelect ? (index) => options.onSelect!(items[index], index) : undefined
      });
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
  private static liveRegions: Map<string, HTMLElement> = new Map();

  /**
   * Create or get a live region for announcements
   */
  static getLiveRegion(type: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const key = `live-region-${type}`;
    
    if (!this.liveRegions.has(key)) {
      const region = document.createElement('div');
      region.setAttribute('aria-live', type);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      region.id = key;
      document.body.appendChild(region);
      this.liveRegions.set(key, region);
    }

    return this.liveRegions.get(key)!;
  }

  /**
   * Announce a message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = this.getLiveRegion(priority);
    
    // Clear and set new message
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }

  /**
   * Announce form validation errors
   */
  static announceFormErrors(errors: string[]): void {
    const message = errors.length === 1 
      ? `Form error: ${errors[0]}`
      : `Form has ${errors.length} errors: ${errors.join(', ')}`;
    
    this.announce(message, 'assertive');
  }

  /**
   * Announce successful actions
   */
  static announceSuccess(message: string): void {
    this.announce(message, 'polite');
  }
}

// Color contrast utilities
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const lum1 = this.getLuminance(...color1);
    const lum2 = this.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAGAA(
    foreground: [number, number, number], 
    background: [number, number, number],
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAGAAA(
    foreground: [number, number, number], 
    background: [number, number, number],
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  /**
   * Parse hex color to RGB
   */
  static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
}

// Motion preferences
export class MotionPreferences {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Apply motion preferences to animations
   */
  static respectMotionPreferences(element: HTMLElement): void {
    if (this.prefersReducedMotion()) {
      element.style.animationDuration = '0.01ms';
      element.style.animationIterationCount = '1';
      element.style.transitionDuration = '0.01ms';
    }
  }

  /**
   * Add motion preference listener
   */
  static addMotionPreferenceListener(callback: (prefersReduced: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
}

// Form validation accessibility
export class FormValidation {
  /**
   * Add accessible validation to a form field
   */
  static addFieldValidation(
    field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    options: {
      errorContainer?: HTMLElement;
      successContainer?: HTMLElement;
      liveValidation?: boolean;
    } = {}
  ): void {
    const { errorContainer, successContainer, liveValidation = true } = options;

    const validateField = () => {
      const isValid = field.checkValidity();
      const errorMessage = field.validationMessage;

      // Update ARIA attributes
      field.setAttribute('aria-invalid', isValid ? 'false' : 'true');

      // Update error container
      if (errorContainer) {
        if (isValid) {
          errorContainer.textContent = '';
          errorContainer.style.display = 'none';
        } else {
          errorContainer.textContent = errorMessage;
          errorContainer.style.display = 'block';
          if (liveValidation) {
            ScreenReaderAnnouncer.announce(`Error: ${errorMessage}`, 'assertive');
          }
        }
      }

      // Update success container
      if (successContainer) {
        if (isValid && field.value) {
          successContainer.style.display = 'block';
        } else {
          successContainer.style.display = 'none';
        }
      }

      return isValid;
    };

    // Add event listeners
    field.addEventListener('blur', validateField);
    if (liveValidation) {
      field.addEventListener('input', validateField);
    }
  }

  /**
   * Validate entire form and announce errors
   */
  static validateForm(form: HTMLFormElement): boolean {
    const invalidFields = Array.from(form.elements).filter(
      (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
        (element instanceof HTMLInputElement || 
         element instanceof HTMLSelectElement || 
         element instanceof HTMLTextAreaElement) &&
        !element.checkValidity()
    );

    if (invalidFields.length > 0) {
      const errors = invalidFields.map(field => field.validationMessage);
      ScreenReaderAnnouncer.announceFormErrors(errors);
      
      // Focus first invalid field
      invalidFields[0].focus();
      
      return false;
    }

    return true;
  }
}

// Touch target utilities
export class TouchTargets {
  /**
   * Ensure minimum touch target size (44x44px)
   */
  static ensureMinimumSize(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const minSize = 44;

    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
      element.style.display = element.style.display || 'inline-flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
    }
  }

  /**
   * Add adequate spacing between touch targets
   */
  static addTouchTargetSpacing(container: HTMLElement, selector: string): void {
    const targets = container.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    
    targets.forEach((target, index) => {
      if (index > 0) {
        target.style.marginLeft = target.style.marginLeft || '8px';
      }
    });
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  /**
   * Check for common accessibility issues
   */
  static runBasicChecks(container: Element = document.body): string[] {
    const issues: string[] = [];

    // Check for images without alt text
    const images = container.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for form inputs without labels
    const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !container.querySelector(`label[for="${id}"]`);
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs missing labels`);
    }

    // Check for buttons without accessible names
    const buttons = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const unlabeledButtons = Array.from(buttons).filter(button => 
      !button.textContent?.trim()
    );
    if (unlabeledButtons.length > 0) {
      issues.push(`${unlabeledButtons.length} buttons missing accessible names`);
    }

    // Check for headings hierarchy
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push('Heading hierarchy skips levels');
        break;
      }
      previousLevel = level;
    }

    return issues;
  }

  /**
   * Log accessibility issues to console
   */
  static logIssues(container?: Element): void {
    const issues = this.runBasicChecks(container);
    
    if (issues.length === 0) {
      console.log('✅ No basic accessibility issues found');
    } else {
      console.warn('⚠️ Accessibility issues found:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    }
  }
}

// Export all utilities
export {
  FocusManager,
  KeyboardNavigation,
  ScreenReaderAnnouncer,
  ColorContrast,
  MotionPreferences,
  FormValidation,
  TouchTargets,
  AccessibilityTester
};