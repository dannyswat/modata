import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react';

const PADDING = 40; // px padding around all nodes in the exported image

function getFlowElement(): HTMLElement {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  if (!el) throw new Error('React Flow viewport not found');
  return el;
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Compute image dimensions and viewport transform so that every node fits
 * inside the exported image with a small margin.
 */
function computeExportViewport(nodes: Node[], pixelRatio: number = 1) {
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

export async function exportPng(
  filename: string = 'modata-diagram.png',
  nodes: Node[] = [],
) {
  if (nodes.length === 0) throw new Error('No nodes to export');

  const el = getFlowElement();
  const pixelRatio = 2;
  const { imageWidth, imageHeight, viewport } = computeExportViewport(nodes, pixelRatio);

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
  download(dataUrl, filename);
}

export async function exportSvg(
  filename: string = 'modata-diagram.svg',
  nodes: Node[] = [],
) {
  if (nodes.length === 0) throw new Error('No nodes to export');

  const el = getFlowElement();
  const { imageWidth, imageHeight, viewport } = computeExportViewport(nodes);

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
  download(dataUrl, filename);
}
