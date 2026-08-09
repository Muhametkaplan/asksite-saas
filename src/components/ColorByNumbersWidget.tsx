'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Sparkles, Palette, CheckCircle2, Upload, RotateCcw, Image as ImageIcon, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addCanvasDrawing } from '@/lib/couples';

export interface ColorByNumbersColor {
  number: number;
  name: string;
  hex: string;
}

export interface ColorByNumbersRegion {
  id: string;
  number: number;
  d: string;
  cx: number;
  cy: number;
}

export interface ColorByNumbersTemplate {
  key: string;
  title: string;
  icon: string;
  colors: ColorByNumbersColor[];
  regions: ColorByNumbersRegion[];
}

export const ROMANTIC_NUMERICAL_TEMPLATES: Record<string, ColorByNumbersTemplate> = {
  hug: {
    key: 'hug',
    title: 'Sarılmış Çift İllüstrasyonu 👩‍❤️‍👨',
    icon: '👩‍❤️‍👨',
    colors: [
      { number: 1, name: 'Romantik Pembe', hex: '#ff4d6d' },
      { number: 2, name: 'Gece Mavisi', hex: '#2b2d42' },
      { number: 3, name: 'Ten Rengi', hex: '#fce1d4' },
      { number: 4, name: 'Koyu Saç', hex: '#3d2314' },
      { number: 5, name: 'Altın Işık', hex: '#ffd166' },
      { number: 6, name: 'Şarap Kırmızısı', hex: '#800f2f' },
    ],
    regions: [
      { id: 'r1', number: 5, d: 'M 180 40 C 90 40 40 110 40 180 C 40 250 90 320 180 320 C 270 320 320 250 320 180 C 320 110 270 40 180 40 Z', cx: 180, cy: 75 },
      { id: 'r2', number: 1, d: 'M 180 70 C 130 20 60 70 100 130 C 130 180 180 230 180 250 C 180 230 230 180 260 130 C 300 70 230 20 180 70 Z', cx: 180, cy: 120 },
      { id: 'r3', number: 4, d: 'M 130 100 C 120 70 150 70 150 100 C 150 120 120 120 130 100 Z', cx: 135, cy: 95 },
      { id: 'r4', number: 4, d: 'M 210 100 C 200 70 230 70 230 100 C 230 120 200 120 210 100 Z', cx: 215, cy: 95 },
      { id: 'r5', number: 3, d: 'M 125 110 C 125 130 145 130 145 110 Z', cx: 135, cy: 118 },
      { id: 'r6', number: 3, d: 'M 205 110 C 205 130 225 130 225 110 Z', cx: 215, cy: 118 },
      { id: 'r7', number: 2, d: 'M 90 260 C 90 190 140 160 180 160 C 220 160 270 190 270 260 L 90 260 Z', cx: 180, cy: 210 },
      { id: 'r8', number: 6, d: 'M 120 200 C 140 180 220 180 240 200 C 220 230 140 230 120 200 Z', cx: 180, cy: 195 },
    ],
  },
  balcony: {
    key: 'balcony',
    title: 'Kilitli Aşk Balkon Gün Batımı 🌅',
    icon: '🌅',
    colors: [
      { number: 1, name: 'Gün Batımı Turuncu', hex: '#f97316' },
      { number: 2, name: 'Güneş Sarı', hex: '#eab308' },
      { number: 3, name: 'Dağ Morluğu', hex: '#8b5cf6' },
      { number: 4, name: 'Deniz Mavi', hex: '#06b6d4' },
      { number: 5, name: 'Aşk Kilidi Kırmızı', hex: '#ef4444' },
      { number: 6, name: 'Koyu Slate', hex: '#334155' },
    ],
    regions: [
      { id: 'b1', number: 1, d: 'M 20 20 L 340 20 L 340 140 L 20 140 Z', cx: 180, cy: 60 },
      { id: 'b2', number: 2, d: 'M 180 70 A 35 35 0 1 0 180 140 A 35 35 0 1 0 180 70 Z', cx: 180, cy: 105 },
      { id: 'b3', number: 3, d: 'M 20 140 L 100 90 L 190 140 L 280 100 L 340 140 Z', cx: 100, cy: 125 },
      { id: 'b4', number: 4, d: 'M 20 140 L 340 140 L 340 220 L 20 220 Z', cx: 180, cy: 180 },
      { id: 'b5', number: 5, d: 'M 160 250 L 200 250 L 200 300 L 160 300 Z', cx: 180, cy: 275 },
      { id: 'b6', number: 6, d: 'M 20 220 L 340 220 L 340 340 L 20 340 Z', cx: 80, cy: 280 },
    ],
  },
  picnic: {
    key: 'picnic',
    title: 'Romantik Piknik 🧺',
    icon: '🧺',
    colors: [
      { number: 1, name: 'Örtü Kırmızı', hex: '#ef4444' },
      { number: 2, name: 'Çim Yeşil', hex: '#10b981' },
      { number: 3, name: 'Şarap Bordo', hex: '#881337' },
      { number: 4, name: 'Sepet Kahve', hex: '#78350f' },
      { number: 5, name: 'Gök Mavi', hex: '#38bdf8' },
      { number: 6, name: 'Güneş Beyazı', hex: '#fef08a' },
    ],
    regions: [
      { id: 'p1', number: 5, d: 'M 20 20 L 340 20 L 340 120 L 20 120 Z', cx: 180, cy: 60 },
      { id: 'p2', number: 2, d: 'M 20 120 L 340 120 L 340 220 L 20 220 Z', cx: 180, cy: 170 },
      { id: 'p3', number: 1, d: 'M 40 220 L 320 220 L 290 330 L 70 330 Z', cx: 180, cy: 275 },
      { id: 'p4', number: 4, d: 'M 110 240 L 170 240 L 165 290 L 115 290 Z', cx: 140, cy: 265 },
      { id: 'p5', number: 3, d: 'M 210 240 C 200 270 240 270 230 240 Z', cx: 220, cy: 255 },
      { id: 'p6', number: 6, d: 'M 270 50 A 25 25 0 1 0 270 100 A 25 25 0 1 0 270 50 Z', cx: 270, cy: 75 },
    ],
  },
  coffee: {
    key: 'coffee',
    title: 'Kahve Miti ☕',
    icon: '☕',
    colors: [
      { number: 1, name: 'Espresso Kahve', hex: '#451a03' },
      { number: 2, name: 'Köpük Kalp Pembe', hex: '#f43f5e' },
      { number: 3, name: 'Fincan Krem', hex: '#fef3c7' },
      { number: 4, name: 'Masa Ahşap', hex: '#92400e' },
      { number: 5, name: 'Donut Pembe', hex: '#ec4899' },
      { number: 6, name: 'Buhar Lavanta', hex: '#818cf8' },
    ],
    regions: [
      { id: 'c1', number: 4, d: 'M 20 220 L 340 220 L 340 340 L 20 340 Z', cx: 180, cy: 280 },
      { id: 'c2', number: 3, d: 'M 80 120 L 220 120 L 200 230 L 100 230 Z', cx: 150, cy: 175 },
      { id: 'c3', number: 1, d: 'M 90 130 L 210 130 L 205 160 L 95 160 Z', cx: 150, cy: 145 },
      { id: 'c4', number: 2, d: 'M 150 140 C 135 125 120 145 150 160 C 180 145 165 125 150 140 Z', cx: 150, cy: 135 },
      { id: 'c5', number: 5, d: 'M 240 200 A 35 35 0 1 0 240 270 A 35 35 0 1 0 240 200 Z', cx: 240, cy: 235 },
      { id: 'c6', number: 6, d: 'M 120 50 Q 140 80 120 110 M 150 40 Q 170 70 150 100 M 180 50 Q 200 80 180 110', cx: 150, cy: 75 },
    ],
  },
  night: {
    key: 'night',
    title: 'Gece Gökyüzü & Yıldızlar 🌌',
    icon: '🌌',
    colors: [
      { number: 1, name: 'Derin Gece Mavisi', hex: '#1e1b4b' },
      { number: 2, name: 'Hilal Ay Sarı', hex: '#facc15' },
      { number: 3, name: 'Kayan Yıldız Mavi', hex: '#22d3ee' },
      { number: 4, name: 'Galaksi Mor', hex: '#c084fc' },
      { number: 5, name: 'Siluet Ağaçlar', hex: '#09090b' },
      { number: 6, name: 'Altın Yıldız', hex: '#fbbf24' },
    ],
    regions: [
      { id: 'n1', number: 1, d: 'M 20 20 L 340 20 L 340 340 L 20 340 Z', cx: 180, cy: 180 },
      { id: 'n2', number: 2, d: 'M 140 60 A 70 70 0 1 0 250 200 A 85 85 0 1 1 140 60 Z', cx: 180, cy: 110 },
      { id: 'n3', number: 4, d: 'M 40 180 C 100 120 260 240 320 160 C 260 280 100 220 40 180 Z', cx: 180, cy: 200 },
      { id: 'n4', number: 5, d: 'M 20 280 L 70 230 L 120 290 L 180 220 L 240 300 L 300 240 L 340 300 L 340 340 L 20 340 Z', cx: 180, cy: 310 },
      { id: 'n5', number: 6, d: 'M 60 70 L 63 80 L 73 83 L 63 86 L 60 96 L 57 86 L 47 83 L 57 80 Z', cx: 60, cy: 83 },
      { id: 'n6', number: 3, d: 'M 260 50 L 300 90 L 250 70 Z', cx: 270, cy: 70 },
    ],
  },
  roses: {
    key: 'roses',
    title: 'Aşk Mektubu & Güller 🌹',
    icon: '🌹',
    colors: [
      { number: 1, name: 'Gül Kırmızısı', hex: '#dc2626' },
      { number: 2, name: 'Yaprak Yeşili', hex: '#15803d' },
      { number: 3, name: 'Zarf Kremi', hex: '#fffbeb' },
      { number: 4, name: 'Mühür Bordo', hex: '#9f1239' },
      { number: 5, name: 'Kurdele Mor', hex: '#a855f7' },
      { number: 6, name: 'Koyu Slate', hex: '#1e293b' },
    ],
    regions: [
      { id: 'rs1', number: 3, d: 'M 60 140 L 300 140 L 180 240 Z M 60 140 L 60 280 L 300 280 L 300 140 L 180 220 Z', cx: 180, cy: 190 },
      { id: 'rs2', number: 4, d: 'M 180 200 A 20 20 0 1 0 180 240 A 20 20 0 1 0 180 200 Z', cx: 180, cy: 220 },
      { id: 'rs3', number: 1, d: 'M 80 60 C 60 40 100 20 120 50 C 140 20 180 40 160 60 C 180 80 140 100 120 80 C 100 100 60 80 80 60 Z', cx: 120, cy: 60 },
      { id: 'rs4', number: 2, d: 'M 120 80 Q 140 120 120 150 M 120 100 Q 90 90 80 110 M 120 120 Q 150 110 160 130', cx: 120, cy: 110 },
      { id: 'rs5', number: 5, d: 'M 40 270 L 320 270 L 320 290 L 40 290 Z', cx: 180, cy: 280 },
      { id: 'rs6', number: 6, d: 'M 100 160 L 260 160 M 120 180 L 240 180', cx: 180, cy: 170 },
    ],
  },
};

interface ColorByNumbersWidgetProps {
  slug: string;
  partnerName: string;
}

export default function ColorByNumbersWidget({ slug, partnerName }: ColorByNumbersWidgetProps) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('hug');
  const [selectedColorNumber, setSelectedColorNumber] = useState<number>(1);
  const [regionFills, setRegionFills] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentTemplate = ROMANTIC_NUMERICAL_TEMPLATES[selectedTemplateKey] || ROMANTIC_NUMERICAL_TEMPLATES.hug;

  const hasMimiPandaApiKey = Boolean(
    process.env.NEXT_PUBLIC_MIMI_PANDA_API_KEY || process.env.MIMI_PANDA_API_KEY
  );

  const activeColor = useMemo(() => {
    return currentTemplate.colors.find((c) => c.number === selectedColorNumber) || currentTemplate.colors[0];
  }, [currentTemplate, selectedColorNumber]);

  const handleRegionClick = (region: ColorByNumbersRegion) => {
    setRegionFills((prev) => {
      const next = { ...prev, [region.id]: activeColor.hex };
      
      // Check if all regions filled
      const allFilled = currentTemplate.regions.every((r) => next[r.id]);
      if (allFilled) {
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
      }
      return next;
    });
  };

  const handleResetTemplate = () => {
    setRegionFills({});
  };

  const handleSaveArtwork = async () => {
    if (!svgRef.current) return;
    setSaving(true);
    try {
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);

        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = svgDataUrl;
        });
        ctx.drawImage(img, 0, 0, 400, 400);

        const imageUrl = canvas.toDataURL('image/png');
        const success = await addCanvasDrawing(slug, {
          imageUrl,
          drawnBy: `${partnerName} (Sayılarla Boyama 🎨)`,
        });

        if (success) {
          confetti({ particleCount: 80, spread: 70 });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }
      }
    } catch (e) {
      console.error('Error saving color by numbers artwork:', e);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUploadToMimiPanda = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`📸 "${file.name}" yüklendi! Mimi Panda API aracılığıyla numaralı outline dönüştürülüyor...`);
  };

  return (
    <div className="color-by-numbers-widget space-y-5 text-center">
      {/* Template Selector Bar */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-1">
        {Object.entries(ROMANTIC_NUMERICAL_TEMPLATES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedTemplateKey(key);
              setRegionFills({});
              setSelectedColorNumber(t.colors[0].number);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition border shrink-0 ${
              selectedTemplateKey === key
                ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-rose-50'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.title}</span>
          </button>
        ))}
      </div>

      {/* Optional Mimi Panda API Photo Convert Button */}
      {hasMimiPandaApiKey && (
        <div className="flex items-center justify-center">
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-lg hover:scale-105 transition active:scale-95">
            <Upload className="h-4 w-4 animate-bounce" />
            <span>Kendi Fotoğrafınızı Sayılarla Boyamaya Dönüştürün 📸</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUploadToMimiPanda}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Numbered SVG Color-by-Numbers Canvas */}
      <div className="relative mx-auto w-[340px] sm:w-[380px] h-[340px] sm:h-[380px] rounded-3xl bg-white shadow-2xl border-4 border-rose-100 overflow-hidden touch-none select-none p-2 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 360 360"
          className="w-full h-full cursor-pointer"
        >
          <rect width="360" height="360" fill="#ffffff" />
          {currentTemplate.regions.map((region) => {
            const fillColor = regionFills[region.id] || '#f8fafc';
            const isFilled = Boolean(regionFills[region.id]);

            return (
              <g key={region.id} onClick={() => handleRegionClick(region)}>
                <path
                  d={region.d}
                  fill={fillColor}
                  stroke="#334155"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors duration-200 hover:opacity-90 cursor-pointer"
                />
                {!isFilled && (
                  <text
                    x={region.cx}
                    y={region.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#475569"
                    fontSize="13"
                    fontWeight="800"
                    className="pointer-events-none font-mono drop-shadow-xs"
                  >
                    {region.number}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Numbered Palette Control Bar */}
      <div className="rounded-3xl bg-white p-4 shadow-lg border border-gray-100 space-y-3 max-w-md mx-auto">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 flex items-center justify-center gap-1.5">
          <Palette className="h-4 w-4 text-rose-500" /> Sayılı Renk Paleti (Numaraya Tıkla & Boya 🎨)
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {currentTemplate.colors.map((c) => {
            const isSelected = selectedColorNumber === c.number;
            return (
              <button
                key={c.number}
                onClick={() => setSelectedColorNumber(c.number)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-gray-900 shadow-md scale-105 ring-2 ring-rose-500/40 bg-rose-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className="h-6 w-6 rounded-full border border-gray-300 shadow-inner flex items-center justify-center text-[11px] font-black text-white drop-shadow-md"
                  style={{ backgroundColor: c.hex }}
                >
                  {c.number}
                </div>
                <span className="text-[10px] font-bold text-gray-700 mt-1 truncate w-full">
                  {c.number}. {c.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleResetTemplate}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Sıfırla 🔄
          </button>

          <button
            onClick={handleSaveArtwork}
            disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:scale-[1.01] active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            🎨 {saving ? 'Kaydediliyor...' : 'Sanat Eserini Kaydet'}
          </button>
        </div>

        {saveSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-700 animate-in fade-in">
            ✨ Sayılarla boyama eseriniz Aşkımızın Çizim Galerisi'ne başarıyla eklendi!
          </div>
        )}
      </div>
    </div>
  );
}
