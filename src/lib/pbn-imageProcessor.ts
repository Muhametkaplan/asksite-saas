// ============================================================
// Image Processing Pipeline (ported from oyun1)
// ============================================================

import { quantizeImage, rgbToHex } from './pbn-kmeans';
import { findRegions, detectEdges } from './pbn-floodFill';
import type { ProcessedImage, PbnDifficulty } from './pbn-types';

const DIFFICULTY_COLORS: Record<PbnDifficulty, number> = {
  easy: 8,
  medium: 16,
  hard: 24,
};

/**
 * Load an image URL/blob URL and draw it to an offscreen canvas.
 */
export async function loadImageToCanvas(
  src: string,
  maxSize = 600
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(120, Math.round(img.naturalWidth * scale));
      const height = Math.max(120, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ canvas, ctx, width, height });
    };
    img.onerror = () => reject(new Error('Görsel yüklenemedi'));
    img.src = src;
  });
}

/**
 * Full pipeline: image URL → ProcessedImage
 */
export async function processImage(
  src: string,
  difficulty: PbnDifficulty = 'medium',
  onProgress?: (pct: number) => void
): Promise<ProcessedImage> {
  onProgress?.(5);

  const { ctx, width, height } = await loadImageToCanvas(src, 700);
  onProgress?.(15);

  const imageData = ctx.getImageData(0, 0, width, height);
  const k = DIFFICULTY_COLORS[difficulty];

  onProgress?.(20);
  const { assignments, palette } = quantizeImage(imageData, k);
  onProgress?.(60);

  const { regionMap, regions } = findRegions(assignments, width, height, 30);
  onProgress?.(75);

  const edges = detectEdges(assignments, width, height);
  onProgress?.(85);

  // Build outline ImageData (white bg, dark lines)
  const outlineData = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const isEdge = edges[i] === 255;
    const idx4 = i * 4;
    outlineData.data[idx4] = isEdge ? 30 : 248;
    outlineData.data[idx4 + 1] = isEdge ? 30 : 248;
    outlineData.data[idx4 + 2] = isEdge ? 30 : 248;
    outlineData.data[idx4 + 3] = 255;
  }

  const colorMap = new Uint8Array(assignments.map((a) => a + 1));

  onProgress?.(100);

  return {
    width,
    height,
    palette,
    regions: regions.map((r, i) => ({
      id: i + 1,
      colorId: r.colorId,
      pixels: r.pixels,
      centerX: r.centerX,
      centerY: r.centerY,
      area: r.area,
    })),
    regionMap,
    colorMap,
    outlineData,
  };
}

export { rgbToHex };
