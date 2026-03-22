import {
  RELATION_LABELS,
  type DiagramSchema,
  type FieldDef,
  type RelationEdgeData,
} from '../types/schema';

const SCHEMA_VERSION = '1.0.0';

function formatFieldType(type: FieldDef['type']): string {
  if (typeof type === 'string') {
    return type;
  }

  if (type.kind === 'enum') {
    return `enum(${type.options.join(', ')})`;
  }

  const nestedFields = type.fields.map((field) => `${field.name}: ${formatFieldType(field.type)}`);
  return `${type.name} { ${nestedFields.join('; ')} }`;
}

function formatField(field: FieldDef, indent = '  '): string[] {
  const typeLabel = formatFieldType(field.type);
  const arraySuffix = field.array ? '[]' : '';
  const descriptionSuffix = field.description ? ` - ${field.description}` : '';
  const lines = [`${indent}- ${field.name}: ${typeLabel}${arraySuffix}${descriptionSuffix}`];

  if (typeof field.type !== 'string' && field.type.kind === 'sub-entity' && field.type.fields.length > 0) {
    lines.push(`${indent}  fields:`);
    for (const nestedField of field.type.fields) {
      lines.push(...formatField(nestedField, `${indent}    `));
    }
  }

  return lines;
}

function formatRelationshipLabel(edgeData: RelationEdgeData | undefined): string {
  if (!edgeData) {
    return 'related';
  }

  const relation = RELATION_LABELS[edgeData.relationType] ?? edgeData.relationType;
  return edgeData.label ? `${relation} (${edgeData.label})` : relation;
}

export function serializeSchemaToPlainText(schema: DiagramSchema): string {
  const lines: string[] = [
    `Diagram: ${schema.name}`,
    '',
    'Entities',
  ];

  if (schema.nodes.length === 0) {
    lines.push('  (none)');
  } else {
    for (const node of schema.nodes) {
      lines.push(`- ${node.data.name}`);

      if (node.data.fields.length === 0) {
        lines.push('  fields: none');
      } else {
        lines.push('  fields:');
        for (const field of node.data.fields) {
          lines.push(...formatField(field));
        }
      }
    }
  }

  lines.push('', 'Relationships');

  if (schema.edges.length === 0) {
    lines.push('  (none)');
  } else {
    const entityNames = new Map(schema.nodes.map((node) => [node.id, node.data.name]));

    for (const edge of schema.edges) {
      const sourceName = entityNames.get(edge.source) ?? edge.source;
      const targetName = entityNames.get(edge.target) ?? edge.target;
      const relationText = formatRelationshipLabel(edge.data);
      const leftName = edge.data?.inverted ? targetName : sourceName;
      const rightName = edge.data?.inverted ? sourceName : targetName;
      lines.push(`- ${leftName} ${relationText} ${rightName}`);
    }
  }

  return lines.join('\n');
}

export async function copySchemaPlainTextToClipboard(schema: DiagramSchema): Promise<string> {
  const text = serializeSchemaToPlainText(schema);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return text;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand('copy');
    if (!copied) {
      throw new Error('Clipboard copy was blocked');
    }
  } finally {
    document.body.removeChild(textarea);
  }

  return text;
}

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
