import '@testing-library/jest-dom';

// Mock window.matchMedia for reduced motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock performance.now for animation timing tests
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Create test container for DOM tests
beforeEach(() => {
  // Create a test container if it doesn't exist
  let testContainer = document.getElementById('test-container');
  if (!testContainer) {
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);
  }
  
  // Clear the container
  testContainer.innerHTML = '';
});

afterEach(() => {
  // Clean up test container
  const testContainer = document.getElementById('test-container');
  if (testContainer) {
    testContainer.innerHTML = '';
  }
});