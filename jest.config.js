/**
 * Jest configuration for JournalLink
 * Uses babel-jest with babel-preset-expo for TypeScript + Expo compatibility
 */

module.exports = {
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  
  // Module path aliases matching tsconfig
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transform TypeScript with babel-jest using babel.config.js
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Transform Expo/RN packages that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-svg|react-native-paper|react-native-reanimated|react-native-gesture-handler|lucide-react-native|zustand|uuid)/)',
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Timeout for async tests
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
