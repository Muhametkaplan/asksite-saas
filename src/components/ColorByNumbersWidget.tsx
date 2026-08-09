'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { addCanvasDrawing, saveActivePaintingProgress, subscribeToActivePaintingProgress } from '@/lib/couples';
import { processImage } from '@/lib/pbn-imageProcessor';
import type { ProcessedImage, PbnPaintState, PbnDifficulty } from '@/lib/pbn-types';
import PbnPaintCanvas from '@/components/pbn/PbnPaintCanvas';
import PbnColorPalette from '@/components/pbn/PbnColorPalette';
import PbnToolbar from '@/components/pbn/PbnToolbar';
import PbnCelebrationOverlay from '@/components/pbn/PbnCelebrationOverlay';

// ─── Romantic sample templates ───────────────────────────────────────────────
const ROMANTIC_TEMPLATES = [
  {
    id: 'couple',
    name: '💑 Romantik Çift',
    thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200&q=70',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=700&q=85',
    difficulty: 'medium' as PbnDifficulty,
  },
  {
    id: 'sunset',
    name: '🌅 Aşk Gün Batımı',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=70',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=85',
    difficulty: 'medium' as PbnDifficulty,
  },
  {
    id: 'picnic',
    name: '🧺 Romantik Piknik',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&q=70',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=700&q=85',
    difficulty: 'easy' as PbnDifficulty,
  },
  {
    id: 'coffee',
    name: '☕ Kahve Anı',
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&q=70',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&q=85',
    difficulty: 'easy' as PbnDifficulty,
  },
  {
    id: 'night',
    name: '🌙 Yıldızlı Gece',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=70',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=85',
    difficulty: 'hard' as PbnDifficulty,
  },
  {
    id: 'flower',
    name: '🌸 Çiçek Bahçesi',
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88df5691cc43?w=200&q=70',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc43?w=700&q=85',
    difficulty: 'easy' as PbnDifficulty,
  },
];

const DIFFICULTY_MAP: Record<PbnDifficulty, { label: string; colors: number; desc: string; color: string }> = {
  easy: { label: 'Kolay', colors: 8, desc: '8 Renk', color: '#4ade80' },
  medium: { label: 'Orta', colors: 16, desc: '16 Renk', color: '#facc15' },
  hard: { label: 'Zor', colors: 24, desc: '24 Renk', color: '#f87171' },
};

function buildInitialState(totalRegions: number): PbnPaintState {
  return {
    coloredRegions: new Map(),
    selectedColorId: null,
    totalRegions,
    completedRegions: 0,
    hintsUsed: 0,
    undoStack: [],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ColorByNumbersWidgetProps {
  slug: string;
  partnerName: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ColorByNumbersWidget({ slug, partnerName }: ColorByNumbersWidgetProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(ROMANTIC_TEMPLATES[0]);
  const [difficulty, setDifficulty] = useState<PbnDifficulty>('medium');
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [paintState, setPaintState] = useState<PbnPaintState | null>(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeImgUrl, setActiveImgUrl] = useState(ROMANTIC_TEMPLATES[0].imageUrl);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const celebrationSavedRef = useRef(false);

  // ─── Load & process image ─────────────────────────────────────────────────
  const loadAndProcess = useCallback(
    async (imgUrl: string, diff: PbnDifficulty) => {
      setIsLoading(true);
      setLoadingProgress(0);
      setShowCelebration(false);
      celebrationSavedRef.current = false;

      try {
        const result = await processImage(imgUrl, diff, (pct) => setLoadingProgress(pct));
        setProcessedImage(result);
        setPaintState(buildInitialState(result.regions.length));
      } catch (err) {
        console.error('PBN processImage error:', err);
      } finally {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    loadAndProcess(activeImgUrl, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImgUrl, difficulty]);

  // ─── Firestore real-time sync ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToActivePaintingProgress(slug, (data) => {
      if (!data || data.templateKey !== activeImgUrl) return;
      const fills = data.regionFills as Record<string, number> | undefined;
      if (!fills) return;

      setPaintState((prev) => {
        if (!prev || !processedImage) return prev;
        const newColored = new Map(prev.coloredRegions);
        let changed = false;
        for (const [key, colorId] of Object.entries(fills)) {
          const regionId = Number(key);
          if (newColored.get(regionId) !== colorId) {
            newColored.set(regionId, colorId);
            changed = true;
          }
        }
        if (!changed) return prev;
        return {
          ...prev,
          coloredRegions: newColored,
          completedRegions: newColored.size,
        };
      });
    });
    return () => unsub();
  }, [slug, activeImgUrl, processedImage]);

  // ─── Region click handler ─────────────────────────────────────────────────
  const handleRegionClick = useCallback(
    (regionId: number) => {
      setPaintState((prev) => {
        if (!prev || !prev.selectedColorId) return prev;
        const prevColorId = prev.coloredRegions.get(regionId) ?? null;
        if (prevColorId === prev.selectedColorId) return prev;

        const newColored = new Map(prev.coloredRegions);
        newColored.set(regionId, prev.selectedColorId);
        const newUndo = [...prev.undoStack, { regionId, prevColorId }];
        const completed = newColored.size;

        const next = { ...prev, coloredRegions: newColored, completedRegions: completed, undoStack: newUndo };

        // Save to Firestore
        const fills: Record<string, number> = {};
        newColored.forEach((v, k) => { fills[String(k)] = v; });
        saveActivePaintingProgress(slug, {
          templateKey: activeImgUrl,
          regionFills: fills as unknown as Record<string, string>,
          updatedBy: partnerName,
        }).catch(console.error);

        return next;
      });
    },
    [slug, activeImgUrl, partnerName]
  );

  // ─── Check completion ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!paintState || !processedImage) return;
    if (
      paintState.completedRegions > 0 &&
      paintState.completedRegions >= paintState.totalRegions
    ) {
      const timer = setTimeout(() => setShowCelebration(true), 500);
      return () => clearTimeout(timer);
    }
  }, [paintState?.completedRegions, paintState?.totalRegions, processedImage]);

  // ─── Undo ────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    setPaintState((prev) => {
      if (!prev || prev.undoStack.length === 0) return prev;
      const newUndo = [...prev.undoStack];
      const last = newUndo.pop()!;
      const newColored = new Map(prev.coloredRegions);
      if (last.prevColorId === null) {
        newColored.delete(last.regionId);
      } else {
        newColored.set(last.regionId, last.prevColorId);
      }
      return { ...prev, coloredRegions: newColored, completedRegions: newColored.size, undoStack: newUndo };
    });
  }, []);

  // ─── Hint ────────────────────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    if (!paintState || !processedImage) return;
    setPaintState((prev) => {
      if (!prev) return prev;
      const uncolored = processedImage.regions.find((r) => !prev.coloredRegions.has(r.id));
      if (!uncolored) return prev;
      const newColored = new Map(prev.coloredRegions);
      newColored.set(uncolored.id, uncolored.colorId);
      return {
        ...prev,
        coloredRegions: newColored,
        completedRegions: newColored.size,
        hintsUsed: prev.hintsUsed + 1,
        undoStack: [...prev.undoStack, { regionId: uncolored.id, prevColorId: null }],
      };
    });
  }, [paintState, processedImage]);

  // ─── Reset ───────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (!processedImage) return;
    if (confirm('Tüm ilerlemeyi sıfırlamak istediğinden emin misin?')) {
      setPaintState(buildInitialState(processedImage.regions.length));
      setShowCelebration(false);
      celebrationSavedRef.current = false;
    }
  }, [processedImage]);

  // ─── Save to gallery ──────────────────────────────────────────────────────
  const handleSaveToGallery = useCallback(async () => {
    if (!processedImage || !paintState) return;

    setSaving(true);
    try {
      // Build final image on an offscreen canvas
      const { width, height, regionMap, palette, outlineData } = processedImage;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext('2d')!;
      const imgData = ctx.createImageData(width, height);

      for (let i = 0; i < width * height; i++) {
        const regionId = regionMap[i];
        const idx4 = i * 4;

        if (outlineData.data[idx4] < 100) {
          imgData.data[idx4] = 40;
          imgData.data[idx4 + 1] = 38;
          imgData.data[idx4 + 2] = 35;
          imgData.data[idx4 + 3] = 255;
          continue;
        }

        if (regionId === 0) {
          imgData.data[idx4] = 255;
          imgData.data[idx4 + 1] = 255;
          imgData.data[idx4 + 2] = 255;
          imgData.data[idx4 + 3] = 255;
          continue;
        }

        const coloredId = paintState.coloredRegions.get(regionId);
        const pal = coloredId !== undefined ? palette.find((p) => p.id === coloredId) : null;
        if (pal) {
          imgData.data[idx4] = pal.color.r;
          imgData.data[idx4 + 1] = pal.color.g;
          imgData.data[idx4 + 2] = pal.color.b;
        } else {
          imgData.data[idx4] = 248;
          imgData.data[idx4 + 1] = 246;
          imgData.data[idx4 + 2] = 242;
        }
        imgData.data[idx4 + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);
      const imageUrl = offCanvas.toDataURL('image/png');

      const ok = await addCanvasDrawing(slug, {
        imageUrl,
        drawnBy: `${partnerName} (Sayılarla Boyama 🎨)`,
      });

      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [processedImage, paintState, slug, partnerName]);

  // ─── Custom photo upload ──────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) setActiveImgUrl(url);
    };
    reader.readAsDataURL(file);
  };

  // ─── Derived state ────────────────────────────────────────────────────────
  const progress = paintState
    ? (paintState.completedRegions / Math.max(1, paintState.totalRegions)) * 100
    : 0;

  const totalRegions = paintState?.totalRegions ?? 0;
  const completedRegions = paintState?.completedRegions ?? 0;

  return (
    <div className="space-y-4">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow text-lg"
            style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
          >
            🖌️
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900 leading-none">Sayılarla Boyama</p>
            <p className="text-[10px] text-gray-500 font-medium">
              {completedRegions}/{totalRegions} bölge · {Math.round(progress)}% tamamlandı
            </p>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex gap-1">
          {(Object.keys(DIFFICULTY_MAP) as PbnDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition border ${
                difficulty === d
                  ? 'text-white border-transparent shadow'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
              style={
                difficulty === d
                  ? { background: DIFFICULTY_MAP[d].color, borderColor: DIFFICULTY_MAP[d].color, color: '#1f2937' }
                  : {}
              }
            >
              {DIFFICULTY_MAP[d].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Template picker ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3 space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5" /> Hazır Şablonlar
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {ROMANTIC_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                setSelectedTemplate(tmpl);
                setActiveImgUrl(tmpl.imageUrl);
              }}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-90 ${
                activeImgUrl === tmpl.imageUrl && selectedTemplate.id === tmpl.id
                  ? 'border-rose-500 shadow-md ring-2 ring-rose-400/30'
                  : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
              }`}
            >
              <img src={tmpl.thumbnail} alt={tmpl.name} className="w-full h-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] font-bold text-white text-center py-0.5 px-0.5 leading-tight truncate">
                {tmpl.name}
              </span>
            </button>
          ))}
        </div>

        {/* Custom upload */}
        <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-rose-300 bg-gray-50 hover:bg-rose-50 transition px-3 py-2 text-xs font-bold text-gray-500 hover:text-rose-500">
          <Upload className="h-3.5 w-3.5" />
          <span>Kendi fotoğrafını yükle</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* ── Loading indicator ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              Fotoğraf analiz ediliyor… K-Means renk kuantizasyonu
            </span>
            <span>{loadingProgress}%</span>
          </div>
          <div className="h-2 bg-rose-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${loadingProgress}%`,
                background: 'linear-gradient(90deg, #f43f5e, #a855f7)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Game area ─────────────────────────────────────────────────────── */}
      {processedImage && paintState && !isLoading && (
        <>
          {/* Toolbar */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3">
            <PbnToolbar
              onUndo={handleUndo}
              onHint={handleHint}
              onReset={handleReset}
              onSave={handleSaveToGallery}
              onToggleNumbers={() => setShowNumbers((s) => !s)}
              showNumbers={showNumbers}
              hintsUsed={paintState.hintsUsed}
              canUndo={paintState.undoStack.length > 0}
              progress={progress}
            />
          </div>

          {/* Main two-column layout */}
          <div className="flex gap-3 flex-col lg:flex-row">
            {/* Canvas */}
            <div className="flex-1 min-w-0 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-1.5">
                <PbnPaintCanvas
                  processedImage={processedImage}
                  paintState={paintState}
                  onRegionClick={handleRegionClick}
                  showNumbers={showNumbers}
                />
              </div>

              {/* Selected color hint */}
              <div className="px-3 pb-3 pt-1 border-t border-gray-50">
                {paintState.selectedColorId ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <span
                      className="w-5 h-5 rounded-lg border border-black/10 shadow-inner shrink-0"
                      style={{
                        background: processedImage.palette.find(
                          (p) => p.id === paintState.selectedColorId
                        )?.hex ?? '#ccc',
                      }}
                    />
                    <span>
                      Renk {paintState.selectedColorId} seçili — tuvale tıkla!
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center">
                    ← Sağdan bir renk seç, sonra bölgeye tıkla
                  </p>
                )}
              </div>
            </div>

            {/* Color palette sidebar */}
            <div className="w-full lg:w-44 rounded-2xl bg-white border border-gray-100 shadow-sm p-3">
              <PbnColorPalette
                palette={processedImage.palette}
                selectedColorId={paintState.selectedColorId}
                coloredRegions={paintState.coloredRegions}
                regions={processedImage.regions}
                onSelectColor={(id) =>
                  setPaintState((prev) => prev ? { ...prev, selectedColorId: id } : prev)
                }
              />
            </div>
          </div>

          {/* Save to gallery button */}
          <button
            onClick={handleSaveToGallery}
            disabled={saving}
            className="w-full py-3 rounded-2xl font-extrabold text-sm text-white shadow-lg transition hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
          >
            🖼️ {saving ? 'Kaydediliyor...' : 'Sanat Eserini Galeriye Kaydet'}
          </button>

          {saveSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-bold text-emerald-700">
              ✨ Boyama eseriniz Çizim Galerisi'ne başarıyla eklendi!
            </div>
          )}
        </>
      )}

      {/* ── Celebration Overlay ───────────────────────────────────────────── */}
      {showCelebration && (
        <PbnCelebrationOverlay
          onClose={() => setShowCelebration(false)}
          onSaveToGallery={handleSaveToGallery}
        />
      )}
    </div>
  );
}
