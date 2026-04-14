import { useCallback, useEffect, useState, useRef } from 'react';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { useSettingsStore } from '@/stores/settings';
import { useGraphStore } from '@/stores/graph';
import { useBackendState } from '@/stores/state';
import {
  dropdownDisplayLimit,
  popularLabelsDefaultLimit,
  searchLabelsDefaultLimit
} from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Search, Database } from 'lucide-react';
import Button from '@/components/ui/Button';
import { SearchHistoryManager } from '@/utils/SearchHistoryManager';
import { getPopularLabels, searchLabels } from '@/api/lightrag';
import { cn } from '@/lib/utils';
// eslint-disable  MC8zOmFIVnBZMlhvaklQb3RvVTZhR2hTU1E9PTo1YjIwMDJjMw==

const GraphLabels = () => {
  const { t } = useTranslation();
  const label = useSettingsStore.use.queryLabel();
  const dropdownRefreshTrigger = useSettingsStore.use.searchLabelDropdownRefreshTrigger();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectKey, setSelectKey] = useState(0);

  const pipelineBusy = useBackendState.use.pipelineBusy();
  const prevPipelineBusy = useRef<boolean | undefined>(undefined);
  const shouldRefreshPopularLabelsRef = useRef(false);

  const getRefreshTooltip = useCallback(() => {
    if (isRefreshing) {
      return t('graphPanel.graphLabels.refreshingTooltip');
    }

    if (!label || label === '*') {
      return t('graphPanel.graphLabels.refreshGlobalTooltip');
    } else {
      return t('graphPanel.graphLabels.refreshCurrentLabelTooltip', { label });
    }
  }, [label, t, isRefreshing]);

  useEffect(() => {
    const initializeHistory = async () => {
      const history = SearchHistoryManager.getHistory();

      if (history.length === 0) {
        try {
          const popularLabels = await getPopularLabels(popularLabelsDefaultLimit);
          await SearchHistoryManager.initializeWithDefaults(popularLabels);
        } catch (error) {
          console.error('Failed to initialize search history:', error);
        }
      }
    };

    initializeHistory();
  }, []);

  useEffect(() => {
    setSelectKey((prev) => prev + 1);
  }, [label]);

  useEffect(() => {
    if (dropdownRefreshTrigger > 0) {
      setSelectKey((prev) => prev + 1);
    }
  }, [dropdownRefreshTrigger]);

  useEffect(() => {
    if (prevPipelineBusy.current === true && pipelineBusy === false) {
      console.log('Pipeline changed from busy to idle, marking for popular labels refresh');
      shouldRefreshPopularLabelsRef.current = true;
    }
    prevPipelineBusy.current = pipelineBusy;
  }, [pipelineBusy]);

  const reloadPopularLabels = useCallback(async () => {
    if (!shouldRefreshPopularLabelsRef.current) return;

    console.log('Reloading popular labels (triggered by pipeline idle)');
    try {
      const popularLabels = await getPopularLabels(popularLabelsDefaultLimit);
      SearchHistoryManager.clearHistory();

      if (popularLabels.length === 0) {
        const fallbackLabels = ['entity', 'relationship', 'document', 'concept'];
        await SearchHistoryManager.initializeWithDefaults(fallbackLabels);
      } else {
        await SearchHistoryManager.initializeWithDefaults(popularLabels);
      }
    } catch (error) {
      console.error('Failed to reload popular labels:', error);
      const fallbackLabels = ['entity', 'relationship', 'document'];
      SearchHistoryManager.clearHistory();
      await SearchHistoryManager.initializeWithDefaults(fallbackLabels);
    } finally {
      shouldRefreshPopularLabelsRef.current = false;
    }
  }, []);

  const bumpDropdownData = useCallback(({ forceSelectKey = false } = {}) => {
    setRefreshTrigger((prev) => prev + 1);
    if (forceSelectKey) {
      setSelectKey((prev) => prev + 1);
    }
  }, []);

  const fetchData = useCallback(
    async (query?: string): Promise<string[]> => {
      let results: string[] = [];
      if (!query || query.trim() === '' || query.trim() === '*') {
        results = SearchHistoryManager.getHistoryLabels(dropdownDisplayLimit);
      } else {
        try {
          const apiResults = await searchLabels(query.trim(), searchLabelsDefaultLimit);
          results =
            apiResults.length <= dropdownDisplayLimit
              ? apiResults
              : [...apiResults.slice(0, dropdownDisplayLimit), '...'];
        } catch (error) {
          console.error('Search API failed, falling back to local history search:', error);

          const history = SearchHistoryManager.getHistory();
          const queryLower = query.toLowerCase().trim();
          results = history
            .filter((item) => item.label.toLowerCase().includes(queryLower))
            .map((item) => item.label)
            .slice(0, dropdownDisplayLimit);
        }
      }
      const finalResults = ['*', ...results.filter((label) => label !== '*')];
      return finalResults;
    },
    [refreshTrigger]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    useGraphStore.getState().setTypeColorMap(new Map<string, string>());

    try {
      let currentLabel = label;

      if (!currentLabel || currentLabel.trim() === '') {
        useSettingsStore.getState().setQueryLabel('*');
        currentLabel = '*';
      }

      if (shouldRefreshPopularLabelsRef.current) {
        await reloadPopularLabels();
        bumpDropdownData({ forceSelectKey: true });
      }

      if (currentLabel && currentLabel !== '*') {
        console.log(`Refreshing current label: ${currentLabel}`);

        useGraphStore.getState().setGraphDataFetchAttempted(false);
        useGraphStore.getState().setLastSuccessfulQueryLabel('');
        useGraphStore.getState().incrementGraphDataVersion();
      } else {
        console.log('Refreshing global data and popular labels');

        try {
          const popularLabels = await getPopularLabels(popularLabelsDefaultLimit);
          SearchHistoryManager.clearHistory();

          if (popularLabels.length === 0) {
            const fallbackLabels = ['entity', 'relationship', 'document', 'concept'];
            await SearchHistoryManager.initializeWithDefaults(fallbackLabels);
          } else {
            await SearchHistoryManager.initializeWithDefaults(popularLabels);
          }
        } catch (error) {
          console.error('Failed to reload popular labels:', error);
          const fallbackLabels = ['entity', 'relationship', 'document'];
          SearchHistoryManager.clearHistory();
          await SearchHistoryManager.initializeWithDefaults(fallbackLabels);
        }

        useGraphStore.getState().setGraphDataFetchAttempted(false);
        useGraphStore.getState().setLastSuccessfulQueryLabel('');
        useGraphStore.getState().incrementGraphDataVersion();

        await new Promise((resolve) => setTimeout(resolve, 0));

        setRefreshTrigger((prev) => prev + 1);
        setSelectKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [label, reloadPopularLabels, bumpDropdownData]);

  const handleDropdownBeforeOpen = useCallback(async () => {
    const currentLabel = useSettingsStore.getState().queryLabel;
    if (shouldRefreshPopularLabelsRef.current && (!currentLabel || currentLabel === '*')) {
      await reloadPopularLabels();
      bumpDropdownData();
    }
  }, [reloadPopularLabels, bumpDropdownData]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-border/60 bg-background/95 p-1.5 shadow-lg backdrop-blur-md',
        'transition-all duration-200 ease-out hover:shadow-xl'
      )}
    >
      {/* Refresh Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={handleRefresh}
        tooltip={getRefreshTooltip()}
        side="bottom"
        disabled={isRefreshing}
        className={cn(
          'h-8 w-8 rounded-lg transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground hover:scale-105',
          'active:scale-95 disabled:opacity-50',
          isRefreshing && 'cursor-not-allowed'
        )}
      >
        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
      </Button>

      {/* Divider */}
      <div className="h-5 w-px bg-border/60" />

      {/* Label Selector */}
      <div className="w-full min-w-[240px] max-w-[400px]">
        <AsyncSelect<string>
          key={selectKey}
          className="min-w-[240px]"
          triggerClassName="h-8 w-full overflow-hidden rounded-lg border-0 bg-transparent text-sm font-medium shadow-none focus:ring-0"
          searchInputClassName="h-8 rounded-lg"
          triggerTooltip={t('graphPanel.graphLabels.selectTooltip')}
          fetcher={fetchData}
          onBeforeOpen={handleDropdownBeforeOpen}
          renderOption={(item) => (
            <div className="flex items-center gap-2 truncate py-0.5" title={item}>
              {item === '*' ? (
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-sm">{item}</span>
            </div>
          )}
          getOptionValue={(item) => item}
          getDisplayValue={(item) => (
            <div className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
              {item === '*' ? (
                <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate" title={item}>
                {item}
              </span>
            </div>
          )}
          notFound={
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('graphPanel.graphLabels.noLabels')}
            </div>
          }
          ariaLabel={t('graphPanel.graphLabels.label')}
          placeholder={t('graphPanel.graphLabels.placeholder')}
          searchPlaceholder={t('graphPanel.graphLabels.placeholder')}
          noResultsMessage={t('graphPanel.graphLabels.noLabels')}
          value={label !== null ? label : '*'}
          onChange={(newLabel) => {
            const currentLabel = useSettingsStore.getState().queryLabel;

            if (newLabel === '...') {
              newLabel = '*';
            }

            if (newLabel === currentLabel && newLabel !== '*') {
              newLabel = '*';
            }

            if (newLabel && newLabel !== '*' && newLabel !== '...' && newLabel.trim() !== '') {
              SearchHistoryManager.addToHistory(newLabel);
            }

            useGraphStore.getState().setGraphDataFetchAttempted(false);
            useSettingsStore.getState().setQueryLabel(newLabel);
            useGraphStore.getState().incrementGraphDataVersion();
          }}
          clearable={false}
          debounceTime={500}
        />
      </div>
    </div>
  );
};
// NOTE  MS8zOmFIVnBZMlhvaklQb3RvVTZhR2hTU1E9PTo1YjIwMDJjMw==

export default GraphLabels;
// @ts-expect-error  Mi8zOmFIVnBZMlhvaklQb3RvVTZhR2hTU1E9PTo1YjIwMDJjMw==
