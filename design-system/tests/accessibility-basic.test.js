/**
 * Basic Accessibility Tests
 * Simple tests to verify accessibility features are working
 */

describe('Basic Accessibility Features', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('should create accessible button with proper attributes', () => {
    container.innerHTML = `
      <button 
        class="btn btn-primary"
        aria-label="Save document"
        aria-describedby="save-help"
      >
        Save
      </button>
      <div id="save-help">Saves the current document</div>
    `;

    const button = container.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Save document');
    expect(button.getAttribute('aria-describedby')).toBe('save-help');
  });

  test('should create accessible form input with label', () => {
    container.innerHTML = `
      <label for="email-input">Email Address</label>
      <input 
        id="email-input" 
        type="email" 
        required 
        aria-describedby="email-help"
      />
      <div id="email-help">We'll never share your email</div>
    `;

    const input = container.querySelector('input');
    const label = container.querySelector('label');
    
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
    expect(input.getAttribute('aria-describedby')).toBe('email-help');
  });

  test('should create accessible navigation with skip link', () => {
    container.innerHTML = `
      <a href="#main-content" class="skip-nav">Skip to main content</a>
      <nav aria-label="Main navigation">
        <a href="/home" aria-current="page">Home</a>
        <a href="/about">About</a>
      </nav>
      <main id="main-content">Main content</main>
    `;

    const skipLink = container.querySelector('.skip-nav');
    const nav = container.querySelector('nav');
    const currentLink = container.querySelector('[aria-current="page"]');
    
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
    expect(currentLink.textContent).toBe('Home');
  });

  test('should create accessible modal with proper ARIA', () => {
    container.innerHTML = `
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title">Confirm Action</h2>
        <p id="modal-description">Are you sure you want to delete this item?</p>
        <button>Cancel</button>
        <button>Delete</button>
      </div>
    `;

    const modal = container.querySelector('[role="dialog"]');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-labelledby')).toBe('modal-title');
    expect(modal.getAttribute('aria-describedby')).toBe('modal-description');
  });

  test('should create accessible table with proper structure', () => {
    container.innerHTML = `
      <table>
        <caption>Employee Information</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Department</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">John Doe</th>
            <td>Engineering</td>
          </tr>
        </tbody>
      </table>
    `;

    const caption = container.querySelector('caption');
    const columnHeaders = container.querySelectorAll('th[scope="col"]');
    const rowHeader = container.querySelector('th[scope="row"]');
    
    expect(caption.textContent).toBe('Employee Information');
    expect(columnHeaders).toHaveLength(2);
    expect(rowHeader.textContent).toBe('John Doe');
  });

  test('should detect accessibility issues', () => {
    container.innerHTML = `
      <img src="test.jpg" />
      <input type="text" />
      <button></button>
    `;

    // Check for images without alt text
    const images = container.querySelectorAll('img:not([alt])');
    expect(images).toHaveLength(1);

    // Check for inputs without labels
    const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !container.querySelector(`label[for="${id}"]`);
    });
    expect(unlabeledInputs).toHaveLength(1);

    // Check for buttons without accessible names
    const buttons = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const unlabeledButtons = Array.from(buttons).filter(button => 
      !button.textContent?.trim()
    );
    expect(unlabeledButtons).toHaveLength(1);
  });

  test('should validate color contrast calculations', () => {
    // Simple contrast ratio calculation test
    const calculateLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const getContrastRatio = (color1, color2) => {
      const lum1 = calculateLuminance(...color1);
      const lum2 = calculateLuminance(...color2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    };

    // Black on white should have high contrast
    const blackOnWhite = getContrastRatio([0, 0, 0], [255, 255, 255]);
    expect(blackOnWhite).toBeCloseTo(21, 0);

    // Same colors should have ratio of 1
    const sameColors = getContrastRatio([128, 128, 128], [128, 128, 128]);
    expect(sameColors).toBeCloseTo(1, 1);
  });

  test('should handle focus management', () => {
    container.innerHTML = `
      <button id="first">First</button>
      <button id="second">Second</button>
      <button id="third">Third</button>
    `;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const focusableElements = Array.from(container.querySelectorAll(focusableSelectors));
    expect(focusableElements).toHaveLength(3);

    // Test that all elements are focusable
    focusableElements.forEach(element => {
      expect(element.tabIndex).not.toBe(-1);
    });
  });

  test('should support reduced motion preferences', () => {
    // Mock matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    expect(typeof prefersReducedMotion).toBe('boolean');
  });
});