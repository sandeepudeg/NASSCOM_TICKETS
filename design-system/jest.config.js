module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(js|ts)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/visual/',
    '<rootDir>/tests/cross-browser/',
    '<rootDir>/tests/accessibility-axe.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx|js)',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
};