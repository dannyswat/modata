/* ─── Primitive field types ─── */
export const PRIMITIVE_TYPES = [
  'int',
  'uuid',
  'decimal',
  'string',
  'boolean',
] as const;

export type PrimitiveType = (typeof PRIMITIVE_TYPES)[number];

/* ─── Sub-entity (embedded value object) ─── */
export interface SubEntityDef {
  kind: 'sub-entity';
  name: string;
  fields: FieldDef[];
}

/* ─── Field definition ─── */
export interface FieldDef {
  id: string; // unique within entity
  name: string;
  type: PrimitiveType | SubEntityDef;
  array?: boolean;
  description?: string;
}

/* ─── Relationship types ─── */
export const RELATION_TYPES = ['oneToOne', 'oneToMany', 'manyToMany'] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const RELATION_LABELS: Record<RelationType, string> = {
  oneToOne: '1 : 1',
  oneToMany: '1 : N',
  manyToMany: 'N : M',
};

/* ─── React Flow node data for entities ─── */
export interface EntityNodeData {
  [key: string]: unknown;
  name: string;
  fields: FieldDef[];
  color: string;
}

/* ─── React Flow edge data for relationships ─── */
export interface RelationEdgeData {
  [key: string]: unknown;
  relationType: RelationType;
  label?: string;
}

/* ─── Serializable diagram schema ─── */
export interface SerializedNode {
  id: string;
  position: { x: number; y: number };
  data: EntityNodeData;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data: RelationEdgeData;
}

export interface DiagramSchema {
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

/* ─── Entity header colors ─── */
export const ENTITY_COLORS = [
  '#4f6df5', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#6366f1', // indigo
] as const;

export function nextEntityColor(index: number): string {
  return ENTITY_COLORS[index % ENTITY_COLORS.length];
}
