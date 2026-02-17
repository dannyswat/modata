import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { useDiagramStore } from '../store/diagramStore';
import { RELATION_LABELS, RELATION_TYPES, type RelationEdgeData, type RelationType } from '../types/schema';
import './RelationshipEdge.css';

const RelationshipEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}) => {
  const edgeData = data as RelationEdgeData | undefined;
  const relationType = edgeData?.relationType ?? 'oneToMany';
  const inverted = edgeData?.inverted ?? false;
  const updateRelationType = useDiagramStore((s) => s.updateRelationType);
  const toggleRelationDirection = useDiagramStore((s) => s.toggleRelationDirection);
  const removeRelation = useDiagramStore((s) => s.removeRelation);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const label = RELATION_LABELS[relationType];

  /* Cardinality symbols at endpoints */
  let sourceSymbol = '1';
  let targetSymbol = '1';
  
  if (relationType === 'oneToOne') {
    sourceSymbol = '1';
    targetSymbol = '1';
  } else if (relationType === 'oneToMany') {
    // Normal: source = 1, target = N
    // Inverted: source = N, target = 1
    sourceSymbol = inverted ? 'N' : '1';
    targetSymbol = inverted ? '1' : 'N';
  } else if (relationType === 'manyToMany') {
    sourceSymbol = 'N';
    targetSymbol = 'M';
  }

  const cycleType = () => {
    const idx = RELATION_TYPES.indexOf(relationType);
    const next = RELATION_TYPES[(idx + 1) % RELATION_TYPES.length];
    updateRelationType(id, next);
  };

  const swapDirection = () => {
    toggleRelationDirection(id);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`relationship-edge ${selected ? 'relationship-edge--selected' : ''}`}
        style={{
          stroke: selected ? '#4f6df5' : '#94a3b8',
          strokeWidth: selected ? 2.5 : 2,
        }}
      />
      <EdgeLabelRenderer>
        {/* Center label */}
        <div
          className={`relationship-edge__label ${selected ? 'relationship-edge__label--selected' : ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onClick={cycleType}
          title="Click to change relationship type"
        >
          {label}
        </div>

        {/* Source cardinality */}
        <div
          className="relationship-edge__cardinality"
          style={{
            transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY - 16}px)`,
          }}
        >
          {sourceSymbol}
        </div>

        {/* Target cardinality */}
        <div
          className="relationship-edge__cardinality"
          style={{
            transform: `translate(-50%, -50%) translate(${targetX}px,${targetY - 16}px)`,
          }}
        >
          {targetSymbol}
        </div>

        {/* Delete button when selected */}
        {selected && (
          <>
            <div
              className="relationship-edge__delete"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 22}px)`,
              }}
              onClick={() => removeRelation(id)}
              title="Delete relationship"
            >
              ×
            </div>
            {/* Swap direction button for oneToMany */}
            {relationType === 'oneToMany' && (
              <div
                className="relationship-edge__swap"
                style={{
                  transform: `translate(-50%, -50%) translate(${labelX + 30}px,${labelY + 22}px)`,
                }}
                onClick={swapDirection}
                title="Swap direction (1:N ↔ N:1)"
              >
                ⇄
              </div>
            )}
          </>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(RelationshipEdge);
