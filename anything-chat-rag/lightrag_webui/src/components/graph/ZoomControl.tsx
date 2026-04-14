import { useCamera, useSigma } from '@react-sigma/core';
import { useCallback } from 'react';
import Button from '@/components/ui/Button';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCw,
  RotateCcw,
  Focus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
// FIXME  MC80OmFIVnBZMlhvaklQb3RvVTZaMmhJZEE9PTpkYTExNDQ0ZA==

interface ZoomControlProps {
  className?: string;
}
// TODO  MS80OmFIVnBZMlhvaklQb3RvVTZaMmhJZEE9PTpkYTExNDQ0ZA==

/**
 * Enterprise-grade zoom control component for graph viewer.
 * Provides intuitive zoom, reset, and rotation controls with professional styling.
 */
const ZoomControl: React.FC<ZoomControlProps> = ({ className }) => {
  const { zoomIn, zoomOut, reset } = useCamera({ duration: 200, factor: 1.5 });
  const sigma = useSigma();
  const { t } = useTranslation();

  const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);

  const handleResetZoom = useCallback(() => {
    if (!sigma) return;

    try {
      sigma.setCustomBBox(null);
      sigma.refresh();

      const graph = sigma.getGraph();

      if (!graph?.order || graph.nodes().length === 0) {
        reset();
        return;
      }

      sigma.getCamera().animate({ x: 0.5, y: 0.5, ratio: 1.1 }, { duration: 1000 });
    } catch (error) {
      console.error('Error resetting zoom:', error);
      reset();
    }
  }, [sigma, reset]);

  const handleRotateClockwise = useCallback(() => {
    if (!sigma) return;
    const camera = sigma.getCamera();
    camera.animate({ angle: camera.angle + Math.PI / 8 }, { duration: 200 });
  }, [sigma]);

  const handleRotateCounterClockwise = useCallback(() => {
    if (!sigma) return;
    const camera = sigma.getCamera();
    camera.animate({ angle: camera.angle - Math.PI / 8 }, { duration: 200 });
  }, [sigma]);

  const handleFocusAll = useCallback(() => {
    if (!sigma) return;
    const camera = sigma.getCamera();
    camera.animate({ x: 0.5, y: 0.5, ratio: 1, angle: 0 }, { duration: 500 });
  }, [sigma]);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Zoom Controls */}
      <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
        <ControlButton
          onClick={handleZoomOut}
          tooltip={t('graphPanel.sideBar.zoomControl.zoomOut')}
          aria-label={t('graphPanel.sideBar.zoomControl.zoomOut')}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </ControlButton>
        <div className="h-4 w-px bg-border/60" />
        <ControlButton
          onClick={handleResetZoom}
          tooltip={t('graphPanel.sideBar.zoomControl.resetZoom')}
          aria-label={t('graphPanel.sideBar.zoomControl.resetZoom')}
        >
          <Maximize className="h-3.5 w-3.5" />
        </ControlButton>
        <div className="h-4 w-px bg-border/60" />
        <ControlButton
          onClick={handleZoomIn}
          tooltip={t('graphPanel.sideBar.zoomControl.zoomIn')}
          aria-label={t('graphPanel.sideBar.zoomControl.zoomIn')}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </ControlButton>
      </div>

      {/* Rotation Controls */}
      <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
        <ControlButton
          onClick={handleRotateCounterClockwise}
          tooltip={t('graphPanel.sideBar.zoomControl.rotateCameraCounterClockwise')}
          aria-label={t('graphPanel.sideBar.zoomControl.rotateCameraCounterClockwise')}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </ControlButton>
        <div className="h-4 w-px bg-border/60" />
        <ControlButton
          onClick={handleRotateClockwise}
          tooltip={t('graphPanel.sideBar.zoomControl.rotateCamera')}
          aria-label={t('graphPanel.sideBar.zoomControl.rotateCamera')}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </ControlButton>
        <div className="h-4 w-px bg-border/60" />
        <ControlButton
          onClick={handleFocusAll}
          tooltip={t('graphPanel.sideBar.zoomControl.focusAll', 'Focus All')}
          aria-label={t('graphPanel.sideBar.zoomControl.focusAll', 'Focus All')}
        >
          <Focus className="h-3.5 w-3.5" />
        </ControlButton>
      </div>
    </div>
  );
};

/**
 * Individual control button with consistent enterprise styling.
 */
interface ControlButtonProps {
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
  'aria-label': string;
  active?: boolean;
}
// NOTE  Mi80OmFIVnBZMlhvaklQb3RvVTZaMmhJZEE9PTpkYTExNDQ0ZA==

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  tooltip,
  children,
  active = false
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      tooltip={tooltip}
      side="top"
      className={cn(
        'h-7 w-7 rounded-md transition-all duration-150',
        'hover:bg-accent hover:text-accent-foreground hover:scale-105',
        'active:scale-95',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </Button>
  );
};

export default ZoomControl;
// TODO  My80OmFIVnBZMlhvaklQb3RvVTZaMmhJZEE9PTpkYTExNDQ0ZA==
