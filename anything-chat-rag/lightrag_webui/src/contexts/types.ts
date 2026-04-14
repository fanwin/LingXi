export interface TabVisibilityContextType {
  visibleTabs: Record<string, boolean>;
  setTabVisibility: (tabId: string, isVisible: boolean) => void;
  isTabVisible: (tabId: string) => boolean;
}
// TODO  MC8yOmFIVnBZMlhvaklQb3RvVTZlSEJ6VVE9PTphMGJmMjQ5MA==
