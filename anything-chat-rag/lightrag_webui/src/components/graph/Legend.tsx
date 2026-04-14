import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from '@/stores/graph';
import { Card } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tag, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settings';
import { cn } from '@/lib/utils';
// TODO  MC80OmFIVnBZMlhvaklQb3RvVTZUVlZyU3c9PTozODkxODFjZA==

interface LegendProps {
  className?: string;
}

/**
 * Enterprise-grade legend component for graph viewer.
 * Displays node type color mapping with professional styling and interactions.
 */
const Legend: React.FC<LegendProps> = ({ className }) => {
  const { t } = useTranslation();
  const typeColorMap = useGraphStore.use.typeColorMap();
  const setShowLegend = useSettingsStore.use.setShowLegend();

  if (!typeColorMap || typeColorMap.size === 0) {
    return null;
  }

  // Get sorted entries for consistent display
  const sortedEntries = Array.from(typeColorMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <Card
      className={cn(
        'w-56 overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-md',
        'transition-all duration-200 ease-out',
        'hover:shadow-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Tag className="h-3 w-3 text-primary" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">
            {t('graphPanel.legend', 'Node Types')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLegend(false)}
          className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="max-h-72">
        <div className="flex flex-col gap-0.5 p-1.5">
          {sortedEntries.map(([type, color]) => (
            <LegendItem key={type} type={type} color={color} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer with count */}
      <div className="border-t border-border/50 bg-muted/20 px-3 py-1.5">
        <p className="text-[10px] text-muted-foreground">
          {t('graphPanel.legendCount', '{{count}} types', { count: sortedEntries.length })}
        </p>
      </div>
    </Card>
  );
};
// eslint-disable  MS80OmFIVnBZMlhvaklQb3RvVTZUVlZyU3c9PTozODkxODFjZA==

interface LegendItemProps {
  type: string;
  color: string;
}
// @ts-expect-error  Mi80OmFIVnBZMlhvaklQb3RvVTZUVlZyU3c9PTozODkxODFjZA==

/**
 * Individual legend item with color indicator and label.
 */
const LegendItem: React.FC<LegendItemProps> = ({ type, color }) => {
  const { t } = useTranslation();

  // Translate the type name using a key if available
  const displayType = t(
    `graphPanel.nodeTypes.${type.toLowerCase().replace(/\s+/g, '')}`,
    type
  );

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-2 py-1.5',
        'transition-colors duration-150',
        'hover:bg-accent/50'
      )}
      title={displayType}
    >
      {/* Color indicator */}
      <div
        className={cn(
          'h-3 w-3 shrink-0 rounded-full ring-1 ring-border/50',
          'transition-transform duration-150 group-hover:scale-110'
        )}
        style={{ backgroundColor: color }}
      />

      {/* Type label */}
      <span className="flex-1 truncate text-xs text-foreground">{displayType}</span>
    </div>
  );
};

export default Legend;
// NOTE  My80OmFIVnBZMlhvaklQb3RvVTZUVlZyU3c9PTozODkxODFjZA==
