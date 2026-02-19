/**
 * Jest setup file for JournalLink tests
 * Configures mocks and global test utilities
 */

// Mock expo-sqlite for all tests
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
  SQLiteDatabase: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  hasStringAsync: jest.fn().mockResolvedValue(false),
}));

// Mock expo-barcode-scanner
jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
}));

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Mock React Native modules that Jest has trouble with
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: (obj) => obj.ios || obj.default,
    },
    NativeModules: {
      ...RN.NativeModules,
      UIManager: {
        RCTView: () => {},
      },
    },
    Animated: {
      ...RN.Animated,
      timing: () => ({
        start: jest.fn(),
        stop: jest.fn(),
      }),
      spring: () => ({
        start: jest.fn(),
        stop: jest.fn(),
      }),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(),
      })),
    },
  };
});

// Silence console warnings in tests (optional, remove if you want to see warnings)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') || args[0].includes('NativeEventEmitter'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global test utilities
global.testUtils = {
  // Helper to create a mock database
  createMockDb: () => ({
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
  
  // Helper to wait for async operations
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
};
