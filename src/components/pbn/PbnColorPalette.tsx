'use client';

import type { PaletteColor, Region } from '@/lib/pbn-types';

interface PbnColorPaletteProps {
  palette: PaletteColor[];
  selectedColorId: number | null;
  coloredRegions: Map<number, number>;
  regions: Region[];
  onSelectColor: (colorId: number) => void;
}

export default function PbnColorPalette({
  palette,
  selectedColorId,
  coloredRegions,
  regions,
  onSelectColor,
}: PbnColorPaletteProps) {
  // Count progress per color
  const colorProgress = new Map<number, { total: number; done: number }>();
  for (const region of regions) {
    const entry = colorProgress.get(region.colorId) ?? { total: 0, done: 0 };
    entry.total++;
    if (coloredRegions.has(region.id)) entry.done++;
    colorProgress.set(region.colorId, entry);
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 text-center">
        🎨 Renk Seç &amp; Boya
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {palette.map((color) => {
          const prog = colorProgress.get(color.id);
          const isComplete = prog ? prog.done === prog.total && prog.total > 0 : false;
          const isSelected = selectedColorId === color.id;
          const pct = prog && prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

          return (
            <button
              key={color.id}
              onClick={() => onSelectColor(color.id)}
              title={`Renk ${color.id} — %${pct}`}
              aria-label={`Renk ${color.id}: ${color.hex}`}
              className={`relative flex flex-col items-center gap-0.5 p-1.5 rounded-xl border-2 transition-all active:scale-90 ${
                isSelected
                  ? 'border-rose-500 bg-rose-50 shadow-md scale-105 ring-2 ring-rose-400/30'
                  : isComplete
                  ? 'border-emerald-400 bg-emerald-50 opacity-80'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              style={{ minWidth: 0 }}
            >
              {/* Color swatch */}
              <span
                className="block w-7 h-7 rounded-lg border border-black/10 shadow-inner"
                style={{ background: color.hex }}
              />
              {/* Number */}
              <span className="text-[10px] font-black text-gray-700 leading-none">{color.id}</span>

              {/* Progress dot / check */}
              {isComplete ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] text-white font-black shadow">
                  ✓
                </span>
              ) : pct > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow leading-none">
                  {pct}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
