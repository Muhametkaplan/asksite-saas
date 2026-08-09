// ============================================================
// K-Means Color Quantization (ported from oyun1)
// Uses seeded PRNG for deterministic results
// ============================================================

import type { RGBColor, PaletteColor } from './pbn-types';

// Mulberry32 seeded PRNG — deterministic for same seed
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function colorDistance(a: RGBColor, b: RGBColor): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function randomCentroids(pixels: RGBColor[], k: number, rand: () => number): RGBColor[] {
  const indices = new Set<number>();
  while (indices.size < k) {
    indices.add(Math.floor(rand() * pixels.length));
  }
  return Array.from(indices).map((i) => ({ ...pixels[i] }));
}

function assignClusters(pixels: RGBColor[], centroids: RGBColor[]): number[] {
  return pixels.map((pixel) => {
    let minDist = Infinity;
    let best = 0;
    for (let i = 0; i < centroids.length; i++) {
      const dist = colorDistance(pixel, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        best = i;
      }
    }
    return best;
  });
}

function updateCentroids(pixels: RGBColor[], assignments: number[], k: number): RGBColor[] {
  const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
  for (let i = 0; i < pixels.length; i++) {
    const c = assignments[i];
    sums[c].r += pixels[i].r;
    sums[c].g += pixels[i].g;
    sums[c].b += pixels[i].b;
    sums[c].count++;
  }
  return sums.map((s) =>
    s.count === 0
      ? { r: 128, g: 128, b: 128 }
      : {
          r: Math.round(s.r / s.count),
          g: Math.round(s.g / s.count),
          b: Math.round(s.b / s.count),
        }
  );
}

export function rgbToHex({ r, g, b }: RGBColor): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Run k-means quantization on an ImageData and return a palette.
 * Uses a fixed seed (42) for deterministic results.
 */
export function quantizeImage(
  imageData: ImageData,
  k: number,
  maxIterations = 20,
  seed = 42
): { assignments: number[]; palette: PaletteColor[] } {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const rand = mulberry32(seed);

  // Sample up to 5000 pixels for k-means computation
  const sampleRate = Math.max(1, Math.floor(totalPixels / 5000));
  const sampledPixels: RGBColor[] = [];

  for (let i = 0; i < totalPixels; i += sampleRate) {
    const idx = i * 4;
    if (data[idx + 3] < 128) continue;
    sampledPixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }

  let centroids = randomCentroids(sampledPixels, k, rand);

  for (let iter = 0; iter < maxIterations; iter++) {
    const assignments = assignClusters(sampledPixels, centroids);
    const newCentroids = updateCentroids(sampledPixels, assignments, k);

    let moved = false;
    for (let j = 0; j < k; j++) {
      if (colorDistance(centroids[j], newCentroids[j]) > 1) {
        moved = true;
        break;
      }
    }
    centroids = newCentroids;
    if (!moved) break;
  }

  // Assign every pixel to the nearest centroid
  const allPixels: RGBColor[] = [];
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    allPixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }
  const allAssignments = assignClusters(allPixels, centroids);

  const counts = new Array(k).fill(0);
  for (const a of allAssignments) counts[a]++;

  // Sort by frequency (most common color first)
  const sortedIndices = counts
    .map((count, i) => ({ i, count }))
    .sort((a, b) => b.count - a.count)
    .map((x) => x.i);

  const remapIndex = new Array(k);
  sortedIndices.forEach((origIdx, newIdx) => {
    remapIndex[origIdx] = newIdx;
  });

  const remappedAssignments = allAssignments.map((a) => remapIndex[a]);

  const palette: PaletteColor[] = sortedIndices.map((origIdx, newIdx) => ({
    id: newIdx + 1,
    color: centroids[origIdx],
    hex: rgbToHex(centroids[origIdx]),
    label: `${newIdx + 1}`,
    count: counts[origIdx],
  }));

  return { assignments: remappedAssignments, palette };
}
