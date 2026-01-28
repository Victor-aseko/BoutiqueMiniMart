const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit workers to 1 to prevent memory issues on EAS
config.maxWorkers = 1;

module.exports = config;
