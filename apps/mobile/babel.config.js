module.exports = function(api) {
  api.cache(true);
  return {
    // babel-preset-expo ya incluye expo-router y reanimated/worklets (SDK 58)
    presets: ['babel-preset-expo', 'nativewind/babel'],
  };
};
