// Main library entry point for modata
export { default as ModataCanvas } from './components/Canvas';

// Export context / props type
export type { ModataCanvasProps } from './context/ModataContext';

// Export types
export type {
  EntityNodeData,
  FieldDef,
  PrimitiveType,
  SubEntityDef,
  EnumDef,
  RelationType,
  RelationEdgeData,
  DiagramSchema,
  SerializedNode,
  SerializedEdge,
} from './types/schema';

export {
  PRIMITIVE_TYPES,
  RELATION_TYPES,
  RELATION_LABELS,
  ENTITY_COLORS,
} from './types/schema';

// Export store
export { useDiagramStore } from './store/diagramStore';
export type { DiagramState, EntityNode, RelationEdge } from './store/diagramStore';

// Export utilities
export { autoLayout } from './utils/layout';
export type { LayoutDirection } from './utils/layout';
export { exportPng, exportSvg, generatePngBlob, generateSvgBlob, downloadBlob } from './utils/exportImage';
export { exportSchemaJSON, importSchemaJSON } from './utils/serialization';
export {
  saveDiagram,
  loadDiagram,
  loadLastDiagram,
  listSavedDiagrams,
  deleteDiagram,
} from './store/persistence';
export type { SavedDiagramMeta } from './store/persistence';
