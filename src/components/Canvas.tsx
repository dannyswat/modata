import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import EntityNodeComponent from './EntityNode';
import RelationshipEdge from './RelationshipEdge';
import RelationshipPicker from './RelationshipPicker';
import Sidebar from './Sidebar';
import { useDiagramStore, type EntityNode, type RelationEdge } from '../store/diagramStore';
import type { RelationType } from '../types/schema';

const nodeTypes = { entity: EntityNodeComponent };
const edgeTypes = { relationship: RelationshipEdge };

const defaultEdgeOptions = {
  type: 'relationship',
};

const CanvasInner: React.FC = () => {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const onNodesChange = useDiagramStore((s) => s.onNodesChange);
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange);
  const addEntity = useDiagramStore((s) => s.addEntity);
  const addRelation = useDiagramStore((s) => s.addRelation);

  const [pickerState, setPickerState] = useState<{
    connection: Connection;
    position: { x: number; y: number };
  } | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  /* When user finishes connecting two handles, show the relationship picker */
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      // Don't allow self-connections
      if (connection.source === connection.target) return;

      // Position the picker near the center of the viewport
      const wrapper = reactFlowWrapper.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        setPickerState({
          connection,
          position: {
            x: rect.left + rect.width / 2 - 120,
            y: rect.top + rect.height / 2 - 80,
          },
        });
      } else {
        // fallback: just add as oneToMany
        addRelation(connection, 'oneToMany');
      }
    },
    [addRelation],
  );

  const handlePickRelation = useCallback(
    (type: RelationType) => {
      if (pickerState) {
        addRelation(pickerState.connection, type);
      }
      setPickerState(null);
    },
    [pickerState, addRelation],
  );

  /* Double-click on pane (empty space) → add entity */
  const lastClickTime = useRef<number>(0);
  const lastClickPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      const timeDiff = now - lastClickTime.current;
      const pos = { x: event.clientX, y: event.clientY };
      const posDiff = Math.abs(pos.x - lastClickPos.current.x) + Math.abs(pos.y - lastClickPos.current.y);
      
      // Detect double-click: within 300ms and close position (< 5px movement)
      if (timeDiff < 300 && posDiff < 5) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        addEntity(position);
        lastClickTime.current = 0; // Reset to avoid triple-click
      } else {
        lastClickTime.current = now;
        lastClickPos.current = pos;
      }
    },
    [addEntity, screenToFlowPosition],
  );

  return (
    <div className="canvas" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        noDragClassName="entity-node__field-drag"
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d0d0d0" />
      </ReactFlow>

      {pickerState && (
        <RelationshipPicker
          position={pickerState.position}
          onSelect={handlePickRelation}
          onCancel={() => setPickerState(null)}
        />
      )}
    </div>
  );
};

const Canvas: React.FC = () => (
  <ReactFlowProvider>
    <Sidebar />
    <CanvasInner />
  </ReactFlowProvider>
);

export default Canvas;
