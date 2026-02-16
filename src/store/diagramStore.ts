import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import {
  type EntityNodeData,
  type RelationEdgeData,
  type FieldDef,
  type RelationType,
  type DiagramSchema,
  nextEntityColor,
} from '../types/schema';

/* ─── Custom node / edge type aliases ─── */
export type EntityNode = Node<EntityNodeData, 'entity'>;
export type RelationEdge = Edge<RelationEdgeData>;

/* ─── Store shape ─── */
export interface DiagramState {
  /* data */
  diagramName: string;
  nodes: EntityNode[];
  edges: RelationEdge[];
  entityCount: number;

  /* selection tracking */
  pendingConnection: Connection | null;

  /* node/edge change handlers (for React Flow) */
  onNodesChange: OnNodesChange<EntityNode>;
  onEdgesChange: OnEdgesChange<RelationEdge>;

  /* entity actions */
  addEntity: (position?: { x: number; y: number }) => string;
  updateEntityName: (nodeId: string, name: string) => void;
  updateEntityColor: (nodeId: string, color: string) => void;
  removeEntity: (nodeId: string) => void;

  /* field actions */
  addField: (nodeId: string) => void;
  updateField: (nodeId: string, fieldId: string, patch: Partial<FieldDef>) => void;
  removeField: (nodeId: string, fieldId: string) => void;
  reorderFields: (nodeId: string, fromIndex: number, toIndex: number) => void;

  /* sub-entity actions */
  addSubEntityField: (nodeId: string, fieldId: string) => void;
  updateSubEntityField: (
    nodeId: string,
    parentFieldId: string,
    subFieldId: string,
    patch: Partial<FieldDef>,
  ) => void;
  removeSubEntityField: (nodeId: string, parentFieldId: string, subFieldId: string) => void;

  /* relationship actions */
  setPendingConnection: (connection: Connection | null) => void;
  addRelation: (connection: Connection, relationType: RelationType) => void;
  updateRelationType: (edgeId: string, relationType: RelationType) => void;
  removeRelation: (edgeId: string) => void;

  /* diagram actions */
  setDiagramName: (name: string) => void;
  loadDiagram: (schema: DiagramSchema) => void;
  clearDiagram: () => void;
  setNodes: (nodes: EntityNode[]) => void;
  setEdges: (edges: RelationEdge[]) => void;

  /* serialization */
  toDiagramSchema: () => DiagramSchema;
}

/* helper: update a specific node's data */
function updateNodeData(
  nodes: EntityNode[],
  nodeId: string,
  updater: (data: EntityNodeData) => EntityNodeData,
): EntityNode[] {
  return nodes.map((n) =>
    n.id === nodeId ? { ...n, data: updater(n.data as EntityNodeData) } : n,
  );
}

export const useDiagramStore = create<DiagramState>()(
  subscribeWithSelector((set, get) => ({
    diagramName: 'Untitled Diagram',
    nodes: [],
    edges: [],
    entityCount: 0,
    pendingConnection: null,

    /* ── React Flow change handlers ── */
    onNodesChange: (changes) =>
      set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

    onEdgesChange: (changes) =>
      set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

    /* ── Entity CRUD ── */
    addEntity: (position) => {
      const id = uuidv4();
      const count = get().entityCount + 1;
      const node: EntityNode = {
        id,
        type: 'entity',
        position: position ?? { x: 100 + count * 40, y: 100 + count * 40 },
        data: {
          name: `Entity${count}`,
          fields: [
            { id: uuidv4(), name: 'id', type: 'uuid' },
          ],
          color: nextEntityColor(count - 1),
        },
      };
      set((s) => ({ nodes: [...s.nodes, node], entityCount: count }));
      return id;
    },

    updateEntityName: (nodeId, name) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({ ...d, name })),
      })),

    updateEntityColor: (nodeId, color) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({ ...d, color })),
      })),

    removeEntity: (nodeId) =>
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== nodeId),
        edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      })),

    /* ── Field CRUD ── */
    addField: (nodeId) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({
          ...d,
          fields: [
            ...d.fields,
            { id: uuidv4(), name: 'newField', type: 'string' },
          ],
        })),
      })),

    updateField: (nodeId, fieldId, patch) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({
          ...d,
          fields: d.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
        })),
      })),

    removeField: (nodeId, fieldId) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({
          ...d,
          fields: d.fields.filter((f) => f.id !== fieldId),
        })),
      })),

    reorderFields: (nodeId, fromIndex, toIndex) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => {
          const fields = [...d.fields];
          const [moved] = fields.splice(fromIndex, 1);
          fields.splice(toIndex, 0, moved);
          return { ...d, fields };
        }),
      })),

    /* ── Sub-entity field CRUD ── */
    addSubEntityField: (nodeId, fieldId) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({
          ...d,
          fields: d.fields.map((f) => {
            if (f.id !== fieldId || typeof f.type === 'string') return f;
            return {
              ...f,
              type: {
                ...f.type,
                fields: [
                  ...f.type.fields,
                  { id: uuidv4(), name: 'subField', type: 'string' as const },
                ],
              },
            };
          }),
        })),
      })),

    updateSubEntityField: (nodeId, parentFieldId, subFieldId, patch) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({
          ...d,
          fields: d.fields.map((f) => {
            if (f.id !== parentFieldId || typeof f.type === 'string') return f;
            return {
              ...f,
              type: {
                ...f.type,
                fields: f.type.fields.map((sf) =>
                  sf.id === subFieldId ? { ...sf, ...patch } : sf,
                ),
              },
            };
          }),
        })),
      })),

    removeSubEntityField: (nodeId, parentFieldId, subFieldId) =>
      set((s) => ({
        nodes: updateNodeData(s.nodes, nodeId, (d) => ({
          ...d,
          fields: d.fields.map((f) => {
            if (f.id !== parentFieldId || typeof f.type === 'string') return f;
            return {
              ...f,
              type: {
                ...f.type,
                fields: f.type.fields.filter((sf) => sf.id !== subFieldId),
              },
            };
          }),
        })),
      })),

    /* ── Relationship CRUD ── */
    setPendingConnection: (connection) => set({ pendingConnection: connection }),

    addRelation: (connection, relationType) => {
      const edge: RelationEdge = {
        id: uuidv4(),
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'relationship',
        data: { relationType },
      };
      set((s) => ({ edges: [...s.edges, edge], pendingConnection: null }));
    },

    updateRelationType: (edgeId, relationType) =>
      set((s) => ({
        edges: s.edges.map((e) =>
          e.id === edgeId
            ? { ...e, data: { ...e.data!, relationType } }
            : e,
        ),
      })),

    removeRelation: (edgeId) =>
      set((s) => ({ edges: s.edges.filter((e) => e.id !== edgeId) })),

    /* ── Diagram actions ── */
    setDiagramName: (name) => set({ diagramName: name }),

    loadDiagram: (schema) =>
      set({
        diagramName: schema.name,
        nodes: schema.nodes.map((n) => ({
          ...n,
          type: 'entity' as const,
        })),
        edges: schema.edges.map((e) => ({
          ...e,
          type: 'relationship' as const,
        })),
        entityCount: schema.nodes.length,
      }),

    clearDiagram: () =>
      set({
        diagramName: 'Untitled Diagram',
        nodes: [],
        edges: [],
        entityCount: 0,
      }),

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    /* ── Serialization ── */
    toDiagramSchema: () => {
      const s = get();
      return {
        name: s.diagramName,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: s.nodes.map((n) => ({
          id: n.id,
          position: n.position,
          data: n.data as EntityNodeData,
        })),
        edges: s.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          data: e.data as RelationEdgeData,
        })),
      };
    },
  })),
);
