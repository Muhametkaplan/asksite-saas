// ============================================================
// Types for Paint-by-Numbers Engine (ported from oyun1)
// ============================================================

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface PaletteColor {
  id: number;
  color: RGBColor;
  hex: string;
  label: string;
  count: number;
}

export interface Region {
  id: number;
  colorId: number;
  pixels: number[];
  centerX: number;
  centerY: number;
  area: number;
}

export interface ProcessedImage {
  width: number;
  height: number;
  palette: PaletteColor[];
  regions: Region[];
  regionMap: Uint16Array;
  colorMap: Uint8Array;
  outlineData: ImageData;
}

export interface PbnPaintState {
  coloredRegions: Map<number, number>; // regionId → paletteColorId
  selectedColorId: number | null;
  totalRegions: number;
  completedRegions: number;
  hintsUsed: number;
  undoStack: Array<{ regionId: number; prevColorId: number | null }>;
}

export type PbnDifficulty = 'easy' | 'medium' | 'hard';

export interface PbnTemplate {
  id: string;
  name: string;
  thumbnail: string;
  imageUrl: string;
  difficulty: PbnDifficulty;
  description: string;
  category: 'romantic' | 'nature' | 'art' | 'other';
  colors: number;
}
