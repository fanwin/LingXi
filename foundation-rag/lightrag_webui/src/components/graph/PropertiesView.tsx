import { useEffect, useState } from 'react';
import { useGraphStore, RawNodeType, RawEdgeType } from '@/stores/graph';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import useLightragGraph from '@/hooks/useLightragGraph';
import { useTranslation } from 'react-i18next';
import { GitBranchPlus, Scissors, X, Circle, Link2, Box } from 'lucide-react';
import EditablePropertyRow from './EditablePropertyRow';
import { cn } from '@/lib/utils';

/**
 * Enterprise-grade component that view properties of elements in graph.
 */
const PropertiesView = () => {
  const { getNode, getEdge } = useLightragGraph();
  const selectedNode = useGraphStore.use.selectedNode();
  const focusedNode = useGraphStore.use.focusedNode();
  const selectedEdge = useGraphStore.use.selectedEdge();
  const focusedEdge = useGraphStore.use.focusedEdge();
  const graphDataVersion = useGraphStore.use.graphDataVersion();

  const [currentElement, setCurrentElement] = useState<NodeType | EdgeType | null>(null);
  const [currentType, setCurrentType] = useState<'node' | 'edge' | null>(null);

  // This effect will run when selection changes or when graph data is updated
  useEffect(() => {
    let type: 'node' | 'edge' | null = null;
    let element: RawNodeType | RawEdgeType | null = null;
    if (focusedNode) {
      type = 'node';
      element = getNode(focusedNode);
    } else if (selectedNode) {
      type = 'node';
      element = getNode(selectedNode);
    } else if (focusedEdge) {
      type = 'edge';
      element = getEdge(focusedEdge, true);
    } else if (selectedEdge) {
      type = 'edge';
      element = getEdge(selectedEdge, true);
    }

    if (element) {
      if (type == 'node') {
        setCurrentElement(refineNodeProperties(element as any));
      } else {
        setCurrentElement(refineEdgeProperties(element as any));
      }
      setCurrentType(type);
    } else {
      setCurrentElement(null);
      setCurrentType(null);
    }
  }, [
    focusedNode,
    selectedNode,
    focusedEdge,
    selectedEdge,
    graphDataVersion,
    setCurrentElement,
    setCurrentType,
    getNode,
    getEdge
  ]);

  if (!currentElement) {
    return <></>;
  }

  return (
    <div
      className={cn(
        'w-72 overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-xl backdrop-blur-md',
        'transition-all duration-200 ease-out'
      )}
    >
      {currentType == 'node' ? (
        <NodePropertiesView node={currentElement as any} />
      ) : (
        <EdgePropertiesView edge={currentElement as any} />
      )}
    </div>
  );
};
// eslint-disable  MC80OmFIVnBZMlhvaklQb3RvVTZPVzl6ZWc9PTo1ZDVkZjg5Yg==

type NodeType = RawNodeType & {
  relationships: {
    type: string;
    id: string;
    label: string;
  }[];
};

type EdgeType = RawEdgeType & {
  sourceNode?: RawNodeType;
  targetNode?: RawNodeType;
};

const refineNodeProperties = (node: RawNodeType): NodeType => {
  const state = useGraphStore.getState();
  const relationships = [];

  if (state.sigmaGraph && state.rawGraph) {
    try {
      if (!state.sigmaGraph.hasNode(node.id)) {
        console.warn('Node not found in sigmaGraph:', node.id);
        return {
          ...node,
          relationships: []
        };
      }

      const edges = state.sigmaGraph.edges(node.id);

      for (const edgeId of edges) {
        if (!state.sigmaGraph.hasEdge(edgeId)) continue;

        const edge = state.rawGraph.getEdge(edgeId, true);
        if (edge) {
          const isTarget = node.id === edge.source;
          const neighbourId = isTarget ? edge.target : edge.source;

          if (!state.sigmaGraph.hasNode(neighbourId)) continue;

          const neighbour = state.rawGraph.getNode(neighbourId);
          if (neighbour) {
            relationships.push({
              type: 'Neighbour',
              id: neighbourId,
              label: neighbour.properties['entity_id']
                ? neighbour.properties['entity_id']
                : neighbour.labels.join(', ')
            });
          }
        }
      }
    } catch (error) {
      console.error('Error refining node properties:', error);
    }
  }

  return {
    ...node,
    relationships
  };
};
// FIXME  MS80OmFIVnBZMlhvaklQb3RvVTZPVzl6ZWc9PTo1ZDVkZjg5Yg==

const refineEdgeProperties = (edge: RawEdgeType): EdgeType => {
  const state = useGraphStore.getState();
  let sourceNode: RawNodeType | undefined = undefined;
  let targetNode: RawNodeType | undefined = undefined;

  if (state.sigmaGraph && state.rawGraph) {
    try {
      if (!state.sigmaGraph.hasEdge(edge.dynamicId)) {
        console.warn('Edge not found in sigmaGraph:', edge.id, 'dynamicId:', edge.dynamicId);
        return {
          ...edge,
          sourceNode: undefined,
          targetNode: undefined
        };
      }

      if (state.sigmaGraph.hasNode(edge.source)) {
        sourceNode = state.rawGraph.getNode(edge.source);
      }

      if (state.sigmaGraph.hasNode(edge.target)) {
        targetNode = state.rawGraph.getNode(edge.target);
      }
    } catch (error) {
      console.error('Error refining edge properties:', error);
    }
  }

  return {
    ...edge,
    sourceNode,
    targetNode
  };
};

const PropertyRow = ({
  name,
  value,
  onClick,
  tooltip,
  nodeId,
  edgeId,
  dynamicId,
  entityId,
  entityType,
  sourceId,
  targetId,
  isEditable = false,
  truncate
}: {
  name: string;
  value: any;
  onClick?: () => void;
  tooltip?: string;
  nodeId?: string;
  entityId?: string;
  edgeId?: string;
  dynamicId?: string;
  entityType?: 'node' | 'edge';
  sourceId?: string;
  targetId?: string;
  isEditable?: boolean;
  truncate?: string;
}) => {
  const { t } = useTranslation();

  const getPropertyNameTranslation = (name: string) => {
    const translationKey = `graphPanel.propertiesView.node.propertyNames.${name}`;
    const translation = t(translationKey);
    return translation === translationKey ? name : translation;
  };

  // Utility function to convert <SEP> to newlines
  const formatValueWithSeparators = (value: any): string => {
    if (typeof value === 'string') {
      return value.replace(/<SEP>/g, ';\n');
    }
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  };

  // Format the value to convert <SEP> to newlines
  const formattedValue = formatValueWithSeparators(value);
  let formattedTooltip = tooltip || formatValueWithSeparators(value);

  // If this is source_id field and truncate info exists, append it to the tooltip
  if (name === 'source_id' && truncate) {
    formattedTooltip += `\n(Truncated: ${truncate})`;
  }

  // Use EditablePropertyRow for editable fields (description, entity_id and entity_type)
  if (
    isEditable &&
    (name === 'description' || name === 'entity_id' || name === 'entity_type' || name === 'keywords')
  ) {
    return (
      <EditablePropertyRow
        name={name}
        value={value}
        onClick={onClick}
        nodeId={nodeId}
        entityId={entityId}
        edgeId={edgeId}
        dynamicId={dynamicId}
        entityType={entityType}
        sourceId={sourceId}
        targetId={targetId}
        isEditable={true}
        tooltip={tooltip || (typeof value === 'string' ? value : JSON.stringify(value, null, 2))}
      />
    );
  }

  // For non-editable fields, use the regular Text component
  return (
    <div className="group flex items-start gap-2 rounded-md py-1 transition-colors hover:bg-accent/30">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {getPropertyNameTranslation(name)}
        {name === 'source_id' && truncate && <sup className="ml-0.5 text-destructive">†</sup>}
      </span>
      <Text
        className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-xs transition-colors hover:bg-accent"
        tooltipClassName="max-w-xs"
        text={formattedValue}
        tooltip={formattedTooltip}
        side="left"
        onClick={onClick}
      />
    </div>
  );
};
// @ts-expect-error  Mi80OmFIVnBZMlhvaklQb3RvVTZPVzl6ZWc9PTo1ZDVkZjg5Yg==

const NodePropertiesView = ({ node }: { node: NodeType }) => {
  const { t } = useTranslation();

  const handleExpandNode = () => {
    useGraphStore.getState().triggerNodeExpand(node.id);
  };

  const handlePruneNode = () => {
    useGraphStore.getState().triggerNodePrune(node.id);
  };

  const handleClose = () => {
    useGraphStore.getState().clearSelection();
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-primary/5 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
            <Circle className="h-3 w-3 text-primary" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">
            {t('graphPanel.propertiesView.node.title')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
            onClick={handleExpandNode}
            tooltip={t('graphPanel.propertiesView.node.expandNode')}
            side="bottom"
          >
            <GitBranchPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
            onClick={handlePruneNode}
            tooltip={t('graphPanel.propertiesView.node.pruneNode')}
            side="bottom"
          >
            <Scissors className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
            onClick={handleClose}
            tooltip={t('common.cancel')}
            side="bottom"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto p-3">
        {/* Basic Info Section */}
        <div className="mb-3">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Box className="h-3 w-3" />
            {t('graphPanel.propertiesView.node.title')}
          </h4>
          <div className="rounded-lg bg-muted/30 p-2">
            <PropertyRow
              name={t('graphPanel.propertiesView.node.id')}
              value={String(node.id)}
            />
            <PropertyRow
              name={t('graphPanel.propertiesView.node.labels')}
              value={node.labels.join(', ')}
              onClick={() => {
                useGraphStore.getState().setSelectedNode(node.id, true);
              }}
            />
            <PropertyRow
              name={t('graphPanel.propertiesView.node.degree')}
              value={node.degree}
            />
          </div>
        </div>

        {/* Properties Section */}
        <div className="mb-3">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Box className="h-3 w-3" />
            {t('graphPanel.propertiesView.node.properties')}
          </h4>
          <div className="space-y-0.5 rounded-lg bg-muted/30 p-2">
            {Object.keys(node.properties)
              .sort()
              .map((name) => {
                if (name === 'created_at' || name === 'truncate') return null;
                return (
                  <PropertyRow
                    key={name}
                    name={name}
                    value={node.properties[name]}
                    nodeId={String(node.id)}
                    entityId={node.properties['entity_id']}
                    entityType="node"
                    isEditable={name === 'description' || name === 'entity_id' || name === 'entity_type'}
                    truncate={node.properties['truncate']}
                  />
                );
              })}
          </div>
        </div>

        {/* Relationships Section */}
        {node.relationships.length > 0 && (
          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {t('graphPanel.propertiesView.node.relationships')}
            </h4>
            <div className="space-y-0.5 rounded-lg bg-muted/30 p-2">
              {node.relationships.map(({ type, id, label }) => {
                return (
                  <PropertyRow
                    key={id}
                    name={type}
                    value={label}
                    onClick={() => {
                      useGraphStore.getState().setSelectedNode(id, true);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EdgePropertiesView = ({ edge }: { edge: EdgeType }) => {
  const { t } = useTranslation();

  const handleClose = () => {
    useGraphStore.getState().clearSelection();
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-violet/5 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet/10">
            <Link2 className="h-3 w-3 text-violet-600" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">
            {t('graphPanel.propertiesView.edge.title')}
          </h3>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
          onClick={handleClose}
          tooltip={t('common.cancel')}
          side="bottom"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto p-3">
        {/* Basic Info Section */}
        <div className="mb-3">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Box className="h-3 w-3" />
            {t('graphPanel.propertiesView.edge.title')}
          </h4>
          <div className="rounded-lg bg-muted/30 p-2">
            <PropertyRow name={t('graphPanel.propertiesView.edge.id')} value={edge.id} />
            {edge.type && (
              <PropertyRow name={t('graphPanel.propertiesView.edge.type')} value={edge.type} />
            )}
            <PropertyRow
              name={t('graphPanel.propertiesView.edge.source')}
              value={edge.sourceNode ? edge.sourceNode.labels.join(', ') : edge.source}
              onClick={() => {
                useGraphStore.getState().setSelectedNode(edge.source, true);
              }}
            />
            <PropertyRow
              name={t('graphPanel.propertiesView.edge.target')}
              value={edge.targetNode ? edge.targetNode.labels.join(', ') : edge.target}
              onClick={() => {
                useGraphStore.getState().setSelectedNode(edge.target, true);
              }}
            />
          </div>
        </div>

        {/* Properties Section */}
        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Box className="h-3 w-3" />
            {t('graphPanel.propertiesView.edge.properties')}
          </h4>
          <div className="space-y-0.5 rounded-lg bg-muted/30 p-2">
            {Object.keys(edge.properties)
              .sort()
              .map((name) => {
                if (name === 'created_at' || name === 'truncate') return null;
                return (
                  <PropertyRow
                    key={name}
                    name={name}
                    value={edge.properties[name]}
                    edgeId={String(edge.id)}
                    dynamicId={String(edge.dynamicId)}
                    entityType="edge"
                    sourceId={edge.sourceNode?.properties['entity_id'] || edge.source}
                    targetId={edge.targetNode?.properties['entity_id'] || edge.target}
                    isEditable={name === 'description' || name === 'keywords'}
                    truncate={edge.properties['truncate']}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
// NOTE  My80OmFIVnBZMlhvaklQb3RvVTZPVzl6ZWc9PTo1ZDVkZjg5Yg==

export default PropertiesView;
