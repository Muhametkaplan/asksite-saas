'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, Trash2, Eraser, Sparkles, RefreshCw, Circle } from 'lucide-react';
import {
  sendCanvasStroke,
  subscribeToLiveCanvas,
  clearLiveCanvas,
  subscribeToPartnerPresence,
  CanvasStrokeData,
} from '@/lib/couples';

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

  useEffect(() => {
    const storedAuth = typeof window !== 'undefined'
      ? sessionStorage.getItem(`asksite_auth_${slug}`) || localStorage.getItem(`asksite_auth_${slug}`)
      : null;
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.role) setCurrentRole(parsed.role);
      } catch {}
    }

    // Subscribe to online presence
    const unsubPresence = subscribeToPartnerPresence(slug, (data) => {
      setPresence(data || {});
    });

    // Subscribe to live canvas strokes in real-time
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

    // Draw locally on canvas for zero latency
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

        {/* Thickness & Clear */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={2}
            max={14}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            title="Çizgi Kalınlığı"
          />
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition active:scale-95"
            title="Tuvali Sıfırla"
          >
            <Trash2 className="h-3.5 w-3.5" /> Temizle
          </button>
        </div>
      </div>
    </div>
  );
}
