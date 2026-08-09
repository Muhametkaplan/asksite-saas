'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, Trash2, Eraser, Sparkles, Circle, Image as ImageIcon } from 'lucide-react';
import {
  sendCanvasStroke,
  subscribeToLiveCanvas,
  clearLiveCanvas,
  subscribeToPartnerPresence,
  addCanvasDrawing,
  getCanvasDrawings,
  deleteCanvasDrawing,
  CanvasStrokeData,
} from '@/lib/couples';
import { CanvasDrawing } from '@/types/couple';
import confetti from 'canvas-confetti';

interface LiveCanvasWidgetProps {
  slug: string;
  partner1Name?: string;
  partner2Name?: string;
}

const COLOR_PALETTE = [
  { name: 'Pembe', hex: '#ff4d6d' },
  { name: 'Mor', hex: '#6c5ce7' },
  { name: 'Kırmızı', hex: '#e84393' },
  { name: 'Mavi', hex: '#0984e3' },
  { name: 'Altın', hex: '#fdcb6e' },
  { name: 'Siyah', hex: '#2d3436' },
];

export default function LiveCanvasWidget({
  slug,
  partner1Name = 'Partner 1',
  partner2Name = 'Partner 2',
}: LiveCanvasWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ff4d6d');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [presence, setPresence] = useState<{ partner1?: any; partner2?: any }>({});

  const [currentRole, setCurrentRole] = useState<'partner1' | 'partner2' | 'guest'>('partner1');
  const [drawings, setDrawings] = useState<CanvasDrawing[]>([]);
  const [saving, setSaving] = useState(false);

  const loadDrawings = async () => {
    const list = await getCanvasDrawings(slug);
    setDrawings(list);
  };

  useEffect(() => {
    loadDrawings();

    const storedAuth = typeof window !== 'undefined'
      ? sessionStorage.getItem(`asksite_auth_${slug}`) || localStorage.getItem(`asksite_auth_${slug}`)
      : null;
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.role) setCurrentRole(parsed.role);
      } catch {}
    }

    const unsubPresence = subscribeToPartnerPresence(slug, (data) => {
      setPresence(data || {});
    });

    const unsubCanvas = subscribeToLiveCanvas(slug, (strokes) => {
      drawAllStrokes(strokes);
    });

    return () => {
      unsubPresence();
      unsubCanvas();
    };
  }, [slug]);

  const drawAllStrokes = (strokes: CanvasStrokeData[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setCurrentPath([coords]);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const newPath = [...currentPath, coords];
    setCurrentPath(newPath);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (newPath.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = isEraser ? '#ffffff' : selectedColor;
      ctx.lineWidth = isEraser ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const prev = newPath[newPath.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleEndDraw = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPath.length >= 2) {
      const strokeData: CanvasStrokeData = {
        points: currentPath,
        color: isEraser ? '#ffffff' : selectedColor,
        strokeWidth: isEraser ? strokeWidth * 3 : strokeWidth,
        role: currentRole,
      };

      await sendCanvasStroke(slug, strokeData);
    }
    setCurrentPath([]);
  };

  const handleClear = async () => {
    if (confirm('Canlı tuvali tüm çizimlerle birlikte sıfırlamak istiyor musunuz?')) {
      await clearLiveCanvas(slug);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleSaveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      // Composite canvas onto white background
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        offCtx.drawImage(canvas, 0, 0);
      }
      const imageUrl = offscreen.toDataURL('image/png');
      const drawnBy = currentRole === 'partner1' ? partner1Name : currentRole === 'partner2' ? partner2Name : 'Misafir Partner';

      const success = await addCanvasDrawing(slug, { imageUrl, drawnBy });
      if (success) {
        await loadDrawings();
        confetti({ particleCount: 70, spread: 80 });
      }
    } catch (e) {
      console.error('Error saving canvas drawing:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDrawing = async (drawingId: string) => {
    if (confirm('Bu sanat eserini galerinizden silmek istediğinize emin misiniz?')) {
      const success = await deleteCanvasDrawing(slug, drawingId);
      if (success) {
        setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      }
    }
  };

  return (
    <div className="live-canvas-widget my-6 rounded-3xl bg-white/80 backdrop-blur-md p-5 shadow-xl border border-white/90 text-center relative overflow-hidden">
      {/* Header & Online Status Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Palette className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              Real-time Live Canvas <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">Birlikte Canlı Çizim Köşesi</span>
          </div>
        </div>

        {/* Presence Status Badges & Quick Switch */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <div className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-900 border border-rose-100">
            <Circle className={`h-2.5 w-2.5 ${presence.partner1?.isOnline ? 'fill-emerald-500 text-emerald-500 animate-pulse' : 'fill-gray-300 text-gray-300'}`} />
            <span>{partner1Name}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-purple-900 border border-purple-100">
            <Circle className={`h-2.5 w-2.5 ${presence.partner2?.isOnline ? 'fill-emerald-500 text-emerald-500 animate-pulse' : 'fill-gray-300 text-gray-300'}`} />
            <span>{partner2Name}</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open_partner_auth_modal'))}
            className="rounded-full bg-white px-2.5 py-1 text-rose-500 font-extrabold border border-rose-200 hover:bg-rose-50 transition active:scale-95 shadow-xs"
            title="Kendi profilini seç"
          >
            Profil Değiştir 🔄
          </button>
        </div>
      </div>

      {/* HTML5 Canvas */}
      <div className="relative mx-auto rounded-2xl overflow-hidden shadow-inner border-2 border-rose-100 bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={320}
          height={280}
          onMouseDown={handleStartDraw}
          onMouseMove={handleDraw}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleDraw}
          onTouchEnd={handleEndDraw}
          className="cursor-crosshair w-full max-w-[320px] h-[280px] block mx-auto bg-white"
        />
      </div>

      {/* Toolbar Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color.hex}
              onClick={() => {
                setSelectedColor(color.hex);
                setIsEraser(false);
              }}
              style={{ backgroundColor: color.hex }}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${
                !isEraser && selectedColor === color.hex ? 'scale-125 border-gray-900 shadow-sm' : 'border-white'
              }`}
              title={color.name}
            />
          ))}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-bold transition ${
              isEraser ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}
            title="Silgi"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Thickness & Clear & Save */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="range"
            min={2}
            max={14}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-16 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            title="Çizgi Kalınlığı"
          />
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition active:scale-95"
            title="Tuvali Sıfırla"
          >
            <Trash2 className="h-3.5 w-3.5" /> Temizle
          </button>

          <button
            onClick={handleSaveDrawing}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md hover:scale-102 active:scale-95 transition disabled:opacity-50"
          >
            🎨 {saving ? 'Kaydediliyor...' : 'Sanat Eserini Kaydet'}
          </button>
        </div>
      </div>

      {/* Aşkımızın Çizim Galerisi 🎨 */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-left">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <span>Aşkımızın Çizim Galerisi 🎨</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-600">
                {drawings.length} Eser
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Birlikte tuval üzerinde çizip mühürlediğiniz tüm özel sanat eserleri.
            </p>
          </div>
        </div>

        {drawings.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-xs text-gray-400 italic border border-dashed border-gray-200">
            Henüz kaydedilmiş bir çizim eseri bulunmuyor. İlk sanat eserinizi yukarıdaki tuvalde çizip kaydet butonuna basın! 🎨
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {drawings.map((drawing) => (
              <div
                key={drawing.id}
                className="relative group overflow-hidden rounded-2xl bg-white p-3 border border-gray-200 shadow-md hover:shadow-xl transition text-left"
              >
                <button
                  onClick={() => handleDeleteDrawing(drawing.id)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition active:scale-95 opacity-90 sm:opacity-0 group-hover:opacity-100"
                  title="Çizimi Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 mb-2.5">
                  <img
                    src={drawing.imageUrl}
                    alt="Sanat Eseri"
                    className="w-full h-full object-contain bg-white"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700 pt-1">
                  <span className="font-extrabold text-rose-600 flex items-center gap-1">
                    🎨 {drawing.drawnBy}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    📅 {drawing.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
