import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';

const PADDING = 40; // px padding around all nodes in the exported image

function getFlowElement(): HTMLElement {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  if (!el) throw new Error('React Flow viewport not found');
  return el;
}

/** Download a Blob as a file via a temporary link */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Compute image dimensions and viewport transform so that every node fits
 * inside the exported image with a small margin.
 */
function computeExportViewport(nodes: Node[]) {
  const bounds = getNodesBounds(nodes);

  // Target image dimensions based on content + padding
  const imageWidth = bounds.width + PADDING * 2;
  const imageHeight = bounds.height + PADDING * 2;

  const viewport = getViewportForBounds(
    bounds,
    imageWidth,
    imageHeight,
    0.5,  // minZoom
    2,    // maxZoom
    PADDING / Math.max(imageWidth, imageHeight), // relative padding
  );

  return { imageWidth, imageHeight, viewport };
}

/** Generate a PNG Blob of the diagram */
export async function generatePngBlob(nodes: Node[]): Promise<Blob> {
  if (nodes.length === 0) throw new Error('No nodes to export');

  const el = getFlowElement();
  const pixelRatio = 2;
  const { imageWidth, imageHeight, viewport } = computeExportViewport(nodes);

  document.body.classList.add('exporting');

  try {
    const dataUrl = await toPng(el, {
      backgroundColor: '#ffffff',
      pixelRatio,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });
    return dataUrlToBlob(dataUrl);
  } finally {
    document.body.classList.remove('exporting');
  }
}

/** Generate an SVG Blob of the diagram */
export async function generateSvgBlob(nodes: Node[]): Promise<Blob> {
  if (nodes.length === 0) throw new Error('No nodes to export');

  const el = getFlowElement();
  const { imageWidth, imageHeight, viewport } = computeExportViewport(nodes);

  document.body.classList.add('exporting');

  try {
    const dataUrl = await toSvg(el, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });
    return dataUrlToBlob(dataUrl);
  } finally {
    document.body.classList.remove('exporting');
  }
}

/* ── Legacy convenience wrappers (download directly) ── */

export async function exportPng(
  filename: string = 'modata-diagram.png',
  nodes: Node[] = [],
) {
  const blob = await generatePngBlob(nodes);
  downloadBlob(blob, filename);
}

export async function exportSvg(
  filename: string = 'modata-diagram.svg',
  nodes: Node[] = [],
) {
  const blob = await generateSvgBlob(nodes);
  downloadBlob(blob, filename);
}
