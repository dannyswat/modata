import dagre from '@dagrejs/dagre';
import type { EntityNode, RelationEdge } from '../store/diagramStore';

const NODE_WIDTH = 280;
const BASE_NODE_HEIGHT = 90;
const FIELD_ROW_HEIGHT = 32;
const ADD_BUTTON_HEIGHT = 34;

function estimateNodeHeight(node: EntityNode): number {
  const fieldCount = (node.data?.fields?.length ?? 0);
  // Account for sub-entity expanded rows and enum options
  let extraRows = 0;
  for (const f of (node.data?.fields ?? [])) {
    if (typeof f.type !== 'string') {
      if (f.type.kind === 'sub-entity' && f.type.fields) {
        extraRows += f.type.fields.length + 1; // +1 for "+ sub-field" button
      } else if (f.type.kind === 'enum' && f.type.options) {
        extraRows += f.type.options.length + 1; // +1 for "+ option" input/button
      }
    }
  }
  return BASE_NODE_HEIGHT + (fieldCount + extraRows) * FIELD_ROW_HEIGHT + ADD_BUTTON_HEIGHT;
}

export type LayoutDirection = 'TB' | 'LR';

export function autoLayout(
  nodes: EntityNode[],
  edges: RelationEdge[],
  direction: LayoutDirection = 'TB',
): EntityNode[] {
  if (nodes.length === 0) return nodes;

  // Calculate the max node height for even spacing
  const heights = nodes.map(estimateNodeHeight);
  const maxHeight = Math.max(...heights);
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

  // Use generous spacing that scales with entity complexity
  const nodeSep = Math.max(80, NODE_WIDTH * 0.4);
  const rankSep = Math.max(100, avgHeight * 0.6);

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: 60,
    marginy: 60,
    align: 'UL',
  });

  nodes.forEach((node) => {
    const h = estimateNodeHeight(node);
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: h,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, { minlen: 2 });
  });

  // For disconnected nodes, add invisible edges to keep them in a grid
  const connectedNodes = new Set<string>();
  edges.forEach((e) => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });
  const disconnected = nodes.filter((n) => !connectedNodes.has(n.id));
  // Chain disconnected nodes together with weak edges to form a row
  for (let i = 1; i < disconnected.length; i++) {
    g.setEdge(disconnected[i - 1].id, disconnected[i].id, { minlen: 1, weight: 0 });
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const h = estimateNodeHeight(node);
    return {
      ...node,
      position: {
        x: Math.round(pos.x - NODE_WIDTH / 2),
        y: Math.round(pos.y - h / 2),
      },
    };
  });
}
