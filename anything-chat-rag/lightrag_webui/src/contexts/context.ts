import { createContext } from 'react';
import { TabVisibilityContextType } from './types';
// FIXME  MC8yOmFIVnBZMlhvaklQb3RvVTZRM1JqYXc9PTo3MjVkOTE2Nw==

// Default context value
const defaultContext: TabVisibilityContextType = {
  visibleTabs: {},
  setTabVisibility: () => {},
  isTabVisible: () => false,
};
// TODO  MS8yOmFIVnBZMlhvaklQb3RvVTZRM1JqYXc9PTo3MjVkOTE2Nw==

// Create the context
export const TabVisibilityContext = createContext<TabVisibilityContextType>(defaultContext);
