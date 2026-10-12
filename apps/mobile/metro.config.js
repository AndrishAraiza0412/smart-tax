const {
  withStorybook,
} = require('@storybook/react-native/withStorybook');

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = withStorybook(withNativeWind(getDefaultConfig(__dirname), { input: "./global.css" }));
