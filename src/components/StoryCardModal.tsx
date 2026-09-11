'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Download,
  Share2,
  Heart,
  Music,
  MapPin,
  Camera,
  Brain,
  Lock,
  X,
  Check,
  Calendar,
  Flame,
  Crown,
} from 'lucide-react';
import { CoupleConfig } from '@/types/couple';

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CoupleConfig;
  isPremium?: boolean;
}

type TemplateType = 'timer' | 'spotify' | 'polaroid' | 'quiz' | 'map';

export default function StoryCardModal({
  isOpen,
  onClose,
  config,
  isPremium = false,
}: StoryCardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('timer');
  const [exporting, setExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [customQuote, setCustomQuote] = useState(
    config.subtitle || 'Seninle geçen her saniye bir ömre bedel ❤️'
  );

  const qrRef = useRef<SVGSVGElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Time elapsed calculation
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    if (!config.start_date) return;
    const start = new Date(config.start_date).getTime();
    const updateTime = () => {
      const diff = Math.max(0, Date.now() - start);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setTimeElapsed({ days, hours, minutes });
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [config.start_date]);

  if (!isOpen) return null;

  // asksite.com.tr direct QR url
  const brandingQrUrl = 'https://www.asksite.com.tr';

  const partner1 = config.partner1_name || 'Partner 1';
  const partner2 = config.partner2_name || 'Partner 2';
  const startDateStr = config.start_date
    ? new Date(config.start_date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Bilinmeyen Tarih';

  // Number of memories or markers for map
  const memoryCount = (config.memories || []).length || 5;

  // Render 1080x1920 HD Canvas and export
  const handleExport = async (action: 'download' | 'share') => {
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context could not be created');

      // 1. Background rendering based on template
      if (selectedTemplate === 'timer') {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#4c0519');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Decorative romantic orbs
        ctx.save();
        ctx.filter = 'blur(120px)';
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.beginPath();
        ctx.arc(300, 400, 260, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.beginPath();
        ctx.arc(800, 1200, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Card Container
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        roundRect(ctx, 90, 220, 900, 1380, 64);
        ctx.fill();
        ctx.stroke();

        // Badge
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        roundRect(ctx, 360, 290, 360, 70, 35);
        ctx.fill();
        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ AŞK HİKAYEMİZ ✨', 540, 338);

        // Couple Names
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 470);

        // Subtitle
        ctx.fillStyle = '#f43f5e';
        ctx.font = '600 32px sans-serif';
        ctx.fillText(`“${customQuote}”`, 540, 540);

        // Big Days Counter
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        roundRect(ctx, 160, 620, 760, 360, 48);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 130px sans-serif';
        ctx.fillText(`${timeElapsed.days}`, 540, 770);

        ctx.fillStyle = '#fbcfe8';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('GÜNDÜR BİRLİKTEYİZ ❤️', 540, 840);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '30px sans-serif';
        ctx.fillText(
          `${timeElapsed.hours} Saat • ${timeElapsed.minutes} Dakika`,
          540,
          910
        );

        // Start Date Badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        roundRect(ctx, 240, 1030, 600, 80, 40);
        ctx.fill();
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(`📅 Başlangıç: ${startDateStr}`, 540, 1082);

        // Draw QR Code
        await drawQrCodeToCanvas(ctx, 440, 1170, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('Hikayemizi Keşfetmek İçin Tara 📱', 540, 1430);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText('asksite.com.tr', 540, 1480);
      } else if (selectedTemplate === 'spotify') {
        // Spotify Dark Theme
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, 1080, 1920);

        // Ambient Spotify Green / Purple Glow
        ctx.save();
        ctx.filter = 'blur(140px)';
        ctx.fillStyle = 'rgba(29, 185, 84, 0.25)';
        ctx.beginPath();
        ctx.arc(300, 500, 300, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
        ctx.beginPath();
        ctx.arc(800, 1100, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Card frame
        ctx.fillStyle = '#181818';
        ctx.strokeStyle = '#282828';
        ctx.lineWidth = 4;
        roundRect(ctx, 90, 180, 900, 1440, 56);
        ctx.fill();
        ctx.stroke();

        // Spotify Logo Bar
        ctx.fillStyle = '#1db954';
        ctx.font = '900 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('● Spotify Aşk Çaları', 540, 260);

        // Album Art Mockup
        ctx.fillStyle = '#282828';
        roundRect(ctx, 240, 320, 600, 600, 40);
        ctx.fill();

        // Heart Inside Album Art
        ctx.fillStyle = '#f43f5e';
        ctx.font = '160px sans-serif';
        ctx.fillText('❤️', 540, 680);

        // Song Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 1000);

        // Artist / Subtitle
        ctx.fillStyle = '#b3b3b3';
        ctx.font = '34px sans-serif';
        ctx.fillText('Bizim Aşk Şarkımız • Özel Parça', 540, 1060);

        // Progress Bar
        ctx.fillStyle = '#404040';
        roundRect(ctx, 190, 1130, 700, 16, 8);
        ctx.fill();

        ctx.fillStyle = '#1db954';
        roundRect(ctx, 190, 1130, 480, 16, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(670, 1138, 14, 0, Math.PI * 2);
        ctx.fill();

        // Timestamps
        ctx.fillStyle = '#a7a7a7';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('02:14', 190, 1180);
        ctx.textAlign = 'right';
        ctx.fillText('03:45', 890, 1180);
        ctx.textAlign = 'center';

        // Play Controls Mock
        ctx.fillStyle = '#ffffff';
        ctx.font = '50px sans-serif';
        ctx.fillText('⏮   ▶   ⏭', 540, 1260);

        // QR Code & asksite.com.tr
        await drawQrCodeToCanvas(ctx, 450, 1330, 180);

        ctx.fillStyle = '#1db954';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('asksite.com.tr 🔗', 540, 1560);
      } else if (selectedTemplate === 'polaroid') {
        // Vintage warm paper background
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, '#fef2f2');
        grad.addColorStop(0.5, '#fce7f3');
        grad.addColorStop(1, '#fff1f2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Polaroid Frame
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
        roundRect(ctx, 120, 240, 840, 1280, 30);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Photo Area inside Polaroid
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, 170, 290, 740, 800, 20);
        ctx.fill();

        // Photo Art & Emoji
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 680);

        ctx.font = '120px sans-serif';
        ctx.fillText('📸 ❤️', 540, 820);

        // Handwritten Note on Polaroid bottom
        ctx.fillStyle = '#1e1b4b';
        ctx.font = 'italic bold 44px cursive, sans-serif';
        ctx.fillText(`“${customQuote}”`, 540, 1170);

        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(`${startDateStr} • Sonsuza Dek`, 540, 1240);

        // QR Code
        await drawQrCodeToCanvas(ctx, 455, 1290, 170);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('asksite.com.tr', 540, 1495);
      } else if (selectedTemplate === 'quiz') {
        // Romantic Violet/Pink gradient
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, '#3b0764');
        grad.addColorStop(0.5, '#701a75');
        grad.addColorStop(1, '#18181b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Badge Container
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
        ctx.lineWidth = 4;
        roundRect(ctx, 100, 220, 880, 1380, 60);
        ctx.fill();
        ctx.stroke();

        // Header
        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 AŞK UYUMU TEST RAPORU', 540, 320);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px serif';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 420);

        // Big Match Circle
        ctx.beginPath();
        ctx.arc(540, 680, 180, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
        ctx.fill();
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#ec4899';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 110px sans-serif';
        ctx.fillText('%98', 540, 715);

        ctx.fillStyle = '#fbcfe8';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('MÜKEMMEL UYUM', 540, 775);

        // Score Cards
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        roundRect(ctx, 160, 930, 360, 160, 30);
        roundRect(ctx, 560, 930, 360, 160, 30);
        ctx.fill();

        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(partner1, 340, 990);
        ctx.fillText(partner2, 740, 990);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('100 Puan', 340, 1050);
        ctx.fillText('98 Puan', 740, 1050);

        // Verdict Badge
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        roundRect(ctx, 280, 1140, 520, 70, 35);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('✓ Ruh İkizi Onaylandı 💍', 540, 1186);

        // QR Code
        await drawQrCodeToCanvas(ctx, 450, 1260, 180);

        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('asksite.com.tr 🔗', 540, 1490);
      } else if (selectedTemplate === 'map') {
        // Map Template (VIP)
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, '#0c4a6e');
        grad.addColorStop(0.5, '#042f2e');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Card Container
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 4;
        roundRect(ctx, 90, 220, 900, 1380, 60);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🗺️ BİZİM AŞK HARİTAMIZ', 540, 320);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px serif';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 420);

        // Map Visual Mock
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        roundRect(ctx, 160, 500, 760, 540, 36);
        ctx.fill();

        // World/Heart pins mock
        ctx.font = '100px sans-serif';
        ctx.fillText('📍 ❤️ 📍', 540, 740);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(`${memoryCount} Özel Anı Noktası Keşfedildi`, 540, 840);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '28px sans-serif';
        ctx.fillText('Adım Adım Gezdiğimiz Tüm Yollar', 540, 900);

        // Quote
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'italic 34px sans-serif';
        ctx.fillText(`“${customQuote}”`, 540, 1140);

        // QR Code
        await drawQrCodeToCanvas(ctx, 440, 1220, 200);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('asksite.com.tr 🔗', 540, 1475);
      }

      // Footer branding on all templates
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AskSite SaaS • Romantik Çift Web Siteleri', 540, 1850);

      // 2. Export / Share
      if (action === 'share' && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            triggerDownload(canvas);
            setExporting(false);
            return;
          }
          const file = new File([blob], `${config.slug}-story.png`, {
            type: 'image/png',
          });
          try {
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `${partner1} & ${partner2} Aşk Hikayemiz ❤️`,
                text: `${partner1} & ${partner2} aşk sayfamız! Sen de yap: https://www.asksite.com.tr`,
              });
            } else {
              triggerDownload(canvas);
            }
          } catch (e) {
            triggerDownload(canvas);
          } finally {
            setExporting(false);
          }
        }, 'image/png');
      } else {
        triggerDownload(canvas);
        setExporting(false);
      }
    } catch (err) {
      console.error('Story export error:', err);
      setExporting(false);
    }
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `${config.slug}-instagram-story.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Helper to draw QR code onto canvas
  const drawQrCodeToCanvas = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!qrRef.current) {
        resolve();
        return;
      }
      const svgElement = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        // White rounded background for QR code
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, x - 14, y - 14, size + 28, size + 28, 24);
        ctx.fill();
        ctx.drawImage(img, x, y, size, size);
        resolve();
      };
      img.onerror = () => resolve();
      img.src =
        'data:image/svg+xml;base64,' +
        btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  // Helper for drawing rounded rectangles on canvas
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const templates: {
    id: TemplateType;
    label: string;
    icon: any;
    desc: string;
    isVipOnly?: boolean;
  }[] = [
    {
      id: 'timer',
      label: 'Aşk Sayacı',
      icon: Calendar,
      desc: 'Birlikte geçen gün & saat sayacı',
    },
    {
      id: 'spotify',
      label: 'Spotify Aşk Çaları',
      icon: Music,
      desc: 'Şarkınız & Spotify kartı görünümü',
    },
    {
      id: 'polaroid',
      label: 'Nostaljik Polaroid',
      icon: Camera,
      desc: 'El yazısı notlu retro polaroid',
    },
    {
      id: 'quiz',
      label: 'Aşk Uyumu',
      icon: Brain,
      desc: 'Aşk testi skoru & uyum yüzdesi',
    },
    {
      id: 'map',
      label: 'Aşk Haritası',
      icon: MapPin,
      desc: 'Keşfedilen rotalar (VIP Özel)',
      isVipOnly: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Hidden QR Code source used for Canvas 1080x1920 export */}
      <div className="hidden">
        <QRCodeSVG
          ref={qrRef}
          value={brandingQrUrl}
          size={300}
          fgColor="#e11d48"
          bgColor="#ffffff"
          level="H"
          includeMargin={true}
        />
      </div>

      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 text-white text-left max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Instagram Story Kartı Oluşturucu 📸
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              9:16 boyutunda ultra HD Instagram & WhatsApp hikaye kartınızı tek tıkla oluşturup paylaşın.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Layout (Templates on Left, Live 9:16 Preview on Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-1">
          {/* Left Controls & Template Select (7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                Şablon Seçimi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {templates.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = selectedTemplate === tmpl.id;
                  const isLocked = tmpl.isVipOnly && !isPremium;

                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplate(tmpl.id);
                      }}
                      className={`relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-rose-500/20 to-purple-600/20 border-rose-500 shadow-md ring-2 ring-rose-500/30'
                          : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isLocked && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-purple-950/90 border border-purple-500/50 px-1.5 py-0.5 text-[9px] font-black text-purple-300">
                          <Lock className="h-2.5 w-2.5" /> VIP
                        </span>
                      )}
                      <Icon
                        className={`h-5 w-5 mb-2 ${
                          isSelected ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-white block">
                        {tmpl.label}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {tmpl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Quote / Romantic Note */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Kart Romantik Notu / Sözü
              </label>
              <input
                type="text"
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                maxLength={90}
                placeholder="Seninle geçen her an bir mucize..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* VIP Restriction Notice if Map is selected by non-premium */}
            {selectedTemplate === 'map' && !isPremium && (
              <div className="rounded-2xl bg-purple-950/40 border border-purple-800/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Crown className="h-4 w-4 text-amber-400" /> Premium VIP Özel Şablon
                </div>
                <p className="text-[11px] text-slate-300">
                  Aşk Haritası şablonu, birlikte seyahat ettiğiniz yerleri ve rotaları hikayede paylaşmak için Premium VIP pakete özeldir.
                </p>
                <a
                  href="/checkout?plan=yearly_premium"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-xl hover:opacity-90 transition"
                >
                  ⭐ VIP&apos;ye Yükselt (₺150 Farkla)
                </a>
              </div>
            )}

            {/* QR Code and Branding Info Box */}
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-3.5 flex items-center gap-3">
              <div className="p-1 bg-white rounded-xl shrink-0">
                <QRCodeSVG
                  value={brandingQrUrl}
                  size={50}
                  fgColor="#e11d48"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div className="font-bold text-rose-400">
                  🔗 asksite.com.tr Organik QR Kodu
                </div>
                <p className="text-slate-400">
                  Hikayeyi gören arkadaşlarınız bu QR kodu tarayarak doğrudan AskSite&apos;a ulaşır ve kendi çift sitelerini oluşturabilir.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleExport('share')}
                disabled={exporting || (selectedTemplate === 'map' && !isPremium)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-rose-500/25 hover:opacity-95 active:scale-98 transition disabled:opacity-40 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                {exporting ? 'Oluşturuluyor...' : 'Hikayede Paylaş / Menüyü Aç'}
              </button>

              <button
                onClick={() => handleExport('download')}
                disabled={exporting || (selectedTemplate === 'map' && !isPremium)}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40 cursor-pointer"
                title="Yüksek Çözünürlüklü PNG İndir"
              >
                <Download className="h-4 w-4" /> PNG İndir
              </button>
            </div>

            {copiedSuccess && (
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 animate-in fade-in">
                <Check className="h-4 w-4" /> Hikaye görseliniz başarıyla indirildi!
              </div>
            )}
          </div>

          {/* Right Live 9:16 Preview (5 Cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" /> Canlı 9:16 Hikaye Önizlemesi
            </div>

            {/* Simulated 9:16 Mobile Story Screen */}
            <div
              ref={previewRef}
              className={`relative w-[240px] h-[426px] rounded-3xl p-4 flex flex-col justify-between items-center text-center shadow-2xl border border-slate-700/80 overflow-hidden select-none transition-all duration-300 ${
                selectedTemplate === 'timer'
                  ? 'bg-gradient-to-b from-indigo-950 via-rose-950 to-slate-950 text-white'
                  : selectedTemplate === 'spotify'
                  ? 'bg-[#121212] text-white border-zinc-800'
                  : selectedTemplate === 'polaroid'
                  ? 'bg-rose-50 text-slate-900 border-rose-200'
                  : selectedTemplate === 'quiz'
                  ? 'bg-gradient-to-b from-purple-950 via-fuchsia-950 to-zinc-950 text-white'
                  : 'bg-gradient-to-b from-sky-950 via-teal-950 to-slate-950 text-white'
              }`}
            >
              {/* Template Specific Preview Content */}
              {selectedTemplate === 'timer' && (
                <>
                  <div className="mt-2 space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-[9px] font-extrabold text-rose-300 border border-rose-500/30">
                      AŞK HİKAYEMİZ
                    </span>
                    <h3 className="font-serif text-lg font-black tracking-tight text-white">
                      {partner1} & {partner2}
                    </h3>
                    <p className="text-[9px] text-rose-300 line-clamp-1 italic">
                      “{customQuote}”
                    </p>
                  </div>

                  <div className="my-auto w-full rounded-2xl bg-white/5 border border-white/10 p-3 space-y-1">
                    <div className="text-4xl font-black text-white tracking-tighter">
                      {timeElapsed.days}
                    </div>
                    <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">
                      GÜNDÜR BİRLİKTEYİZ ❤️
                    </div>
                    <div className="text-[8px] text-slate-400">
                      {timeElapsed.hours}s {timeElapsed.minutes}d
                    </div>
                  </div>

                  <div className="space-y-1.5 pb-2">
                    <div className="mx-auto w-fit p-1.5 bg-white rounded-xl shadow-md">
                      <QRCodeSVG
                        value={brandingQrUrl}
                        size={52}
                        fgColor="#e11d48"
                        bgColor="#ffffff"
                        level="M"
                      />
                    </div>
                    <span className="text-[9px] font-black text-rose-400 block tracking-wider">
                      asksite.com.tr
                    </span>
                  </div>
                </>
              )}

              {selectedTemplate === 'spotify' && (
                <>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[#1db954] text-[10px] font-bold">
                    <Music className="h-3 w-3" /> Spotify Aşk Çaları
                  </div>

                  <div className="my-auto w-full space-y-2">
                    <div className="w-28 h-28 mx-auto rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl shadow-lg">
                      ❤️
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">
                        {partner1} & {partner2}
                      </div>
                      <div className="text-[9px] text-zinc-400">
                        Bizim Aşk Şarkımız
                      </div>
                    </div>
                    <div className="w-40 mx-auto h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-[#1db954]" />
                    </div>
                  </div>

                  <div className="space-y-1 pb-2">
                    <div className="mx-auto w-fit p-1.5 bg-white rounded-xl shadow-md">
                      <QRCodeSVG
                        value={brandingQrUrl}
                        size={48}
                        fgColor="#e11d48"
                        bgColor="#ffffff"
                        level="M"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-[#1db954] block">
                      asksite.com.tr
                    </span>
                  </div>
                </>
              )}

              {selectedTemplate === 'polaroid' && (
                <div className="h-full w-full flex flex-col justify-between bg-white rounded-2xl p-2.5 shadow-md text-slate-800">
                  <div className="w-full h-44 rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white p-2">
                    <span className="text-2xl mb-1">📸</span>
                    <span className="font-serif font-bold text-xs">
                      {partner1} & {partner2}
                    </span>
                  </div>

                  <div className="my-auto space-y-0.5">
                    <p className="text-[10px] italic font-semibold text-slate-700 line-clamp-2">
                      “{customQuote}”
                    </p>
                    <span className="text-[8px] text-rose-500 font-bold block">
                      {startDateStr}
                    </span>
                  </div>

                  <div className="space-y-1 pb-1">
                    <div className="mx-auto w-fit p-1 bg-rose-50 rounded-lg">
                      <QRCodeSVG
                        value={brandingQrUrl}
                        size={44}
                        fgColor="#e11d48"
                        bgColor="#fff1f2"
                        level="M"
                      />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 block">
                      asksite.com.tr
                    </span>
                  </div>
                </div>
              )}

              {selectedTemplate === 'quiz' && (
                <>
                  <div className="mt-2 space-y-0.5">
                    <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">
                      AŞK TESTİ SKORU
                    </span>
                    <h3 className="font-serif text-sm font-bold text-white">
                      {partner1} & {partner2}
                    </h3>
                  </div>

                  <div className="my-auto space-y-2">
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-pink-500 bg-pink-500/20 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white">%98</span>
                      <span className="text-[8px] font-bold text-pink-300">UYUM</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                      ✓ Ruh İkizi Onaylandı
                    </span>
                  </div>

                  <div className="space-y-1 pb-2">
                    <div className="mx-auto w-fit p-1.5 bg-white rounded-xl shadow-md">
                      <QRCodeSVG
                        value={brandingQrUrl}
                        size={48}
                        fgColor="#e11d48"
                        bgColor="#ffffff"
                        level="M"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-pink-400 block">
                      asksite.com.tr
                    </span>
                  </div>
                </>
              )}

              {selectedTemplate === 'map' && (
                <>
                  <div className="mt-2 space-y-0.5">
                    <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">
                      BİZİM AŞK HARİTAMIZ
                    </span>
                    <h3 className="font-serif text-sm font-bold text-white">
                      {partner1} & {partner2}
                    </h3>
                  </div>

                  <div className="my-auto w-full rounded-2xl bg-sky-950/60 border border-sky-500/30 p-3 space-y-1.5">
                    <div className="text-2xl">🗺️ 📍</div>
                    <div className="text-sm font-black text-sky-300">
                      {memoryCount} Anı Noktası
                    </div>
                    <p className="text-[9px] text-slate-300 italic line-clamp-2">
                      “{customQuote}”
                    </p>
                  </div>

                  <div className="space-y-1 pb-2">
                    <div className="mx-auto w-fit p-1.5 bg-white rounded-xl shadow-md">
                      <QRCodeSVG
                        value={brandingQrUrl}
                        size={48}
                        fgColor="#0284c7"
                        bgColor="#ffffff"
                        level="M"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-sky-400 block">
                      asksite.com.tr
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
