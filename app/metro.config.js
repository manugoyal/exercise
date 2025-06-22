const { getDefaultConfig } = require("@react-native/metro-config");

const config = getDefaultConfig(__dirname);

// Add support for web
config.resolver.platforms = ["ios", "android", "native", "web"];

module.exports = config;
