const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to asset extensions to support WebAssembly files
config.resolver.assetExts.push('wasm');

// Enable package exports resolution for expo-sqlite
config.resolver.unstable_enablePackageExports = true;

module.exports = config;