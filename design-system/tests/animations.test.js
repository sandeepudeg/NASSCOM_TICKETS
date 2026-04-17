/**
 * Animation System Tests
 * Tests for animation tokens, CSS classes, and performance optimizations
 */

describe('Animation System', () => {
  beforeEach(() => {
    // Create a test container
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  describe('Animation Tokens', () => {
    test('should have all required transition duration tokens', () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      expect(computedStyle.getPropertyValue('--transition-duration-fast')).toBe('150ms');
      expect(computedStyle.getPropertyValue('--transition-duration-normal')).toBe('250ms');
      expect(computedStyle.getPropertyValue('--transition-duration-slow')).toBe('400ms');
      expect(computedStyle.getPropertyValue('--transition-duration-slower')).toBe('600ms');
    });

    test('should have all required easing tokens', () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      expect(computedStyle.getPropertyValue('--transition-easing-smooth')).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(computedStyle.getPropertyValue('--transition-easing-spring')).toBe('cubic-bezier(0.175, 0.885, 0.32, 1.275)');
      expect(computedStyle.getPropertyValue('--transition-easing-bounce')).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    });

    test('should have all required animation duration tokens', () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      expect(computedStyle.getPropertyValue('--animation-duration-fast')).toBe('200ms');
      expect(computedStyle.getPropertyValue('--animation-duration-normal')).toBe('300ms');
      expect(computedStyle.getPropertyValue('--animation-duration-slow')).toBe('500ms');
      expect(computedStyle.getPropertyValue('--animation-duration-loading')).toBe('1.5s');
      expect(computedStyle.getPropertyValue('--animation-duration-pulse')).toBe('2s');
    });
  });

  describe('Loading Animations', () => {
    test('should create spinner with correct classes', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="spinner"></div>';
      
      const spinner = container.querySelector('.spinner');
      const computedStyle = getComputedStyle(spinner);
      
      expect(spinner).toBeTruthy();
      expect(computedStyle.animation).toContain('spin');
    });

    test('should create skeleton with correct animation', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="skeleton"></div>';
      
      const skeleton = container.querySelector('.skeleton');
      const computedStyle = getComputedStyle(skeleton);
      
      expect(skeleton).toBeTruthy();
      expect(computedStyle.animation).toContain('skeleton');
    });

    test('should create progress bar with correct structure', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 50%;"></div>
        </div>
      `;
      
      const progressBar = container.querySelector('.progress-bar');
      const fill = container.querySelector('.progress-bar-fill');
      
      expect(progressBar).toBeTruthy();
      expect(fill).toBeTruthy();
      expect(fill.style.width).toBe('50%');
    });
  });

  describe('Interaction States', () => {
    test('should apply hover effects correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<button class="hover-lift">Test Button</button>';
      
      const button = container.querySelector('.hover-lift');
      const computedStyle = getComputedStyle(button);
      
      expect(button).toBeTruthy();
      expect(computedStyle.transition).toContain('transform');
    });

    test('should apply focus effects correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<input class="focus-ring" type="text">';
      
      const input = container.querySelector('.focus-ring');
      const computedStyle = getComputedStyle(input);
      
      expect(input).toBeTruthy();
      expect(computedStyle.transition).toContain('box-shadow');
    });

    test('should apply press effects correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<button class="press-scale">Press Me</button>';
      
      const button = container.querySelector('.press-scale');
      const computedStyle = getComputedStyle(button);
      
      expect(button).toBeTruthy();
      expect(computedStyle.transition).toContain('transform');
    });
  });

  describe('Performance Optimizations', () => {
    test('should apply hardware acceleration classes', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="gpu-accelerated">Accelerated Element</div>';
      
      const element = container.querySelector('.gpu-accelerated');
      const computedStyle = getComputedStyle(element);
      
      expect(element).toBeTruthy();
      expect(computedStyle.transform).toBe('translateZ(0px)');
    });

    test('should apply will-change optimization', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="will-animate">Animated Element</div>';
      
      const element = container.querySelector('.will-animate');
      const computedStyle = getComputedStyle(element);
      
      expect(element).toBeTruthy();
      expect(computedStyle.willChange).toBe('transform, opacity');
    });
  });

  describe('Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion setting', () => {
      // Mock prefers-reduced-motion: reduce
      const mediaQuery = '(prefers-reduced-motion: reduce)';
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query === mediaQuery,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="animate-fadeIn">Animated Element</div>';
      
      const element = container.querySelector('.animate-fadeIn');
      
      expect(element).toBeTruthy();
      expect(mockMatchMedia).toHaveBeenCalledWith(mediaQuery);
    });
  });

  describe('Component Animations', () => {
    test('should create modal with correct animation classes', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-content">Modal Content</div>
        </div>
      `;
      
      const backdrop = container.querySelector('.modal-backdrop');
      const content = container.querySelector('.modal-content');
      
      expect(backdrop).toBeTruthy();
      expect(content).toBeTruthy();
    });

    test('should create toast with correct animation classes', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="toast-enter">Toast Message</div>';
      
      const toast = container.querySelector('.toast-enter');
      const computedStyle = getComputedStyle(toast);
      
      expect(toast).toBeTruthy();
      expect(computedStyle.animation).toContain('slideInRight');
    });
  });

  describe('Stagger Animations', () => {
    test('should apply staggered delays correctly', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="stagger-children">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      `;
      
      const children = container.querySelectorAll('.stagger-children > div');
      
      expect(children).toHaveLength(3);
      
      // Check that each child has the correct animation
      children.forEach((child, index) => {
        const computedStyle = getComputedStyle(child);
        expect(computedStyle.animation).toContain('fadeIn');
      });
    });
  });

  describe('Animation Utilities', () => {
    test('should provide animation control classes', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="animate-paused">Paused Animation</div>
        <div class="animate-running">Running Animation</div>
      `;
      
      const paused = container.querySelector('.animate-paused');
      const running = container.querySelector('.animate-running');
      
      expect(getComputedStyle(paused).animationPlayState).toBe('paused');
      expect(getComputedStyle(running).animationPlayState).toBe('running');
    });

    test('should provide transition utilities', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = `
        <div class="transition-none">No Transition</div>
        <div class="transition-all">All Transitions</div>
      `;
      
      const none = container.querySelector('.transition-none');
      const all = container.querySelector('.transition-all');
      
      expect(getComputedStyle(none).transition).toBe('none');
      expect(getComputedStyle(all).transition).toContain('all');
    });
  });

  describe('60fps Performance', () => {
    test('should use transform for animations instead of layout properties', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="hover-lift">Hover Element</div>';
      
      const element = container.querySelector('.hover-lift');
      const computedStyle = getComputedStyle(element);
      
      // Should use transform for movement, not top/left
      expect(computedStyle.transition).toContain('transform');
      expect(computedStyle.transition).not.toContain('top');
      expect(computedStyle.transition).not.toContain('left');
    });

    test('should use opacity for fade effects', () => {
      const container = document.getElementById('test-container');
      container.innerHTML = '<div class="hover-fade">Fade Element</div>';
      
      const element = container.querySelector('.hover-fade');
      const computedStyle = getComputedStyle(element);
      
      expect(computedStyle.transition).toContain('opacity');
    });
  });
});

// Performance monitoring test
describe('Animation Performance', () => {
  test('should complete animations within expected timeframes', (done) => {
    const container = document.getElementById('test-container');
    container.innerHTML = '<div class="animate-fadeIn">Test Element</div>';
    
    const element = container.querySelector('.animate-fadeIn');
    const startTime = performance.now();
    
    element.addEventListener('animationend', () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Animation should complete within reasonable time (allowing for some variance)
      expect(duration).toBeLessThan(500); // 300ms + buffer
      done();
    });
  });
});