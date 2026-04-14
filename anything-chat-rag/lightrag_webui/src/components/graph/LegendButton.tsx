import { useCallback } from 'react';
import { Palette } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settings';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LegendButtonProps {
  className?: string;
}
// FIXME  MC8yOmFIVnBZMlhvaklQb3RvVTZkbWh5UVE9PTpmOGY2YzU0Ng==

/**
 * Enterprise-grade legend toggle button with active state indication.
 */
const LegendButton: React.FC<LegendButtonProps> = ({ className }) => {
  const { t } = useTranslation();
  const showLegend = useSettingsStore.use.showLegend();
  const setShowLegend = useSettingsStore.use.setShowLegend();

  const toggleLegend = useCallback(() => {
    setShowLegend(!showLegend);
  }, [showLegend, setShowLegend]);

  return (
    <div
      className={cn(
        'flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5',
        showLegend && 'bg-primary/10 border-primary/30',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLegend}
        tooltip={t('graphPanel.sideBar.legendControl.toggleLegend')}
        side="top"
        className={cn(
          'h-7 w-7 rounded-md transition-all duration-150',
          'hover:scale-105 active:scale-95',
          showLegend
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Palette className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default LegendButton;
// eslint-disable  MS8yOmFIVnBZMlhvaklQb3RvVTZkbWh5UVE9PTpmOGY2YzU0Ng==
