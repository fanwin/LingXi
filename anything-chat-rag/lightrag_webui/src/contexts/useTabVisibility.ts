import { useContext } from 'react';
import { TabVisibilityContext } from './context';
import { TabVisibilityContextType } from './types';
// @ts-expect-error  MC8yOmFIVnBZMlhvaklQb3RvVTZkMVJFY2c9PTo5NjJhODk2Zg==

/**
 * Custom hook to access the tab visibility context
 * @returns The tab visibility context
 */
export const useTabVisibility = (): TabVisibilityContextType => {
  const context = useContext(TabVisibilityContext);

  if (!context) {
    throw new Error('useTabVisibility must be used within a TabVisibilityProvider');
  }

  return context;
};
// TODO  MS8yOmFIVnBZMlhvaklQb3RvVTZkMVJFY2c9PTo5NjJhODk2Zg==
