// ============================================================
// Flood Fill & Region Detection (ported from oyun1)
// ============================================================

/**
 * Stack-based flood fill on a Uint8/Uint16 array.
 */
export function floodFill(
  data: Uint8Array | Uint16Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  newValue: number
): number[] {
  const startIdx = startY * width + startX;
  const targetValue = data[startIdx];

  if (targetValue === newValue) return [];

  const filled: number[] = [];
  const stack: number[] = [startIdx];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (idx < 0 || idx >= width * height) continue;
    if (visited[idx]) continue;
    if (data[idx] !== targetValue) continue;

    visited[idx] = 1;
    filled.push(idx);

    const x = idx % width;
    const y = Math.floor(idx / width);

    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  for (const idx of filled) {
    data[idx] = newValue;
  }

  return filled;
}

/**
 * Find all connected regions (connected components) in a color assignment map.
 * Returns: regionMap (per-pixel region id), regionList
 */
export function findRegions(
  assignments: number[],
  width: number,
  height: number,
  minArea = 30
): {
  regionMap: Uint16Array;
  regions: Array<{ colorId: number; pixels: number[]; centerX: number; centerY: number; area: number }>;
} {
  const regionMap = new Uint16Array(width * height);
  const visited = new Uint8Array(width * height);
  const regions: Array<{
    colorId: number;
    pixels: number[];
    centerX: number;
    centerY: number;
    area: number;
  }> = [];

  let regionId = 1;

  for (let startIdx = 0; startIdx < width * height; startIdx++) {
    if (visited[startIdx]) continue;

    const colorId = assignments[startIdx];
    const pixels: number[] = [];
    const stack = [startIdx];

    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (idx < 0 || idx >= width * height) continue;
      if (visited[idx]) continue;
      if (assignments[idx] !== colorId) continue;

      visited[idx] = 1;
      pixels.push(idx);

      const x = idx % width;
      const y = Math.floor(idx / width);

      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }

    if (pixels.length < minArea) continue;

    let sumX = 0,
      sumY = 0;
    for (const idx of pixels) {
      sumX += idx % width;
      sumY += Math.floor(idx / width);
    }
    const centerX = Math.round(sumX / pixels.length);
    const centerY = Math.round(sumY / pixels.length);

    for (const idx of pixels) {
      regionMap[idx] = regionId;
    }

    regions.push({ colorId: colorId + 1, pixels, centerX, centerY, area: pixels.length });
    regionId++;
  }

  return { regionMap, regions };
}

/**
 * Detect edges between different color regions.
 */
export function detectEdges(assignments: number[], width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const color = assignments[idx];

      let isEdge = false;
      if (x < width - 1 && assignments[idx + 1] !== color) isEdge = true;
      if (y < height - 1 && assignments[idx + width] !== color) isEdge = true;
      if (x > 0 && assignments[idx - 1] !== color) isEdge = true;
      if (y > 0 && assignments[idx - width] !== color) isEdge = true;

      edges[idx] = isEdge ? 255 : 0;
    }
  }

  return edges;
}
