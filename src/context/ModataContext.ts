import { createContext, useContext } from 'react';
import type { DiagramSchema } from '../types/schema';

/* ─── Props for the ModataCanvas component ─── */
export interface ModataCanvasProps {
  /**
   * Initial data to load into the diagram.
   * If provided, this will be loaded on mount instead of localStorage.
   */
  data?: DiagramSchema;

  /**
   * Called on any diagram change (nodes, edges, name) with the full schema.
   * Use this to sync diagram state to a server or parent component.
   * Debounced internally (800ms).
   */
  onChange?: (schema: DiagramSchema) => void;

  /**
   * Called when the user clicks the Save button.
   * Receives the current diagram schema.
   * If not provided, save only persists to localStorage (if enabled).
   */
  onSave?: (schema: DiagramSchema) => void;

  /**
   * Custom handler for PNG export.
   * Receives a Blob of the generated PNG image and the filename.
   * If not provided, the image is downloaded directly.
   */
  onExportImage?: (blob: Blob, filename: string) => void;

  /**
   * Custom handler for SVG export.
   * Receives a Blob of the generated SVG and the filename.
   * If not provided, the SVG is downloaded directly.
   */
  onExportSvg?: (blob: Blob, filename: string) => void;

  /**
   * Custom handler for JSON export.
   * Receives the DiagramSchema object and the filename.
   * If not provided, the JSON is downloaded directly.
   */
  onExportJSON?: (schema: DiagramSchema, filename: string) => void;

  /**
   * Custom handler for JSON import.
   * If provided, called instead of opening a file picker.
   * Should return a Promise resolving to a DiagramSchema.
   */
  onImport?: () => Promise<DiagramSchema>;

  /**
   * Whether to persist diagrams in localStorage.
   * @default true
   */
  persistInLocalStorage?: boolean;

  /**
   * Whether the diagram is read-only (no editing allowed).
   * @default false
   */
  readOnly?: boolean;
}

/* ─── Context for passing props through component tree ─── */
const ModataContext = createContext<ModataCanvasProps>({});

export const ModataProvider = ModataContext.Provider;

export function useModataProps(): ModataCanvasProps {
  return useContext(ModataContext);
}
