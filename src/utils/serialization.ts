import type { DiagramSchema } from '../types/schema';

const SCHEMA_VERSION = '1.0.0';

/* ─── Export schema to JSON file download ─── */
export function exportSchemaJSON(schema: DiagramSchema) {
  const json = JSON.stringify(schema, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${schema.name.replace(/\s+/g, '-').toLowerCase()}.modata.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Import schema from JSON file ─── */
export function importSchemaJSON(): Promise<DiagramSchema> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.modata.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const schema = JSON.parse(text) as DiagramSchema;

        // Basic validation
        if (!schema.name || !schema.nodes || !schema.edges) {
          throw new Error('Invalid schema: missing required fields (name, nodes, edges)');
        }
        if (!Array.isArray(schema.nodes) || !Array.isArray(schema.edges)) {
          throw new Error('Invalid schema: nodes and edges must be arrays');
        }

        resolve(schema);
      } catch (err) {
        reject(err);
      }
    };

    input.click();
  });
}
