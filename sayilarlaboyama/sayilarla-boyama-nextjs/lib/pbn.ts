export type RGB = [number, number, number];

export type PaletteColor = {
  id: number;
  rgb: RGB;
  hex: string;
};

export type Region = {
  id: number;
  colorId: number;
  pixels: number[];
  area: number;
  labelX: number;
  labelY: number;
};

export type PBNResult = {
  width: number;
  height: number;
  palette: PaletteColor[];
  regions: Region[];
  assignments: Uint8Array;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function hex(rgb: RGB) {
  return "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("");
}

function distSq(a: RGB, b: RGB) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * K-means-like color quantization. It intentionally uses deterministic
 * sampling so the browser can process ordinary phone photos without a server.
 */
function quantize(data: Uint8ClampedArray, k: number): { palette: RGB[]; assignments: Uint8Array } {
  const pixels = data.length / 4;
  const sampleCount = Math.min(5000, pixels);
  const samples: RGB[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const p = Math.floor((i / sampleCount) * pixels);
    const o = p * 4;
    samples.push([data[o], data[o + 1], data[o + 2]]);
  }

  const centers: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centers.push(samples[Math.floor((i + 0.5) * samples.length / k)] ?? [128, 128, 128]);
  }

  for (let iteration = 0; iteration < 7; iteration++) {
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (const s of samples) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distSq(s, centers[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      sums[best][0] += s[0];
      sums[best][1] += s[1];
      sums[best][2] += s[2];
      sums[best][3] += 1;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c][3]) {
        centers[c] = [
          Math.round(sums[c][0] / sums[c][3]),
          Math.round(sums[c][1] / sums[c][3]),
          Math.round(sums[c][2] / sums[c][3])
        ];
      }
    }
  }

  const assignments = new Uint8Array(pixels);
  for (let p = 0; p < pixels; p++) {
    const o = p * 4;
    const rgb: RGB = [data[o], data[o + 1], data[o + 2]];
    let best = 0;
    let bestD = Infinity;
    for (let c = 0; c < k; c++) {
      const d = distSq(rgb, centers[c]);
      if (d < bestD) { bestD = d; best = c; }
    }
    assignments[p] = best;
  }

  return { palette: centers, assignments };
}

function neighbors(p: number, w: number, h: number): number[] {
  const x = p % w;
  const y = Math.floor(p / w);
  const out: number[] = [];
  if (x > 0) out.push(p - 1);
  if (x < w - 1) out.push(p + 1);
  if (y > 0) out.push(p - w);
  if (y < h - 1) out.push(p + w);
  return out;
}

/**
 * Converts color islands into numbered regions.
 * Small islands are absorbed into the most common neighbouring color to
 * prevent noisy labels on photographs.
 */
export function makePaintByNumbers(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorCount = 12
): PBNResult {
  const { palette, assignments } = quantize(data, colorCount);
  const total = width * height;
  const visited = new Uint8Array(total);
  const regionMap = new Int32Array(total);
  regionMap.fill(-1);
  const regions: Region[] = [];

  const minArea = Math.max(18, Math.floor(total / 2600));

  for (let start = 0; start < total; start++) {
    if (visited[start]) continue;
    const colorId = assignments[start];
    const queue = [start];
    visited[start] = 1;
    const pixels: number[] = [];
    let sumX = 0, sumY = 0;

    while (queue.length) {
      const p = queue.pop()!;
      pixels.push(p);
      const x = p % width, y = Math.floor(p / width);
      sumX += x; sumY += y;

      for (const n of neighbors(p, width, height)) {
        if (!visited[n] && assignments[n] === colorId) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }

    if (pixels.length < minArea) {
      // Assign tiny island to the largest neighbouring color.
      const counts = new Map<number, number>();
      for (const p of pixels) {
        for (const n of neighbors(p, width, height)) {
          if (!pixels.includes(n)) {
            const c = assignments[n];
            counts.set(c, (counts.get(c) ?? 0) + 1);
          }
        }
      }
      let replacement = colorId;
      let max = -1;
      counts.forEach((count, c) => { if (count > max) { max = count; replacement = c; } });
      for (const p of pixels) assignments[p] = replacement;
      continue;
    }

    const id = regions.length + 1;
    const region: Region = {
      id,
      colorId,
      pixels,
      area: pixels.length,
      labelX: Math.round(sumX / pixels.length),
      labelY: Math.round(sumY / pixels.length)
    };
    for (const p of pixels) regionMap[p] = regions.length;
    regions.push(region);
  }

  // Recalculate color IDs after tiny-region absorption.
  for (const region of regions) {
    const first = region.pixels[0];
    region.colorId = assignments[first];
  }

  const paletteOut: PaletteColor[] = palette.map((rgb, i) => ({
    id: i + 1,
    rgb,
    hex: hex(rgb)
  }));

  return {
    width,
    height,
    palette: paletteOut,
    regions,
    assignments
  };
}

export function drawPBN(
  canvas: HTMLCanvasElement,
  result: PBNResult,
  showNumbers: boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height, assignments, palette, regions } = result;
  canvas.width = width;
  canvas.height = height;

  const image = ctx.createImageData(width, height);
  for (let p = 0; p < width * height; p++) {
    const o = p * 4;
    image.data[o] = 248;
    image.data[o + 1] = 248;
    image.data[o + 2] = 248;
    image.data[o + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Draw region borders by checking right/down neighbours.
  ctx.strokeStyle = "#202020";
  ctx.lineWidth = Math.max(0.7, Math.min(width, height) / 700);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const c = assignments[p];
      if (x < width - 1 && assignments[p + 1] !== c) {
        ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + 1); ctx.stroke();
      }
      if (y < height - 1 && assignments[p + width] !== c) {
        ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + 1, y + 1); ctx.stroke();
      }
    }
  }

  if (showNumbers) {
    const fontSize = Math.max(7, Math.min(width, height) / 55);
    ctx.font = `700 ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const r of regions) {
      const n = r.colorId + 1;
      const x = clamp(r.labelX, 3, width - 3);
      const y = clamp(r.labelY, 3, height - 3);
      ctx.fillStyle = "#111";
      ctx.fillText(String(n), x, y);
    }
  }
}

export function drawColorPreview(
  canvas: HTMLCanvasElement,
  result: PBNResult
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = result.width;
  canvas.height = result.height;
  const img = ctx.createImageData(result.width, result.height);
  for (let p = 0; p < result.assignments.length; p++) {
    const c = result.palette[result.assignments[p]];
    const o = p * 4;
    img.data[o] = c.rgb[0];
    img.data[o + 1] = c.rgb[1];
    img.data[o + 2] = c.rgb[2];
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}