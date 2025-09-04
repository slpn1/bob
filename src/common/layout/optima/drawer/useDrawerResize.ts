import * as React from 'react';

const DRAWER_WIDTH_STORAGE_KEY = 'optima-drawer-width';
const DEFAULT_DRAWER_WIDTH = 320;

export function useDrawerResize() {
  const [drawerWidth, setDrawerWidth] = React.useState<number>(() => {
    // Initialize from localStorage or use default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY);
      return stored ? parseFloat(stored) : DEFAULT_DRAWER_WIDTH;
    }
    return DEFAULT_DRAWER_WIDTH;
  });

  // Update CSS variable when width changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--AGI-Desktop-Drawer-width', `${drawerWidth}px`);
    }
  }, [drawerWidth]);

  const updateDrawerWidth = React.useCallback((newWidth: number) => {
    setDrawerWidth(newWidth);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRAWER_WIDTH_STORAGE_KEY, newWidth.toString());
    }
  }, []);

  return {
    drawerWidth,
    updateDrawerWidth,
  };
}