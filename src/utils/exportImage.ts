import { toPng, toSvg } from 'html-to-image';

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

export async function exportPng(filename: string = 'modata-diagram.png') {
  const el = getFlowElement();
  const dataUrl = await toPng(el, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  });
  download(dataUrl, filename);
}

export async function exportSvg(filename: string = 'modata-diagram.svg') {
  const el = getFlowElement();
  const dataUrl = await toSvg(el, {
    backgroundColor: '#ffffff',
  });
  download(dataUrl, filename);
}
