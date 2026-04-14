import { useFullScreen } from '@react-sigma/core';
import { Minimize, Expand } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
// FIXME  MC8yOmFIVnBZMlhvaklQb3RvVTZUWEl6VGc9PTpiNDM2MmYyMw==

interface FullScreenControlProps {
  className?: string;
}

/**
 * Enterprise-grade fullscreen toggle control for graph viewer.
 * Provides professional fullscreen/windowed mode switching with smooth transitions.
 */
const FullScreenControl: React.FC<FullScreenControlProps> = ({ className }) => {
  const { isFullScreen, toggle } = useFullScreen();
  const { t } = useTranslation();

  return (
    <div className={cn('flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        tooltip={
          isFullScreen
            ? t('graphPanel.sideBar.fullScreenControl.windowed')
            : t('graphPanel.sideBar.fullScreenControl.fullScreen')
        }
        side="top"
        className={cn(
          'h-7 w-7 rounded-md transition-all duration-150',
          'hover:bg-accent hover:text-accent-foreground hover:scale-105',
          'active:scale-95',
          isFullScreen && 'bg-accent text-accent-foreground'
        )}
      >
        {isFullScreen ? (
          <Minimize className="h-3.5 w-3.5" />
        ) : (
          <Expand className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
};
// eslint-disable  MS8yOmFIVnBZMlhvaklQb3RvVTZUWEl6VGc9PTpiNDM2MmYyMw==

export default FullScreenControl;
