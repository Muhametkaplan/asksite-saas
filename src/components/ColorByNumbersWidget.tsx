'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Palette,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wand2,
  PaintBucket,
  Hand,
  Paintbrush,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  addCanvasDrawing,
  saveActivePaintingProgress,
  subscribeToActivePaintingProgress,
} from '@/lib/couples';

export interface PixelColor {
  number: number;
  hex: string;
  name: string;
  count: number;
}

export interface PixelCell {
  id: number;
  col: number;
  row: number;
  targetNumber: number;
  targetHex: string;
  isFilled: boolean;
}

const SAMPLE_PHOTOS = [
  { title: 'Romantik Çift', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop&q=80' },
  { title: 'Aşk Balkonu Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80' },
  { title: 'Romantik Piknik', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&auto=format&fit=crop&q=80' },
  { title: 'Kahve & Kalpler', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80' },
];

interface ColorByNumbersWidgetProps {
  slug: string;
  partnerName: string;
}

export default function ColorByNumbersWidget({ slug, partnerName }: ColorByNumbersWidgetProps) {
  const [gridSize, setGridSize] = useState<number>(64);
  const [pixels, setPixels] = useState<PixelCell[]>([]);
  const [palette, setPalette] = useState<PixelColor[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<'paint' | 'pan' | 'bucket'>('paint');
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);

  // Zoom & Pan State
  const [scale, setScale] = useState<number>(1.5);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPointerDown, setIsPointerDown] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [highlightedHintPixelId, setHighlightedHintPixelId] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Real-Time Multi-Device Sync
  useEffect(() => {
    const unsub = subscribeToActivePaintingProgress(slug, (data) => {
      const fills = data?.regionFills;
      if (fills) {
        setPixels((prevPixels) => {
          if (prevPixels.length === 0) return prevPixels;
          let changed = false;
          const next = prevPixels.map((p) => {
            const isFilledInSync = Boolean(fills[p.id]);
            if (p.isFilled !== isFilledInSync) {
              changed = true;
              return { ...p, isFilled: isFilledInSync };
            }
            return p;
          });
          return changed ? next : prevPixels;
        });
      }
    });

    return () => unsub();
  }, [slug]);

  // Color Quantization & Pixel Grid Processor
  const processImageToPixels = useCallback((imgUrl: string, size: number) => {
    setLoadingImage(true);
    setHighlightedHintPixelId(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        // 1. Collect color frequencies and quantize into 20 dominant colors
        const rawColors: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          rawColors[hex] = (rawColors[hex] || 0) + 1;
        }

        const sortedHexes = Object.entries(rawColors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map((entry) => entry[0]);

        const paletteList: PixelColor[] = sortedHexes.map((hex, index) => ({
          number: index + 1,
          hex,
          name: `Renk #${index + 1}`,
          count: 0,
        }));

        const findClosestPaletteNumber = (r: number, g: number, b: number) => {
          let minDistance = Infinity;
          let bestNumber = 1;

          sortedHexes.forEach((hex, idx) => {
            const pr = parseInt(hex.slice(1, 3), 16);
            const pg = parseInt(hex.slice(3, 5), 16);
            const pb = parseInt(hex.slice(5, 7), 16);
            const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
            if (dist < minDistance) {
              minDistance = dist;
              bestNumber = idx + 1;
            }
          });
          return bestNumber;
        };

        // 2. Generate Pixel Grid
        const newPixels: PixelCell[] = [];
        let pId = 0;
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            const idx = (row * size + col) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const num = findClosestPaletteNumber(r, g, b);
            const hex = paletteList[num - 1]?.hex || '#000000';

            paletteList[num - 1].count++;

            newPixels.push({
              id: pId++,
              col,
              row,
              targetNumber: num,
              targetHex: hex,
              isFilled: false,
            });
          }
        }

        setPalette(paletteList);
        setPixels(newPixels);
        setSelectedNumber(1);
        setScale(1.8);
        setPanX(0);
        setPanY(0);
      } catch (err) {
        console.error('Error processing pixel image:', err);
      } finally {
        setLoadingImage(false);
      }
    };
    img.src = imgUrl;
  }, []);

  useEffect(() => {
    processImageToPixels(activePhotoUrl, gridSize);
  }, [activePhotoUrl, gridSize, processImageToPixels]);

  // Main Canvas Render Loop with RequestAnimationFrame Optimization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pixels.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const drawCanvas = () => {
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Apply Zoom & Pan Transformations
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      const cellSize = width / gridSize;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        const x = p.col * cellSize;
        const y = p.row * cellSize;

        if (p.isFilled) {
          ctx.fillStyle = p.targetHex;
          ctx.fillRect(x, y, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x, y, cellSize, cellSize);

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellSize, cellSize);

          if (scale >= 1.2) {
            ctx.fillStyle = p.targetNumber === selectedNumber ? '#ef4444' : '#475569';
            ctx.font = `bold ${Math.max(8, cellSize * 0.55)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(p.targetNumber), x + cellSize / 2, y + cellSize / 2);
          }
        }

        if (highlightedHintPixelId === p.id) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      ctx.restore();
    };

    const animId = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(animId);
  }, [pixels, gridSize, scale, panX, panY, selectedNumber, highlightedHintPixelId]);

  // Exact Coordinate Conversion Formula (as requested)
  const getPixelCoordsFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const offsetX = canvas.width / 2 + panX;
      const offsetY = canvas.height / 2 + panY;
      const pixelSize = canvas.width / gridSize;
      const zoomLevel = scale;

      const x = Math.floor(((clientX - rect.left) * scaleX - offsetX) / (pixelSize * zoomLevel) + gridSize / 2);
      const y = Math.floor(((clientY - rect.top) * scaleY - offsetY) / (pixelSize * zoomLevel) + gridSize / 2);

      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null;
      return { col: x, row: y };
    },
    [gridSize, panX, panY, scale]
  );

  // Paint pixel under cursor during Drag-to-Paint
  const paintPixelAtClientCoords = useCallback(
    (clientX: number, clientY: number) => {
      const coords = getPixelCoordsFromClient(clientX, clientY);
      if (!coords) return;

      const pixelIndex = coords.row * gridSize + coords.col;
      const targetPixel = pixels[pixelIndex];

      if (targetPixel && !targetPixel.isFilled && targetPixel.targetNumber === selectedNumber) {
        setPixels((prev) => {
          if (prev[pixelIndex]?.isFilled) return prev;
          const next = [...prev];
          next[pixelIndex] = { ...next[pixelIndex], isFilled: true };
          return next;
        });
      }
    },
    [getPixelCoordsFromClient, gridSize, pixels, selectedNumber]
  );

  // Event Handlers for Mouse & Touch
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPointerDown(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });

    if (selectedTool === 'paint') {
      paintPixelAtClientCoords(e.clientX, e.clientY);
    } else if (selectedTool === 'bucket') {
      const coords = getPixelCoordsFromClient(e.clientX, e.clientY);
      if (coords) {
        runFloodFill(coords.col, coords.row, selectedNumber);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPointerDown) return;

    if (selectedTool === 'pan') {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    } else if (selectedTool === 'paint') {
      paintPixelAtClientCoords(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = async () => {
    if (isPointerDown) {
      setIsPointerDown(false);

      // Save progress to Firestore on mouseUp
      let nextFills: Record<string, string> = {};
      pixels.forEach((p) => {
        if (p.isFilled) nextFills[p.id] = p.targetHex;
      });

      await saveActivePaintingProgress(slug, {
        templateKey: activePhotoUrl,
        regionFills: nextFills,
        updatedBy: partnerName,
      });

      checkCompletion();
    }
  };

  // Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPointerDown(true);
      setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY });

      if (selectedTool === 'paint') {
        paintPixelAtClientCoords(touch.clientX, touch.clientY);
      } else if (selectedTool === 'bucket') {
        const coords = getPixelCoordsFromClient(touch.clientX, touch.clientY);
        if (coords) {
          runFloodFill(coords.col, coords.row, selectedNumber);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPointerDown || e.touches.length !== 1) return;
    const touch = e.touches[0];

    if (selectedTool === 'pan') {
      setPanX(touch.clientX - dragStart.x);
      setPanY(touch.clientY - dragStart.y);
    } else if (selectedTool === 'paint') {
      paintPixelAtClientCoords(touch.clientX, touch.clientY);
    }
  };

  // Power-up: Flood Fill (BFS Algorithm)
  const runFloodFill = async (startCol: number, startRow: number, targetNum: number) => {
    if (startCol < 0 || startCol >= gridSize || startRow < 0 || startRow >= gridSize) return;

    const startIdx = startRow * gridSize + startCol;
    const startPixel = pixels[startIdx];

    // If clicked pixel's targetNumber does not match selected color number, do NOTHING!
    if (!startPixel || startPixel.targetNumber !== targetNum) {
      return;
    }

    const filledIds = new Set<number>();
    const queue: [number, number][] = [[startCol, startRow]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [c, r] = queue.shift()!;
      const key = `${c},${r}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (c < 0 || c >= gridSize || r < 0 || r >= gridSize) continue;
      const idx = r * gridSize + c;
      const p = pixels[idx];

      if (p && !p.isFilled && p.targetNumber === targetNum) {
        filledIds.add(p.id);
        queue.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
      }
    }

    if (filledIds.size > 0) {
      let nextFills: Record<string, string> = {};
      setPixels((prev) => {
        const next = prev.map((p) => (filledIds.has(p.id) ? { ...p, isFilled: true } : p));
        next.forEach((p) => {
          if (p.isFilled) nextFills[p.id] = p.targetHex;
        });
        return next;
      });

      await saveActivePaintingProgress(slug, {
        templateKey: activePhotoUrl,
        regionFills: nextFills,
        updatedBy: partnerName,
      });

      checkCompletion();
    }
  };

  // Power-up: Sihirli Değnek / İpucu
  const handleMagicWandHint = () => {
    const uncoloredTargetPixels = pixels.filter(
      (p) => !p.isFilled && p.targetNumber === selectedNumber
    );

    if (uncoloredTargetPixels.length === 0) {
      alert(`🎉 #${selectedNumber} numaralı tüm pikseller tamamlandı (100%)!`);
      return;
    }

    const randomHintPixel = uncoloredTargetPixels[Math.floor(Math.random() * uncoloredTargetPixels.length)];
    setHighlightedHintPixelId(randomHintPixel.id);

    const canvas = canvasRef.current;
    if (canvas) {
      const cellSize = canvas.width / gridSize;
      const pxX = randomHintPixel.col * cellSize + cellSize / 2;
      const pxY = randomHintPixel.row * cellSize + cellSize / 2;
      setPanX((canvas.width / 2 - pxX) * scale);
      setPanY((canvas.height / 2 - pxY) * scale);
      setScale(2.5);
    }
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(8.0, Math.max(0.6, prev + delta)));
  };

  const handleResetView = () => {
    setScale(1.5);
    setPanX(0);
    setPanY(0);
  };

  const checkCompletion = () => {
    const allFilled = pixels.every((p) => p.isFilled);
    if (allFilled) {
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
    }
  };

  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      const imageUrl = canvas.toDataURL('image/png');
      const success = await addCanvasDrawing(slug, {
        imageUrl,
        drawnBy: `${partnerName} (RekorOyun Pixel Engine 🎨)`,
      });

      if (success) {
        confetti({ particleCount: 90, spread: 80 });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving pixel artwork:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setActivePhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const filledCount = pixels.filter((p) => p.isFilled).length;
  const progressPct = pixels.length > 0 ? Math.round((filledCount / pixels.length) * 100) : 0;

  return (
    <div className="pixel-color-by-number-engine space-y-5 text-center max-w-xl mx-auto">
      {/* Sample Photos & Custom Upload Header */}
      <div className="rounded-3xl bg-white p-4 shadow-md border border-gray-100 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-rose-500" /> Numaralı Piksel Tabloları & Fotoğraflar
          </h4>
          <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            %{progressPct} Tamamlandı
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_PHOTOS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhotoUrl(sample.url)}
              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition ${
                activePhotoUrl === sample.url ? 'border-rose-500 shadow-md scale-102' : 'border-gray-200 opacity-80 hover:opacity-100'
              }`}
            >
              <img src={sample.url} alt={sample.title} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-bold text-white py-0.5 truncate px-1 text-center">
                {sample.title}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md hover:scale-102 transition active:scale-95">
            <Upload className="h-3.5 w-3.5" />
            <span>Kendi Fotoğrafını Yükle 📸</span>
            <input type="file" accept="image/*" onChange={handleCustomPhotoUpload} className="hidden" />
          </label>

          <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200">
            <span>Izgara:</span>
            <button
              onClick={() => setGridSize(64)}
              className={`px-2 py-0.5 rounded-lg transition ${gridSize === 64 ? 'bg-rose-500 text-white' : 'text-gray-600'}`}
            >
              64x64
            </button>
            <button
              onClick={() => setGridSize(80)}
              className={`px-2 py-0.5 rounded-lg transition ${gridSize === 80 ? 'bg-rose-500 text-white' : 'text-gray-600'}`}
            >
              80x80
            </button>
          </div>
        </div>
      </div>

      {loadingImage && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800 animate-pulse">
          🎨 Fotoğraftan RekorOyun Piksel Izgarası Üretiliyor...
        </div>
      )}

      {/* Main Interactive Pixel Canvas Wrapper */}
      <div className="relative mx-auto rounded-3xl bg-white shadow-2xl border-4 border-rose-100 overflow-hidden touch-none select-none p-1">
        {/* Canvas Zoom Toolbar */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-gray-200 text-xs">
          <button
            onClick={() => handleZoom(0.3)}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-gray-700 font-bold transition"
            title="Yakınlaştır (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.3)}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-gray-700 font-bold transition"
            title="Uzaklaştır (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-gray-700 font-bold transition"
            title="Görünümü Sıfırla"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Tools Toolbar: Drag-to-Paint, Pan, Paint Bucket, Hint */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-gray-200">
          <button
            onClick={() => setSelectedTool('paint')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold transition ${
              selectedTool === 'paint' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Sürükleyerek Boya (Drag-to-Paint)"
          >
            <Paintbrush className="h-3.5 w-3.5" /> Sürükle-Boya
          </button>
          <button
            onClick={() => setSelectedTool('pan')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold transition ${
              selectedTool === 'pan' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Kaydır & Gezin (Pan)"
          >
            <Hand className="h-3.5 w-3.5" /> Kaydır
          </button>
          <button
            onClick={() => setSelectedTool('bucket')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold transition ${
              selectedTool === 'bucket' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Boya Kovası"
          >
            <PaintBucket className="h-3.5 w-3.5" /> Kova
          </button>
          <button
            onClick={handleMagicWandHint}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-500 text-white hover:bg-amber-600 transition shadow-sm active:scale-95"
            title="Sihirli Değnek / İpucu"
          >
            <Wand2 className="h-3.5 w-3.5" /> İpucu
          </button>
        </div>

        {/* RekorOyun HTML5 Pixel Canvas Engine */}
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="cursor-crosshair w-full max-w-[380px] h-[380px] block mx-auto bg-slate-50 touch-none"
        />
      </div>

      {/* Palette Bar with Live % Progress & Completion Badges (✓) */}
      <div className="rounded-3xl bg-white p-4 shadow-lg border border-gray-100 space-y-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 flex items-center justify-center gap-1.5">
          <Palette className="h-4 w-4 text-rose-500" /> RekorOyun Canlı Renk Paleti ({palette.length} Renk)
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto p-1">
          {palette.map((c) => {
            const isSelected = selectedNumber === c.number;
            const totalCount = pixels.filter((p) => p.targetNumber === c.number).length;
            const filledCount = pixels.filter((p) => p.targetNumber === c.number && p.isFilled).length;
            const colorPct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
            const isCompleted = totalCount > 0 && filledCount === totalCount;

            return (
              <button
                key={c.number}
                onClick={() => setSelectedNumber(c.number)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-gray-900 shadow-md scale-105 ring-2 ring-rose-500/40 bg-rose-50/60'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className="h-5 w-5 rounded-full border border-gray-300 shadow-inner flex items-center justify-center text-[10px] font-black text-white drop-shadow-md shrink-0"
                  style={{ backgroundColor: c.hex }}
                >
                  {c.number}
                </div>
                <span className="text-[11px] font-extrabold text-gray-800">#{c.number}</span>
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-extrabold text-gray-500 font-mono">
                    (%{colorPct})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleResetView}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Görünümü Sıfırla
          </button>

          <button
            onClick={handleSaveToGallery}
            disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:scale-[1.01] active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            🎨 {saving ? 'Kaydediliyor...' : 'Piksel Sanat Eserini Kaydet'}
          </button>
        </div>

        {saveSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-700 animate-in fade-in">
            ✨ RekorOyun piksel boyama eseriniz Aşkımızın Çizim Galerisi'ne başarıyla eklendi!
          </div>
        )}
      </div>
    </div>
  );
}
