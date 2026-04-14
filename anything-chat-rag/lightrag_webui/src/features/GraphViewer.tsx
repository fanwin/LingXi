import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { SigmaContainer, useRegisterEvents, useSigma } from '@react-sigma/core';
import { Settings as SigmaSettings } from 'sigma/settings';
import { GraphSearchOption, OptionItem } from '@react-sigma/graph-search';
import { EdgeArrowProgram, NodePointProgram, NodeCircleProgram } from 'sigma/rendering';
import { NodeBorderProgram } from '@sigma/node-border';
import { EdgeCurvedArrowProgram, createEdgeCurveProgram } from '@sigma/edge-curve';

import FocusOnNode from '@/components/graph/FocusOnNode';
import LayoutsControl from '@/components/graph/LayoutsControl';
import GraphControl from '@/components/graph/GraphControl';
import ZoomControl from '@/components/graph/ZoomControl';
import FullScreenControl from '@/components/graph/FullScreenControl';
import Settings from '@/components/graph/Settings';
import GraphSearch from '@/components/graph/GraphSearch';
import GraphLabels from '@/components/graph/GraphLabels';
import PropertiesView from '@/components/graph/PropertiesView';
import SettingsDisplay from '@/components/graph/SettingsDisplay';
import Legend from '@/components/graph/Legend';
import LegendButton from '@/components/graph/LegendButton';
// @ts-expect-error  MC80OmFIVnBZMlhvaklQb3RvVTZURTEwVGc9PToyMzdhNTE1Mw==

import { useSettingsStore } from '@/stores/settings';
import { useGraphStore } from '@/stores/graph';
import { labelColorDarkTheme, labelColorLightTheme } from '@/lib/constants';
import { cn } from '@/lib/utils';
// eslint-disable  MS80OmFIVnBZMlhvaklQb3RvVTZURTEwVGc9PToyMzdhNTE1Mw==

import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';

// Function to create sigma settings based on theme
const createSigmaSettings = (isDarkTheme: boolean): Partial<SigmaSettings> => ({
  allowInvalidContainer: true,
  defaultNodeType: 'default',
  defaultEdgeType: 'curvedNoArrow',
  renderEdgeLabels: false,
  edgeProgramClasses: {
    arrow: EdgeArrowProgram,
    curvedArrow: EdgeCurvedArrowProgram,
    curvedNoArrow: createEdgeCurveProgram()
  },
  nodeProgramClasses: {
    default: NodeBorderProgram,
    circel: NodeCircleProgram,
    point: NodePointProgram
  },
  labelGridCellSize: 60,
  labelRenderedSizeThreshold: 12,
  enableEdgeEvents: true,
  labelColor: {
    color: isDarkTheme ? labelColorDarkTheme : labelColorLightTheme,
    attribute: 'labelColor'
  },
  edgeLabelColor: {
    color: isDarkTheme ? labelColorDarkTheme : labelColorLightTheme,
    attribute: 'labelColor'
  },
  edgeLabelSize: 8,
  labelSize: 12
});

const GraphEvents = () => {
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  useEffect(() => {
    registerEvents({
      downNode: (e) => {
        setDraggedNode(e.node);
        sigma.getGraph().setNodeAttribute(e.node, 'highlighted', true);
      },
      mousemovebody: (e) => {
        if (!draggedNode) return;
        const pos = sigma.viewportToGraph(e);
        sigma.getGraph().setNodeAttribute(draggedNode, 'x', pos.x);
        sigma.getGraph().setNodeAttribute(draggedNode, 'y', pos.y);
        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
      },
      mouseup: () => {
        if (draggedNode) {
          setDraggedNode(null);
          sigma.getGraph().removeNodeAttribute(draggedNode, 'highlighted');
        }
      },
      mousedown: (e) => {
        const mouseEvent = e.original as MouseEvent;
        if (mouseEvent.buttons !== 0 && !sigma.getCustomBBox()) {
          sigma.setCustomBBox(sigma.getBBox());
        }
      }
    });
  }, [registerEvents, sigma, draggedNode]);

  return null;
};
// @ts-expect-error  Mi80OmFIVnBZMlhvaklQb3RvVTZURTEwVGc9PToyMzdhNTE1Mw==

const GraphViewer = () => {
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);
  const sigmaRef = useRef<any>(null);
  const prevTheme = useRef<string>('');

  const selectedNode = useGraphStore.use.selectedNode();
  const focusedNode = useGraphStore.use.focusedNode();
  const moveToSelectedNode = useGraphStore.use.moveToSelectedNode();
  const isFetching = useGraphStore.use.isFetching();

  const showPropertyPanel = useSettingsStore.use.showPropertyPanel();
  const showNodeSearchBar = useSettingsStore.use.showNodeSearchBar();
  const enableNodeDrag = useSettingsStore.use.enableNodeDrag();
  const showLegend = useSettingsStore.use.showLegend();
  const theme = useSettingsStore.use.theme();

  const memoizedSigmaSettings = useMemo(() => {
    const isDarkTheme = theme === 'dark';
    return createSigmaSettings(isDarkTheme);
  }, [theme]);

  useEffect(() => {
    const isThemeChange = prevTheme.current && prevTheme.current !== theme;
    if (isThemeChange) {
      setIsThemeSwitching(true);
      console.log('Theme switching detected:', prevTheme.current, '->', theme);

      const timer = setTimeout(() => {
        setIsThemeSwitching(false);
        console.log('Theme switching completed');
      }, 150);

      return () => clearTimeout(timer);
    }
    prevTheme.current = theme;
    console.log('Initialized sigma settings for theme:', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      const sigma = useGraphStore.getState().sigmaInstance;
      if (sigma) {
        try {
          sigma.kill();
          useGraphStore.getState().setSigmaInstance(null);
          console.log('Cleared sigma instance on Graphviewer unmount');
        } catch (error) {
          console.error('Error cleaning up sigma instance:', error);
        }
      }
    };
  }, []);

  const onSearchFocus = useCallback((value: GraphSearchOption | null) => {
    if (value === null) useGraphStore.getState().setFocusedNode(null);
    else if (value.type === 'nodes') useGraphStore.getState().setFocusedNode(value.id);
  }, []);

  const onSearchSelect = useCallback((value: GraphSearchOption | null) => {
    if (value === null) {
      useGraphStore.getState().setSelectedNode(null);
    } else if (value.type === 'nodes') {
      useGraphStore.getState().setSelectedNode(value.id, true);
    }
  }, []);

  const autoFocusedNode = useMemo(() => focusedNode ?? selectedNode, [focusedNode, selectedNode]);
  const searchInitSelectedNode = useMemo(
    (): OptionItem | null => (selectedNode ? { type: 'nodes', id: selectedNode } : null),
    [selectedNode]
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SigmaContainer
        settings={memoizedSigmaSettings}
        className="!bg-background !size-full overflow-hidden"
        ref={sigmaRef}
      >
        <GraphControl />

        {enableNodeDrag && <GraphEvents />}

        <FocusOnNode node={autoFocusedNode} move={moveToSelectedNode} />

        {/* Top Controls - Graph Labels and Search */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <GraphLabels />
          </div>
          {showNodeSearchBar && !isThemeSwitching && (
            <div className="pointer-events-auto">
              <GraphSearch
                value={searchInitSelectedNode}
                onFocus={onSearchFocus}
                onChange={onSearchSelect}
              />
            </div>
          )}
        </div>

        {/* Bottom Control Panel - Enterprise-grade layout */}
        <div className="absolute bottom-4 left-3 flex items-end gap-3">
          {/* Main Control Panel */}
          <div
            className={cn(
              'flex flex-col gap-2 rounded-xl border border-border/60 bg-background/95 p-2 shadow-lg backdrop-blur-md',
              'transition-all duration-200 ease-out hover:shadow-xl'
            )}
          >
            {/* View Controls Group */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/30 p-0.5">
              <ZoomControl />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Layout Controls Group */}
            <div className="flex items-center gap-1">
              <LayoutsControl />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Utility Controls Group */}
            <div className="flex items-center gap-1">
              <LegendButton />
              <FullScreenControl />
              <Settings />
            </div>
          </div>
        </div>

        {/* Property Panel */}
        {showPropertyPanel && (
          <div className="absolute top-16 right-3 z-10">
            <PropertiesView />
          </div>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-4 right-3 z-0">
            <Legend />
          </div>
        )}

        <SettingsDisplay />
      </SigmaContainer>

      {/* Loading overlay */}
      {(isFetching || isThemeSwitching) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-background/95 p-6 shadow-2xl">
            <div className="relative">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full border-3 border-primary/10" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isThemeSwitching ? 'Switching Theme...' : 'Loading Graph Data...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
// FIXME  My80OmFIVnBZMlhvaklQb3RvVTZURTEwVGc9PToyMzdhNTE1Mw==

export default GraphViewer;
