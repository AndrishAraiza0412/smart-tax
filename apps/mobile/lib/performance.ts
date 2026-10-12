import { useEffect } from "react";

let isInitialized = false;

export function initPerformance(): void {
  if (isInitialized) return;
  
  if (__DEV__) {
    try {
      isInitialized = true;
      console.log("🚀 Performance tracking initialized");
    } catch (e) {
      console.warn("Performance init failed:", e);
    }
  }
}

export function markComponentRender(componentName: string): void {
  if (!isInitialized) return;
  try {
    performance.mark(`component:${componentName}:render`);
  } catch {}
}

export function measureComponentRender(componentName: string): void {
  if (!isInitialized) return;
  try {
    performance.measure(
      `component:${componentName}:render`,
      `component:${componentName}:render-start`,
      `component:${componentName}:render-end`
    );
  } catch {}
}

export function trackNavigation(from: string, to: string): void {
  if (!isInitialized) return;
  try {
    performance.mark(`nav:${from}->${to}:start`);
    setTimeout(() => {
      performance.measure(`nav:${from}->${to}`, `nav:${from}->${to}:start`);
    }, 0);
  } catch {}
}

export function trackAsyncOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  if (!isInitialized) return operation();
  
  try {
    performance.mark(`${name}:start`);
  } catch {}
  
  return operation().finally(() => {
    try {
      performance.measure(name, `${name}:start`);
    } catch {}
  });
}

// Hook for component-level tracking
export function usePerformanceTracking(componentName: string): void {
  if (!__DEV__) return;
  
  useEffect(() => {
    try {
      performance.mark(`${componentName}:mount`);
    } catch {}
    return () => {
      try {
        performance.mark(`${componentName}:unmount`);
        performance.measure(`${componentName}:lifecycle`, `${componentName}:mount`, `${componentName}:unmount`);
      } catch {}
    };
  }, []);
}

// Wrapper for FlatList optimization tracking
export function useFlatListMetrics(listName: string) {
  const metricsRef = React.useRef({
    renderCount: 0,
    lastRenderTime: 0,
    totalItems: 0,
  });

  const onViewableItemsChanged = React.useCallback(({ viewableItems, changed }: any) => {
    metricsRef.current.totalItems = viewableItems.length;
    if (__DEV__ && changed.length > 0) {
      console.log(`📋 ${listName} viewable:`, viewableItems.length, "changed:", changed.length);
    }
  }, [listName]);

  const getMetrics = () => ({ ...metricsRef.current });

  return { onViewableItemsChanged, getMetrics };
}

// Memoization helpers - simplified with @ts-ignore
export const memo = <T extends React.ComponentType<any>>(
  Component: T,
  areEqual?: (prev: React.ComponentProps<T>, next: React.ComponentProps<T>) => boolean
): React.MemoExoticComponent<T> => {
  // @ts-ignore - React.memo typing issue with ComponentClass
  const Memoized = React.memo(Component, areEqual) as React.MemoExoticComponent<T>;
  if (__DEV__) {
    Memoized.displayName = `Memo(${Component.displayName || Component.name || "Component"})`;
  }
  return Memoized;
};

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return React.useCallback(callback, deps);
};

export const useMemoizedValue = <T>(factory: () => T, deps: React.DependencyList): T => {
  return React.useMemo(factory, deps);
};

import React from "react";