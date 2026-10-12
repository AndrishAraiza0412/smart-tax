import React from "react";

if (__DEV__) {
  // Import directly from dist to get the factory function (not the extended React)
  const whyDidYouRender = require("@welldone-software/why-did-you-render/dist/whyDidYouRender.js");

  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: true,
    hotReloadBufferMs: 500,
    exclude: [/^Icon$/, /^PressableComponent$/, /^Skeleton/],
    notifier: (notification: any) => {
      const { componentName, prevProps, nextProps, hookName } = notification;
      console.group(`🔄 ${componentName} re-rendered`);
      if (hookName) console.log(`Hook: ${hookName}`);
      if (prevProps && nextProps) {
        const diff = Object.keys(nextProps).filter(
          (k) => prevProps[k] !== nextProps[k]
        );
        console.log("Props changed:", diff);
      }
      console.groupEnd();
    },
  });

  // The library patches React.createElement internally.
  // No need to override it manually - doing so conflicts with React Native's internals.
  // Components are tracked via trackAllPureComponents: true
}

export {};