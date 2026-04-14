import { useState, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Separator from '@/components/ui/Separator';
import Input from '@/components/ui/Input';
// NOTE  MC80OmFIVnBZMlhvaklQb3RvVTZlRVExZWc9PTowNzc1MDk0NQ==

import { useSettingsStore } from '@/stores/settings';
import { useGraphStore } from '@/stores/graph';
import useRandomGraph from '@/hooks/useRandomGraph';

import {
  Settings2,
  Undo2,
  Shuffle,
  Eye,
  EyeOff,
  Move,
  Type,
  GitBranch,
  Activity,
  Layers,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
// @ts-expect-error  MS80OmFIVnBZMlhvaklQb3RvVTZlRVExZWc9PTowNzc1MDk0NQ==

/**
 * Component that displays a checkbox with an icon and label.
 */
const LabeledCheckBox = ({
  checked,
  onCheckedChange,
  label,
  icon: Icon
}: {
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const id = `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2 py-1.5',
        'transition-colors duration-150 hover:bg-accent/50 cursor-pointer'
      )}
      onClick={onCheckedChange}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      {Icon && (
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-colors duration-150',
            checked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
      )}
      <label
        htmlFor={id}
        className="cursor-pointer text-xs font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  );
};

/**
 * Component that displays a number input with a label.
 */
const LabeledNumberInput = ({
  value,
  onEditFinished,
  label,
  min,
  max,
  defaultValue,
  icon: Icon
}: {
  value: number;
  onEditFinished: (value: number) => void;
  label: string;
  min: number;
  max?: number;
  defaultValue?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const { t } = useTranslation();
  const [currentValue, setCurrentValue] = useState<number | null>(value);
  const id = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const onValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value.trim();
      if (text.length === 0) {
        setCurrentValue(null);
        return;
      }
      const newValue = Number.parseInt(text);
      if (!isNaN(newValue) && newValue !== currentValue) {
        if (min !== undefined && newValue < min) {
          return;
        }
        if (max !== undefined && newValue > max) {
          return;
        }
        setCurrentValue(newValue);
      }
    },
    [currentValue, min, max]
  );

  const onBlur = useCallback(() => {
    if (currentValue !== null && value !== currentValue) {
      onEditFinished(currentValue);
    }
  }, [value, currentValue, onEditFinished]);

  const handleReset = useCallback(() => {
    if (defaultValue !== undefined && value !== defaultValue) {
      setCurrentValue(defaultValue);
      onEditFinished(defaultValue);
    }
  }, [defaultValue, value, onEditFinished]);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg px-2 py-1.5 hover:bg-accent/30 transition-colors duration-150">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <label
          htmlFor={id}
          className="text-xs font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          type="number"
          value={currentValue === null ? '' : currentValue}
          onChange={onValueChange}
          className="h-6 w-full min-w-0 rounded-md border-border/50 bg-background px-2 text-xs pr-1 focus-visible:ring-primary"
          min={min}
          max={max}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onBlur();
            }
          }}
        />
        {defaultValue !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            type="button"
            title={t('graphPanel.sideBar.settings.resetToDefault')}
          >
            <Undo2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
// NOTE  Mi80OmFIVnBZMlhvaklQb3RvVTZlRVExZWc9PTowNzc1MDk0NQ==

/**
 * Section header for grouping related settings.
 */
const SettingsSection = ({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 px-2 py-1">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
    </div>
    <div className="space-y-0.5">{children}</div>
  </div>
);
// NOTE  My80OmFIVnBZMlhvaklQb3RvVTZlRVExZWc9PTowNzc1MDk0NQ==

/**
 * Enterprise-grade settings panel for graph viewer.
 * Provides comprehensive graph display and interaction options with professional styling.
 */
export default function Settings() {
  const [opened, setOpened] = useState<boolean>(false);
  const { t } = useTranslation();

  const showPropertyPanel = useSettingsStore.use.showPropertyPanel();
  const showNodeSearchBar = useSettingsStore.use.showNodeSearchBar();
  const showNodeLabel = useSettingsStore.use.showNodeLabel();
  const enableEdgeEvents = useSettingsStore.use.enableEdgeEvents();
  const enableNodeDrag = useSettingsStore.use.enableNodeDrag();
  const enableHideUnselectedEdges = useSettingsStore.use.enableHideUnselectedEdges();
  const showEdgeLabel = useSettingsStore.use.showEdgeLabel();
  const minEdgeSize = useSettingsStore.use.minEdgeSize();
  const maxEdgeSize = useSettingsStore.use.maxEdgeSize();
  const graphQueryMaxDepth = useSettingsStore.use.graphQueryMaxDepth();
  const graphMaxNodes = useSettingsStore.use.graphMaxNodes();
  const backendMaxGraphNodes = useSettingsStore.use.backendMaxGraphNodes();
  const graphLayoutMaxIterations = useSettingsStore.use.graphLayoutMaxIterations();
  const enableHealthCheck = useSettingsStore.use.enableHealthCheck();

  const { randomGraph } = useRandomGraph();

  const setEnableNodeDrag = useCallback(
    () => useSettingsStore.setState((pre) => ({ enableNodeDrag: !pre.enableNodeDrag })),
    []
  );
  const setEnableEdgeEvents = useCallback(
    () => useSettingsStore.setState((pre) => ({ enableEdgeEvents: !pre.enableEdgeEvents })),
    []
  );
  const setEnableHideUnselectedEdges = useCallback(
    () =>
      useSettingsStore.setState((pre) => ({
        enableHideUnselectedEdges: !pre.enableHideUnselectedEdges
      })),
    []
  );
  const setShowEdgeLabel = useCallback(
    () =>
      useSettingsStore.setState((pre) => ({
        showEdgeLabel: !pre.showEdgeLabel
      })),
    []
  );

  const setShowPropertyPanel = useCallback(
    () => useSettingsStore.setState((pre) => ({ showPropertyPanel: !pre.showPropertyPanel })),
    []
  );

  const setShowNodeSearchBar = useCallback(
    () => useSettingsStore.setState((pre) => ({ showNodeSearchBar: !pre.showNodeSearchBar })),
    []
  );

  const setShowNodeLabel = useCallback(
    () => useSettingsStore.setState((pre) => ({ showNodeLabel: !pre.showNodeLabel })),
    []
  );

  const setEnableHealthCheck = useCallback(
    () => useSettingsStore.setState((pre) => ({ enableHealthCheck: !pre.enableHealthCheck })),
    []
  );

  const setGraphQueryMaxDepth = useCallback((depth: number) => {
    if (depth < 1) return;
    useSettingsStore.setState({ graphQueryMaxDepth: depth });
    const currentLabel = useSettingsStore.getState().queryLabel;
    useSettingsStore.getState().setQueryLabel('');
    setTimeout(() => {
      useSettingsStore.getState().setQueryLabel(currentLabel);
    }, 300);
  }, []);

  const setGraphMaxNodes = useCallback(
    (nodes: number) => {
      const maxLimit = backendMaxGraphNodes || 1000;
      if (nodes < 1 || nodes > maxLimit) return;
      useSettingsStore.getState().setGraphMaxNodes(nodes, true);
    },
    [backendMaxGraphNodes]
  );

  const setGraphLayoutMaxIterations = useCallback((iterations: number) => {
    if (iterations < 1) return;
    useSettingsStore.setState({ graphLayoutMaxIterations: iterations });
  }, []);

  const handleGenerateRandomGraph = useCallback(() => {
    const graph = randomGraph();
    useGraphStore.getState().setSigmaGraph(graph);
  }, [randomGraph]);

  const saveSettings = () => setOpened(false);

  return (
    <>
      <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
        <Popover open={opened} onOpenChange={setOpened}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              tooltip={t('graphPanel.sideBar.settings.settings')}
              side="top"
              className={cn(
                'h-7 w-7 rounded-md transition-all duration-150',
                'hover:bg-accent hover:text-accent-foreground hover:scale-105',
                'active:scale-95',
                opened && 'bg-accent text-accent-foreground'
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={8}
            collisionPadding={5}
            className="w-72 p-0 overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-md"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                  <SlidersHorizontal className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {t('graphPanel.sideBar.settings.settings')}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-2">
              <div className="space-y-3">
                {/* Display Settings */}
                <SettingsSection
                  title={t('graphPanel.sideBar.settings.displaySection', 'Display')}
                  icon={Eye}
                >
                  <LabeledCheckBox
                    checked={showPropertyPanel}
                    onCheckedChange={setShowPropertyPanel}
                    label={t('graphPanel.sideBar.settings.showPropertyPanel')}
                    icon={Layers}
                  />
                  <LabeledCheckBox
                    checked={showNodeSearchBar}
                    onCheckedChange={setShowNodeSearchBar}
                    label={t('graphPanel.sideBar.settings.showSearchBar')}
                    icon={Search}
                  />
                </SettingsSection>

                <Separator className="bg-border/50" />

                {/* Node Settings */}
                <SettingsSection
                  title={t('graphPanel.sideBar.settings.nodeSection', 'Nodes')}
                  icon={Type}
                >
                  <LabeledCheckBox
                    checked={showNodeLabel}
                    onCheckedChange={setShowNodeLabel}
                    label={t('graphPanel.sideBar.settings.showNodeLabel')}
                    icon={Type}
                  />
                  <LabeledCheckBox
                    checked={enableNodeDrag}
                    onCheckedChange={setEnableNodeDrag}
                    label={t('graphPanel.sideBar.settings.nodeDraggable')}
                    icon={Move}
                  />
                </SettingsSection>

                <Separator className="bg-border/50" />

                {/* Edge Settings */}
                <SettingsSection
                  title={t('graphPanel.sideBar.settings.edgeSection', 'Edges')}
                  icon={GitBranch}
                >
                  <LabeledCheckBox
                    checked={showEdgeLabel}
                    onCheckedChange={setShowEdgeLabel}
                    label={t('graphPanel.sideBar.settings.showEdgeLabel')}
                    icon={Type}
                  />
                  <LabeledCheckBox
                    checked={enableHideUnselectedEdges}
                    onCheckedChange={setEnableHideUnselectedEdges}
                    label={t('graphPanel.sideBar.settings.hideUnselectedEdges')}
                    icon={EyeOff}
                  />
                  <LabeledCheckBox
                    checked={enableEdgeEvents}
                    onCheckedChange={setEnableEdgeEvents}
                    label={t('graphPanel.sideBar.settings.edgeEvents')}
                    icon={Activity}
                  />

                  {/* Edge Size Range */}
                  <div className="rounded-lg px-2 py-1.5 hover:bg-accent/30 transition-colors duration-150">
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {t('graphPanel.sideBar.settings.edgeSizeRange')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={minEdgeSize}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          if (!isNaN(newValue) && newValue >= 1 && newValue <= maxEdgeSize) {
                            useSettingsStore.setState({ minEdgeSize: newValue });
                          }
                        }}
                        className="h-6 w-14 rounded-md border-border/50 bg-background px-2 text-xs"
                        min={1}
                        max={Math.min(maxEdgeSize, 10)}
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={maxEdgeSize}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            if (!isNaN(newValue) && newValue >= minEdgeSize && newValue >= 1 && newValue <= 10) {
                              useSettingsStore.setState({ maxEdgeSize: newValue });
                            }
                          }}
                          className="h-6 w-14 rounded-md border-border/50 bg-background px-2 text-xs"
                          min={minEdgeSize}
                          max={10}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => useSettingsStore.setState({ minEdgeSize: 1, maxEdgeSize: 5 })}
                          type="button"
                          title={t('graphPanel.sideBar.settings.resetToDefault')}
                        >
                          <Undo2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </SettingsSection>

                <Separator className="bg-border/50" />

                {/* Query Settings */}
                <SettingsSection
                  title={t('graphPanel.sideBar.settings.querySection', 'Query')}
                  icon={Search}
                >
                  <LabeledNumberInput
                    label={t('graphPanel.sideBar.settings.maxQueryDepth')}
                    min={1}
                    value={graphQueryMaxDepth}
                    defaultValue={3}
                    onEditFinished={setGraphQueryMaxDepth}
                    icon={Layers}
                  />
                  <LabeledNumberInput
                    label={`${t('graphPanel.sideBar.settings.maxNodes')} (≤ ${backendMaxGraphNodes || 1000})`}
                    min={1}
                    max={backendMaxGraphNodes || 1000}
                    value={graphMaxNodes}
                    defaultValue={backendMaxGraphNodes || 1000}
                    onEditFinished={setGraphMaxNodes}
                    icon={GitBranch}
                  />
                  <LabeledNumberInput
                    label={t('graphPanel.sideBar.settings.maxLayoutIterations')}
                    min={1}
                    max={30}
                    value={graphLayoutMaxIterations}
                    defaultValue={15}
                    onEditFinished={setGraphLayoutMaxIterations}
                    icon={Activity}
                  />
                </SettingsSection>

                <Separator className="bg-border/50" />

                {/* System Settings */}
                <SettingsSection
                  title={t('graphPanel.sideBar.settings.systemSection', 'System')}
                  icon={Activity}
                >
                  <LabeledCheckBox
                    checked={enableHealthCheck}
                    onCheckedChange={setEnableHealthCheck}
                    label={t('graphPanel.sideBar.settings.healthCheck')}
                    icon={Activity}
                  />
                </SettingsSection>

                {/* Development/Testing Section - Only visible in development mode */}
                {import.meta.env.DEV && (
                  <>
                    <Separator className="bg-border/50" />
                    <SettingsSection title="Development" icon={Shuffle}>
                      <Button
                        onClick={handleGenerateRandomGraph}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs h-8 rounded-lg"
                      >
                        <Shuffle className="h-3.5 w-3.5" />
                        Generate Random Graph
                      </Button>
                    </SettingsSection>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 bg-muted/20 px-3 py-2.5 flex justify-end">
              <Button
                onClick={saveSettings}
                size="sm"
                className="h-7 px-4 text-xs rounded-lg"
              >
                {t('graphPanel.sideBar.settings.save')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
