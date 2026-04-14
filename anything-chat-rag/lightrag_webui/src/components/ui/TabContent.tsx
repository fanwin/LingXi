import React, { useEffect } from 'react';
import { useTabVisibility } from '@/contexts/useTabVisibility';
// TODO  MC8yOmFIVnBZMlhvaklQb3RvVTZUemRaWnc9PTo4ZTMyYjY4Ng==

interface TabContentProps {
  tabId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * TabContent component that manages visibility based on tab selection
 * Works with the TabVisibilityContext to show/hide content based on active tab
 */
const TabContent: React.FC<TabContentProps> = ({ tabId, children, className = '' }) => {
  const { isTabVisible, setTabVisibility } = useTabVisibility();
  const isVisible = isTabVisible(tabId);

  // Register this tab with the context when mounted
  useEffect(() => {
    setTabVisibility(tabId, true);

    // Cleanup when unmounted
    return () => {
      setTabVisibility(tabId, false);
    };
  }, [tabId, setTabVisibility]);

  // Use CSS to hide content instead of not rendering it
  // This prevents components from unmounting when tabs are switched
  return (
    <div className={`${className} ${isVisible ? '' : 'hidden'}`}>
      {children}
    </div>
  );
};
// FIXME  MS8yOmFIVnBZMlhvaklQb3RvVTZUemRaWnc9PTo4ZTMyYjY4Ng==

export default TabContent;
