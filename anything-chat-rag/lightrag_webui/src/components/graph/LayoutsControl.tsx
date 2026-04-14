import { useSigma } from '@react-sigma/core';
import { animateNodes } from 'sigma/utils';
import { useLayoutCirclepack } from '@react-sigma/layout-circlepack';
import { useLayoutCircular } from '@react-sigma/layout-circular';
import { LayoutHook, LayoutWorkerHook, WorkerLayoutControlProps } from '@react-sigma/layout-core';
import { useLayoutForce, useWorkerLayoutForce } from '@react-sigma/layout-force';
import { useLayoutForceAtlas2, useWorkerLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import { useLayoutNoverlap, useWorkerLayoutNoverlap } from '@react-sigma/layout-noverlap';
import { useLayoutRandom } from '@react-sigma/layout-random';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
// TODO  MC80OmFIVnBZMlhvaklQb3RvVTZjVkEwUlE9PToxMGJlZDZjNw==

import Button from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/Command';
import { useSettingsStore } from '@/stores/settings';

import {
  LayoutGrid,
  Play,
  Pause,
  Circle,
  Network,
  GitGraph,
  Sparkles,
  Shrink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type LayoutName =
  | 'circular'
  | 'circlepack'
  | 'random'
  | 'noverlap'
  | 'force'
  | 'forceatlas';
// @ts-expect-error  MS80OmFIVnBZMlhvaklQb3RvVTZjVkEwUlE9PToxMGJlZDZjNw==

interface LayoutOption {
  id: LayoutName;
  name: string;
  icon: React.ReactNode;
  description: string;
}

// Extend WorkerLayoutControlProps to include mainLayout
interface ExtendedWorkerLayoutControlProps extends WorkerLayoutControlProps {
  mainLayout: LayoutHook;
}

const WorkerLayoutControl = ({
  layout,
  autoRunFor,
  mainLayout
}: ExtendedWorkerLayoutControlProps) => {
  const sigma = useSigma();
  const [isRunning, setIsRunning] = useState(false);
  const animationTimerRef = useRef<number | null>(null);
  const { t } = useTranslation();

  const updatePositions = useCallback(() => {
    if (!sigma) return;

    try {
      const graph = sigma.getGraph();
      if (!graph || graph.order === 0) return;

      const positions = mainLayout.positions();
      animateNodes(graph, positions, { duration: 300 });
    } catch (error) {
      console.error('Error updating positions:', error);
      if (animationTimerRef.current) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
        setIsRunning(false);
      }
    }
  }, [sigma, mainLayout]);

  const handleClick = useCallback(() => {
    if (isRunning) {
      console.log('Stopping layout animation');
      if (animationTimerRef.current) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }

      try {
        if (typeof layout.kill === 'function') {
          layout.kill();
        } else if (typeof layout.stop === 'function') {
          layout.stop();
        }
      } catch (error) {
        console.error('Error stopping layout algorithm:', error);
      }

      setIsRunning(false);
    } else {
      console.log('Starting layout animation');
      updatePositions();

      animationTimerRef.current = window.setInterval(() => {
        updatePositions();
      }, 200);

      setIsRunning(true);

      setTimeout(() => {
        if (animationTimerRef.current) {
          console.log('Auto-stopping layout animation after 3 seconds');
          window.clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
          setIsRunning(false);

          try {
            if (typeof layout.kill === 'function') {
              layout.kill();
            } else if (typeof layout.stop === 'function') {
              layout.stop();
            }
          } catch (error) {
            console.error('Error stopping layout algorithm:', error);
          }
        }
      }, 3000);
    }
  }, [isRunning, layout, updatePositions]);

  useEffect(() => {
    if (!sigma) return;

    let timeout: number | null = null;
    if (autoRunFor !== undefined && autoRunFor > -1 && sigma.getGraph().order > 0) {
      console.log('Auto-starting layout animation');
      updatePositions();

      animationTimerRef.current = window.setInterval(() => {
        updatePositions();
      }, 200);

      setIsRunning(true);

      if (autoRunFor > 0) {
        timeout = window.setTimeout(() => {
          console.log('Auto-stopping layout animation after timeout');
          if (animationTimerRef.current) {
            window.clearInterval(animationTimerRef.current);
            animationTimerRef.current = null;
          }
          setIsRunning(false);
        }, autoRunFor);
      }
    }

    return () => {
      if (animationTimerRef.current) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      if (timeout) {
        window.clearTimeout(timeout);
      }
      setIsRunning(false);
    };
  }, [autoRunFor, sigma, updatePositions]);

  return (
    <Button
      size="icon"
      onClick={handleClick}
      tooltip={
        isRunning
          ? t('graphPanel.sideBar.layoutsControl.stopAnimation')
          : t('graphPanel.sideBar.layoutsControl.startAnimation')
      }
      side="top"
      className={cn(
        'h-7 w-7 rounded-md transition-all duration-150',
        'hover:scale-105 active:scale-95',
        isRunning
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse'
          : 'hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
    </Button>
  );
};
// FIXME  Mi80OmFIVnBZMlhvaklQb3RvVTZjVkEwUlE9PToxMGJlZDZjNw==

interface LayoutsControlProps {
  className?: string;
}

/**
 * Enterprise-grade layout control component for graph viewer.
 * Provides professional layout algorithm selection with intuitive visual feedback.
 */
const LayoutsControl: React.FC<LayoutsControlProps> = ({ className }) => {
  const sigma = useSigma();
  const { t } = useTranslation();
  const [layout, setLayout] = useState<LayoutName>('circular');
  const [opened, setOpened] = useState<boolean>(false);

  const maxIterations = useSettingsStore.use.graphLayoutMaxIterations();

  const layoutCircular = useLayoutCircular();
  const layoutCirclepack = useLayoutCirclepack();
  const layoutRandom = useLayoutRandom();
  const layoutNoverlap = useLayoutNoverlap({
    maxIterations: maxIterations,
    settings: {
      margin: 5,
      expansion: 1.1,
      gridSize: 1,
      ratio: 1,
      speed: 3
    }
  });
  const layoutForce = useLayoutForce({
    maxIterations: maxIterations,
    settings: {
      attraction: 0.0003,
      repulsion: 0.02,
      gravity: 0.02,
      inertia: 0.4,
      maxMove: 100
    }
  });
  const layoutForceAtlas2 = useLayoutForceAtlas2({ iterations: maxIterations });
  const workerNoverlap = useWorkerLayoutNoverlap();
  const workerForce = useWorkerLayoutForce();
  const workerForceAtlas2 = useWorkerLayoutForceAtlas2();

  const layouts = useMemo(() => {
    return {
      circular: {
        layout: layoutCircular,
        name: t('graphPanel.sideBar.layoutsControl.layouts.Circular', 'Circular')
      },
      circlepack: {
        layout: layoutCirclepack,
        name: t('graphPanel.sideBar.layoutsControl.layouts.Circlepack', 'Circle Pack')
      },
      random: {
        layout: layoutRandom,
        name: t('graphPanel.sideBar.layoutsControl.layouts.Random', 'Random')
      },
      noverlap: {
        layout: layoutNoverlap,
        worker: workerNoverlap,
        name: t('graphPanel.sideBar.layoutsControl.layouts.Noverlaps', 'No Overlaps')
      },
      force: {
        layout: layoutForce,
        worker: workerForce,
        name: t('graphPanel.sideBar.layoutsControl.layouts.Force Directed', 'Force Directed')
      },
      forceatlas: {
        layout: layoutForceAtlas2,
        worker: workerForceAtlas2,
        name: t('graphPanel.sideBar.layoutsControl.layouts.Force Atlas', 'Force Atlas')
      }
    } as { [key: string]: { layout: LayoutHook; worker?: LayoutWorkerHook; name: string } };
  }, [
    layoutCirclepack,
    layoutCircular,
    layoutForce,
    layoutForceAtlas2,
    layoutNoverlap,
    layoutRandom,
    workerForce,
    workerNoverlap,
    workerForceAtlas2,
    t
  ]);

  const layoutOptions: LayoutOption[] = [
    {
      id: 'circular',
      name: t('graphPanel.sideBar.layoutsControl.layouts.Circular', 'Circular'),
      icon: <Circle className="h-3.5 w-3.5" />,
      description: t('graphPanel.sideBar.layoutsControl.descriptions.circular', 'Arrange nodes in a circle')
    },
    {
      id: 'circlepack',
      name: t('graphPanel.sideBar.layoutsControl.layouts.Circlepack', 'Circle Pack'),
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
      description: t('graphPanel.sideBar.layoutsControl.descriptions.circlepack', 'Pack nodes in circles')
    },
    {
      id: 'force',
      name: t('graphPanel.sideBar.layoutsControl.layouts.Force Directed', 'Force Directed'),
      icon: <Network className="h-3.5 w-3.5" />,
      description: t('graphPanel.sideBar.layoutsControl.descriptions.force', 'Physics-based layout')
    },
    {
      id: 'forceatlas',
      name: t('graphPanel.sideBar.layoutsControl.layouts.Force Atlas', 'Force Atlas'),
      icon: <GitGraph className="h-3.5 w-3.5" />,
      description: t('graphPanel.sideBar.layoutsControl.descriptions.forceatlas', 'Advanced force layout')
    },
    {
      id: 'noverlap',
      name: t('graphPanel.sideBar.layoutsControl.layouts.Noverlaps', 'No Overlaps'),
      icon: <Shrink className="h-3.5 w-3.5" />,
      description: t('graphPanel.sideBar.layoutsControl.descriptions.noverlap', 'Prevent node overlap')
    },
    {
      id: 'random',
      name: t('graphPanel.sideBar.layoutsControl.layouts.Random', 'Random'),
      icon: <Sparkles className="h-3.5 w-3.5" />,
      description: t('graphPanel.sideBar.layoutsControl.descriptions.random', 'Random positioning')
    }
  ];

  const runLayout = useCallback(
    (newLayout: LayoutName) => {
      console.debug('Running layout:', newLayout);
      const { positions } = layouts[newLayout].layout;

      try {
        const graph = sigma.getGraph();
        if (!graph) {
          console.error('No graph available');
          return;
        }

        const pos = positions();
        console.log('Positions calculated, animating nodes');
        animateNodes(graph, pos, { duration: 400 });
        setLayout(newLayout);
      } catch (error) {
        console.error('Error running layout:', error);
      }
    },
    [layouts, sigma]
  );

  const currentLayout = layoutOptions.find((opt) => opt.id === layout);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Animation Control */}
      {layouts[layout] && 'worker' in layouts[layout] && (
        <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
          <WorkerLayoutControl
            layout={layouts[layout].worker!}
            mainLayout={layouts[layout].layout}
          />
        </div>
      )}

      {/* Layout Selector */}
      <Popover open={opened} onOpenChange={setOpened}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-2 rounded-lg border-border/50 bg-background px-2.5',
              'transition-all duration-150 hover:bg-accent hover:scale-[1.02] active:scale-[0.98]',
              'shadow-sm hover:shadow-md'
            )}
          >
            {currentLayout?.icon}
            <span className="text-xs font-medium">{currentLayout?.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={5}
          className="w-56 p-1.5"
        >
          <Command>
            <CommandList>
              <CommandGroup
                heading={t('graphPanel.sideBar.layoutsControl.selectLayout', 'Select Layout')}
              >
                {layoutOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      runLayout(option.id);
                      setOpened(false);
                    }}
                    className={cn(
                      'cursor-pointer gap-2 rounded-md px-2 py-1.5',
                      'transition-colors duration-150',
                      layout === option.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                        layout === option.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {option.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{option.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
// eslint-disable  My80OmFIVnBZMlhvaklQb3RvVTZjVkEwUlE9PToxMGJlZDZjNw==

export default LayoutsControl;
