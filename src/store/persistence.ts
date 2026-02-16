import type { DiagramSchema } from '../types/schema';

const STORAGE_KEY = 'modata:diagrams';
const LAST_DIAGRAM_KEY = 'modata:lastDiagram';

export interface SavedDiagramMeta {
  name: string;
  updatedAt: string;
}

/* Get all saved diagram names/meta */
export function listSavedDiagrams(): SavedDiagramMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDiagramMeta[];
  } catch {
    return [];
  }
}

function updateMeta(meta: SavedDiagramMeta[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

/* Save a diagram */
export function saveDiagram(schema: DiagramSchema) {
  const key = `modata:diagram:${schema.name}`;
  localStorage.setItem(key, JSON.stringify(schema));
  localStorage.setItem(LAST_DIAGRAM_KEY, schema.name);

  const metas = listSavedDiagrams().filter((m) => m.name !== schema.name);
  metas.unshift({ name: schema.name, updatedAt: schema.updatedAt });
  updateMeta(metas);
}

/* Load a diagram by name */
export function loadDiagram(name: string): DiagramSchema | null {
  try {
    const raw = localStorage.getItem(`modata:diagram:${name}`);
    if (!raw) return null;
    return JSON.parse(raw) as DiagramSchema;
  } catch {
    return null;
  }
}

/* Load the last saved diagram */
export function loadLastDiagram(): DiagramSchema | null {
  const lastName = localStorage.getItem(LAST_DIAGRAM_KEY);
  if (!lastName) return null;
  return loadDiagram(lastName);
}

/* Delete a diagram */
export function deleteDiagram(name: string) {
  localStorage.removeItem(`modata:diagram:${name}`);
  const metas = listSavedDiagrams().filter((m) => m.name !== name);
  updateMeta(metas);

  const lastName = localStorage.getItem(LAST_DIAGRAM_KEY);
  if (lastName === name) {
    localStorage.removeItem(LAST_DIAGRAM_KEY);
  }
}
