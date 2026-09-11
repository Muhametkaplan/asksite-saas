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
  Compass,
  Plane,
  Image as ImageIcon,
  Crown,
  Upload,
  Trash2,
} from 'lucide-react';
import { CoupleConfig, MapMarker } from '@/types/couple';
import { getMapMarkers } from '@/lib/couples';

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CoupleConfig;
  isPremium?: boolean;
}

type TemplateType = 'timer' | 'spotify' | 'polaroid' | 'quiz' | 'map';

const DEFAULT_VINTAGE_PHOTOS = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80', // Romantic sunset beach
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&auto=format&fit=crop&q=80', // Holding hands aesthetic
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80', // Couple hug warm tone
];

const DEFAULT_TURKEY_MARKERS: MapMarker[] = [
  { id: 'def-1', couple_id: 'default', lat: 41.0082, lng: 28.9784, title: 'İstanbul • İlk Buluşma' },
  { id: 'def-2', couple_id: 'default', lat: 39.9043, lng: 41.2679, title: 'Erzurum • Kış Tatilimiz' },
  { id: 'def-3', couple_id: 'default', lat: 41.0027, lng: 39.7168, title: 'Trabzon • Karadeniz Gezimiz' },
  { id: 'def-4', couple_id: 'default', lat: 41.6168, lng: 41.6367, title: 'Batum • Sınır Ötesi Turumuz' },
  { id: 'def-5', couple_id: 'default', lat: 37.0662, lng: 37.3833, title: 'Gaziantep • Romantik Akşam' },
];

function projectLatLngToTurkeyBox(
  lat: number,
  lng: number,
  boxW: number,
  boxH: number
) {
  // Longitude bounds for OSM zoom 5 tiles 18 & 19 (covers 22.5° to 45.0°)
  const u = (lng - 22.5) / 22.5;

  // Web Mercator Latitude calculation
  const latRad = (lat * Math.PI) / 180;
  const mercY = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;
  // In zoom 5, tile 11 to 12 normalized range is [11/32, 13/32] = 2/32
  const v = (mercY - (11 / 32)) / (2 / 32);

  // Total tile height in square projection is boxW
  const totalTileH = boxW;
  // Center Turkey vertically around v = 0.58
  const offsetY = (boxH / 2) - (0.58 * totalTileH);

  const px = u * boxW;
  const py = v * totalTileH + offsetY;

  return {
    px,
    py,
    xPercent: `${Math.max(4, Math.min(96, u * 100)).toFixed(2)}%`,
    yPercent: `${Math.max(4, Math.min(96, ((py / boxH) * 100))).toFixed(2)}%`,
  };
}

export default function StoryCardModal({
  isOpen,
  onClose,
  config,
  isPremium = false,
}: StoryCardModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('polaroid');
  const [exporting, setExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [customQuote, setCustomQuote] = useState(
    config.subtitle || 'Seninle geçen her an bir ömre bedel ❤️'
  );

  // Polaroid Custom Photo State
  const initialPhoto =
    config.memories?.find((m) => m.photo_url)?.photo_url ||
    DEFAULT_VINTAGE_PHOTOS[0];
  const [polaroidPhoto, setPolaroidPhoto] = useState<string>(initialPhoto);
  const [isTemporaryUploaded, setIsTemporaryUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Fotoğraf boyutu 15MB\'tan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPolaroidPhoto(reader.result);
        setIsTemporaryUploaded(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedPhoto = () => {
    setPolaroidPhoto(initialPhoto);
    setIsTemporaryUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    // Çıkınca anlık yüklenen fotoğraf silinir / temizlenir
    if (isTemporaryUploaded) {
      setPolaroidPhoto(initialPhoto);
      setIsTemporaryUploaded(false);
    }
    onClose();
  };

  // Map markers & settings for "Bizim Haritamız"
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapSubtitle, setMapSubtitle] = useState('Birlikte Keşfettiğimiz Unutulmaz Aşk Noktalarımız ❤️');

  useEffect(() => {
    if (!isOpen) return;
    const targetId = config.slug || config.id || 'demo';
    getMapMarkers(targetId)
      .then((data) => {
        if (data && data.length > 0) {
          setMarkers(data);
        } else {
          setMarkers(DEFAULT_TURKEY_MARKERS);
        }
      })
      .catch(() => {
        setMarkers(DEFAULT_TURKEY_MARKERS);
      });
  }, [isOpen, config.slug, config.id]);

  const qrRef = useRef<SVGSVGElement | null>(null);

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

  // Vintage 90s date stamp for photo corner (e.g. '24 09 12)
  const vintageDateStamp = config.start_date
    ? `'${new Date(config.start_date).getFullYear().toString().slice(-2)} ${(
        new Date(config.start_date).getMonth() + 1
      )
        .toString()
        .padStart(2, '0')} ${new Date(config.start_date)
        .getDate()
        .toString()
        .padStart(2, '0')}`
    : "'24 09 12";

  const memoryCount = (config.memories || []).length || 5;

  // Helper to load image for canvas
  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

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

        ctx.fillStyle = '#181818';
        ctx.strokeStyle = '#282828';
        ctx.lineWidth = 4;
        roundRect(ctx, 90, 180, 900, 1440, 56);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1db954';
        ctx.font = '900 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('● Spotify Aşk Çaları', 540, 260);

        ctx.fillStyle = '#282828';
        roundRect(ctx, 240, 320, 600, 600, 40);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.font = '160px sans-serif';
        ctx.fillText('❤️', 540, 680);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 1000);

        ctx.fillStyle = '#b3b3b3';
        ctx.font = '34px sans-serif';
        ctx.fillText('Bizim Aşk Şarkımız • Özel Parça', 540, 1060);

        ctx.fillStyle = '#404040';
        roundRect(ctx, 190, 1130, 700, 16, 8);
        ctx.fill();

        ctx.fillStyle = '#1db954';
        roundRect(ctx, 190, 1130, 480, 16, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(670, 1138, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#a7a7a7';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('02:14', 190, 1180);
        ctx.textAlign = 'right';
        ctx.fillText('03:45', 890, 1180);
        ctx.textAlign = 'center';

        ctx.fillStyle = '#ffffff';
        ctx.font = '50px sans-serif';
        ctx.fillText('⏮   ▶   ⏭', 540, 1260);

        await drawQrCodeToCanvas(ctx, 450, 1330, 180);

        ctx.fillStyle = '#1db954';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('asksite.com.tr 🔗', 540, 1560);
      } else if (selectedTemplate === 'polaroid') {
        // --- REALISTIC VINTAGE NOSTALGIC POLAROID ---
        // 1. Warm Antique Tabletop / Canvas Texture Background
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
        bgGrad.addColorStop(0, '#2e1c14');
        bgGrad.addColorStop(0.5, '#452b1e');
        bgGrad.addColorStop(1, '#1c100a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Warm vintage radial ambient vignette
        const radGlow = ctx.createRadialGradient(540, 900, 200, 540, 900, 900);
        radGlow.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
        radGlow.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = radGlow;
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Realistic Polaroid Body with Multi-layered Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetY = 30;
        ctx.fillStyle = '#fdfbf7'; // Warm photo paper
        roundRect(ctx, 110, 220, 860, 1340, 32);
        ctx.fill();
        ctx.restore();

        // 3. Tilted Washi Masking Tape at Top
        ctx.save();
        ctx.translate(540, 195);
        ctx.rotate(-0.04);
        ctx.fillStyle = 'rgba(245, 230, 200, 0.88)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, -140, -25, 280, 50, 8);
        ctx.fill();
        // Tape inner dashed fibers
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(-135, -20, 270, 40);
        ctx.restore();

        // 4. Photo Area inside Polaroid
        const photoX = 160;
        const photoY = 280;
        const photoW = 760;
        const photoH = 820;

        ctx.save();
        roundRect(ctx, photoX, photoY, photoW, photoH, 16);
        ctx.clip();

        // Draw custom or preset photo
        const loadedImg = await loadImage(polaroidPhoto);
        if (loadedImg) {
          // Object-fit cover draw
          const imgAspect = loadedImg.width / loadedImg.height;
          const boxAspect = photoW / photoH;
          let sWidth = loadedImg.width;
          let sHeight = loadedImg.height;
          let sx = 0;
          let sy = 0;

          if (imgAspect > boxAspect) {
            sWidth = loadedImg.height * boxAspect;
            sx = (loadedImg.width - sWidth) / 2;
          } else {
            sHeight = loadedImg.width / boxAspect;
            sy = (loadedImg.height - sHeight) / 2;
          }

          ctx.drawImage(loadedImg, sx, sy, sWidth, sHeight, photoX, photoY, photoW, photoH);

          // Warm vintage sepia & golden-hour overlay
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.fillRect(photoX, photoY, photoW, photoH);

          // Subtle photo vignette
          const photoVig = ctx.createRadialGradient(
            photoX + photoW / 2,
            photoY + photoH / 2,
            photoW / 3,
            photoX + photoW / 2,
            photoY + photoH / 2,
            photoW / 1.1
          );
          photoVig.addColorStop(0, 'transparent');
          photoVig.addColorStop(1, 'rgba(30, 20, 10, 0.45)');
          ctx.fillStyle = photoVig;
          ctx.fillRect(photoX, photoY, photoW, photoH);
        } else {
          // Elegant Fallback Silhouette Art
          const skyGrad = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
          skyGrad.addColorStop(0, '#f97316');
          skyGrad.addColorStop(0.5, '#ec4899');
          skyGrad.addColorStop(1, '#312e81');
          ctx.fillStyle = skyGrad;
          ctx.fillRect(photoX, photoY, photoW, photoH);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 54px serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${partner1} & ${partner2}`, photoX + photoW / 2, photoY + 360);

          ctx.font = '120px sans-serif';
          ctx.fillText('📸 ❤️', photoX + photoW / 2, photoY + 500);
        }

        // Vintage Light Leak Effect (diagonal soft orange ray)
        const flare = ctx.createLinearGradient(photoX, photoY, photoX + 300, photoY + 300);
        flare.addColorStop(0, 'rgba(255, 237, 213, 0.4)');
        flare.addColorStop(0.5, 'rgba(251, 146, 60, 0.2)');
        flare.addColorStop(1, 'transparent');
        ctx.fillStyle = flare;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        // 90s Orange Digital Film Camera Date Stamp (Bottom Right of Photo)
        ctx.font = '900 36px monospace, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = 'rgba(255, 136, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(vintageDateStamp, photoX + photoW - 30, photoY + photoH - 30);
        ctx.restore();

        // 5. Authentic Polaroid Caption & Handwriting
        ctx.fillStyle = '#1c1917';
        ctx.font = 'italic 700 48px cursive, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 1170);

        ctx.fillStyle = '#44403c';
        ctx.font = 'italic 500 34px cursive, sans-serif';
        ctx.fillText(`“${customQuote}”`, 540, 1230);

        // Vintage Postal Stamp Badge
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3;
        ctx.strokeRect(170, 1290, 240, 64);
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ AŞK POSTASI ★', 290, 1332);

        // Start Date Inscription
        ctx.fillStyle = '#78716c';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Tarih: ${startDateStr}`, 170, 1390);

        // Stamp-framed AskSite QR Code on the right
        await drawQrCodeToCanvas(ctx, 750, 1260, 150);

        ctx.fillStyle = '#e11d48';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('asksite.com.tr', 825, 1445);
      } else if (selectedTemplate === 'quiz') {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, '#3b0764');
        grad.addColorStop(0.5, '#701a75');
        grad.addColorStop(1, '#18181b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
        ctx.lineWidth = 4;
        roundRect(ctx, 100, 220, 880, 1380, 60);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 AŞK UYUMU TEST RAPORU', 540, 320);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px serif';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 420);

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

        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        roundRect(ctx, 280, 1140, 520, 70, 35);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('✓ Ruh İkizi Onaylandı 💍', 540, 1186);

        await drawQrCodeToCanvas(ctx, 450, 1260, 180);

        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('asksite.com.tr 🔗', 540, 1490);
      } else if (selectedTemplate === 'map') {
        // --- AUTHENTIC "BİZİM HARİTAMIZ" STORY CARD (VIP) ---
        // 1. Deep Romantic Midnight Plum Background
        const mapBg = ctx.createLinearGradient(0, 0, 1080, 1920);
        mapBg.addColorStop(0, '#1c0722');
        mapBg.addColorStop(0.4, '#2d0c3c');
        mapBg.addColorStop(0.8, '#1e1136');
        mapBg.addColorStop(1, '#0b0816');
        ctx.fillStyle = mapBg;
        ctx.fillRect(0, 0, 1080, 1920);

        // Ambient romantic glow
        ctx.save();
        ctx.filter = 'blur(120px)';
        ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
        ctx.beginPath();
        ctx.arc(300, 380, 260, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.beginPath();
        ctx.arc(800, 1100, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Story Header Badge
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        roundRect(ctx, 350, 150, 380, 64, 32);
        ctx.fill();
        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ BİZİM AŞK HARİTAMIZ ✨', 540, 194);

        // Couple Names
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${partner1} & ${partner2}`, 540, 280);

        // Subtitle Quote
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'italic 600 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`“${customQuote}”`, 540, 340);

        // 3. The Pure White "Bizim Haritamız" Card (Matching Website Widget)
        const cardX = 90;
        const cardY = 380;
        const cardW = 900;
        const cardH = 960;

        // Card Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetY = 18;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, cardX, cardY, cardW, cardH, 48);
        ctx.fill();
        ctx.restore();

        // Card Subtle Border
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.lineWidth = 3;
        roundRect(ctx, cardX, cardY, cardW, cardH, 48);
        ctx.stroke();

        // Card Header Title: "📍 Bizim Haritamız"
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📍 Bizim Haritamız', 540, cardY + 70);

        // Card Header Subtitle
        ctx.fillStyle = '#64748b';
        ctx.font = '500 24px sans-serif';
        ctx.fillText(
          mapSubtitle || 'Birlikte Keşfettiğimiz Unutulmaz Aşk Noktalarımız ❤️',
          540,
          cardY + 115
        );

        // 4. Map Box inside the card (OpenStreetMap Turkey Tiles)
        const mapBoxX = cardX + 30; // 120
        const mapBoxY = cardY + 140; // 520
        const mapBoxW = cardW - 60; // 840
        const mapBoxH = 600;

        ctx.save();
        roundRect(ctx, mapBoxX, mapBoxY, mapBoxW, mapBoxH, 28);
        ctx.clip(); // Clip map content inside rounded container

        // Fetch the 4 OpenStreetMap tiles covering Turkey at zoom 5
        const OSM_TILES = [
          'https://tile.openstreetmap.org/5/18/11.png',
          'https://tile.openstreetmap.org/5/19/11.png',
          'https://tile.openstreetmap.org/5/18/12.png',
          'https://tile.openstreetmap.org/5/19/12.png',
        ];

        const [tileTL, tileTR, tileBL, tileBR] = await Promise.all([
          loadImage(OSM_TILES[0]),
          loadImage(OSM_TILES[1]),
          loadImage(OSM_TILES[2]),
          loadImage(OSM_TILES[3]),
        ]);

        const tileW = mapBoxW / 2;
        const tileH = mapBoxW / 2;
        const tileOffsetY = (mapBoxH / 2) - (0.58 * mapBoxW);

        // Background color before tiles draw
        ctx.fillStyle = '#fff1f2';
        ctx.fillRect(mapBoxX, mapBoxY, mapBoxW, mapBoxH);

        if (tileTL && tileTR && tileBL && tileBR) {
          ctx.drawImage(tileTL, mapBoxX, mapBoxY + tileOffsetY, tileW, tileH);
          ctx.drawImage(tileTR, mapBoxX + tileW, mapBoxY + tileOffsetY, tileW, tileH);
          ctx.drawImage(tileBL, mapBoxX, mapBoxY + tileOffsetY + tileH, tileW, tileH);
          ctx.drawImage(tileBR, mapBoxX + tileW, mapBoxY + tileOffsetY + tileH, tileW, tileH);
        }

        // Draw Real Red Heart Pins on Couple's Coordinates
        const markersToRender = markers.length > 0 ? markers : DEFAULT_TURKEY_MARKERS;

        markersToRender.forEach((m) => {
          const { px, py } = projectLatLngToTurkeyBox(m.lat, m.lng, mapBoxW, mapBoxH);
          const markX = mapBoxX + px;
          const markY = mapBoxY + py;

          if (
            markX >= mapBoxX &&
            markX <= mapBoxX + mapBoxW &&
            markY >= mapBoxY &&
            markY <= mapBoxY + mapBoxH
          ) {
            ctx.save();
            ctx.shadowColor = 'rgba(225, 29, 72, 0.7)';
            ctx.shadowBlur = 12;
            ctx.font = '44px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤️', markX, markY);
            ctx.restore();
          }
        });

        ctx.restore(); // End map box clip

        // 5. Card Footer: Total Marker Count & Romantic Pill
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          `Toplam ${markersToRender.length} Aşk Noktası`,
          mapBoxX + 10,
          cardY + cardH - 50
        );

        // Right Pill Badge: "❤️ Sonsuz Rota"
        const pillW = 210;
        const pillH = 50;
        const pillX = mapBoxX + mapBoxW - pillW;
        const pillY = cardY + cardH - 76;

        ctx.fillStyle = '#ffe4e6';
        roundRect(ctx, pillX, pillY, pillW, pillH, 25);
        ctx.fill();

        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❤️ Sonsuz Rota', pillX + pillW / 2, pillY + 34);

        // 6. Bottom Story Info & QR Code
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        roundRect(ctx, 240, 1380, 600, 70, 35);
        ctx.fill();
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📅 Başlangıç: ${startDateStr} • Kalbimin İçi ❤️`, 540, 1424);

        await drawQrCodeToCanvas(ctx, 440, 1485, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Hikayemizi Keşfetmek İçin Tara 📱', 540, 1735);

        ctx.fillStyle = '#f43f5e';
        ctx.font = '900 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('asksite.com.tr', 540, 1785);
      }

      // Footer branding on all templates
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AskSite SaaS • Romantik Çift Web Siteleri', 540, 1870);

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
    link.download = `${config.slug}-${selectedTemplate}-story.png`;
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
      id: 'polaroid',
      label: 'Nostaljik Polaroid',
      icon: Camera,
      desc: 'El yazısı notlu retro polaroid',
    },
    {
      id: 'map',
      label: 'Aşk Haritası',
      icon: MapPin,
      desc: 'Bizim Haritamız (VIP Özel)',
      isVipOnly: true,
    },
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
      id: 'quiz',
      label: 'Aşk Uyumu',
      icon: Brain,
      desc: 'Aşk testi skoru & uyum yüzdesi',
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
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

      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 text-white text-left max-h-[94vh] flex flex-col">
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
            onClick={handleModalClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Layout (Templates & Controls on Left, Live 9:16 Preview on Right) */}
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

            {/* POLAROID CUSTOM CONTROLS (If Polaroid Selected) */}
            {selectedTemplate === 'polaroid' && (
              <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Camera className="h-4 w-4" /> Polaroid Fotoğrafı
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">
                    ⚡ Anlık kullanılır, çıkınca silinir
                  </span>
                </div>

                {/* Direct Upload Button (Cihazdan/Galeriden Fotoğraf Seç) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" /> Cihazdan / Galeriden Fotoğraf Yükle
                  </button>

                  {isTemporaryUploaded && (
                    <button
                      type="button"
                      onClick={handleRemoveUploadedPhoto}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900/80 border border-rose-500/50 hover:bg-rose-500/20 px-3 py-2.5 text-xs font-bold text-rose-300 transition active:scale-95 cursor-pointer"
                      title="Yüklenen geçici fotoğrafı kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" /> Kaldır
                    </button>
                  )}
                </div>

                {isTemporaryUploaded && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
                    <Check className="h-3.5 w-3.5" /> Fotoğrafınız anlık olarak yüklendi. Pencereyi kapattığınızda otomatik olarak silinecektir.
                  </div>
                )}

                {/* Alternative Quick Presets & Memories */}
                <div className="pt-1 border-t border-slate-700/60">
                  <span className="block text-[10px] font-bold text-slate-400 mb-1.5">
                    Veya Hazır Romantik Fotoğraflardan / Sitedeki Anılarınızdan Seçin:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {DEFAULT_VINTAGE_PHOTOS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPolaroidPhoto(url);
                          setIsTemporaryUploaded(false);
                        }}
                        className={`h-11 w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                          polaroidPhoto === url && !isTemporaryUploaded
                            ? 'border-rose-500 scale-105 shadow-md'
                            : 'border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt="Preset"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}

                    {(config.memories || [])
                      .filter((m) => m.photo_url)
                      .slice(0, 4)
                      .map((m, idx) => (
                        <button
                          key={`mem-${idx}`}
                          type="button"
                          onClick={() => {
                            setPolaroidPhoto(m.photo_url!);
                            setIsTemporaryUploaded(false);
                          }}
                          title={m.title}
                          className={`h-11 w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            polaroidPhoto === m.photo_url && !isTemporaryUploaded
                              ? 'border-rose-500 scale-105 shadow-md'
                              : 'border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={m.photo_url}
                            alt={m.title}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                  </div>
                </div>

                {/* Optional URL input */}
                <div>
                  <input
                    type="text"
                    value={isTemporaryUploaded ? '' : polaroidPhoto}
                    onChange={(e) => {
                      setPolaroidPhoto(e.target.value);
                      setIsTemporaryUploaded(false);
                    }}
                    placeholder="Veya web fotoğraf bağlantısı (URL) yapıştırın..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-750 px-3 py-2 text-[11px] text-slate-300 outline-none focus:border-rose-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            {/* MAP CUSTOM CONTROLS (If Map Selected) */}
            {selectedTemplate === 'map' && (
              <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-rose-500" /> Bizim Haritamız Entegrasyonu
                  </label>
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    {(markers.length > 0 ? markers : DEFAULT_TURKEY_MARKERS).length} Aşk Noktası
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Sitenizdeki <strong className="text-white">“Bizim Haritamız”</strong> bileşeninde eklediğiniz tüm gerçek kalp noktaları ve Türkiye haritası görünümü hikaye kartınıza otomatik olarak yansıtılır.
                </p>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Harita Kartı Alt Başlığı
                  </label>
                  <input
                    type="text"
                    value={mapSubtitle}
                    onChange={(e) => setMapSubtitle(e.target.value)}
                    maxLength={65}
                    placeholder="Birlikte Keşfettiğimiz Unutulmaz Aşk Noktalarımız ❤️"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Haritanıza yeni kalp eklemek için:</span>
                  <a
                    href="#harita"
                    onClick={() => onClose()}
                    className="text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1"
                  >
                    Haritaya Git 📍
                  </a>
                </div>
              </div>
            )}

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
              className={`relative w-[240px] h-[426px] rounded-3xl p-3 flex flex-col justify-between items-center text-center shadow-2xl border border-slate-700/80 overflow-hidden select-none transition-all duration-300 ${
                selectedTemplate === 'timer'
                  ? 'bg-gradient-to-b from-indigo-950 via-rose-950 to-slate-950 text-white'
                  : selectedTemplate === 'spotify'
                  ? 'bg-[#121212] text-white border-zinc-800'
                  : selectedTemplate === 'polaroid'
                  ? 'bg-[#3b2318] text-slate-900 border-amber-900/50'
                  : selectedTemplate === 'quiz'
                  ? 'bg-gradient-to-b from-purple-950 via-fuchsia-950 to-zinc-950 text-white'
                  : 'bg-[#071324] text-white border-sky-900/60'
              }`}
            >
              {/* Template: NOSTALGIC POLAROID */}
              {selectedTemplate === 'polaroid' && (
                <div className="relative w-full h-full flex flex-col items-center justify-between bg-[#fbf9f4] rounded-2xl p-2.5 shadow-2xl border border-stone-200">
                  {/* Washi Masking Tape on top center */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-100/90 border border-dashed border-amber-300/80 -rotate-2 rounded-xs shadow-xs z-10" />

                  {/* Photo with Vintage Filter & Amber 90s Camera Timestamp */}
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-stone-900 shadow-inner group">
                    <img
                      src={polaroidPhoto}
                      alt="Polaroid Memory"
                      className="w-full h-full object-cover sepia-25 contrast-105 brightness-95"
                    />
                    {/* Light leak ray overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/10 to-orange-400/25 pointer-events-none" />

                    {/* 90s Orange Digital Film Timestamp */}
                    <span className="absolute bottom-1.5 right-2 font-mono font-black text-[10px] text-amber-500 drop-shadow-[0_1px_4px_rgba(245,158,11,0.8)] tracking-wider">
                      {vintageDateStamp}
                    </span>
                  </div>

                  {/* Bottom Handwritten Caption Area */}
                  <div className="w-full space-y-0.5 my-auto px-1 text-center">
                    <h4 className="font-serif italic font-bold text-xs text-stone-900">
                      {partner1} & {partner2}
                    </h4>
                    <p className="font-serif italic text-[9px] text-stone-600 line-clamp-2 leading-tight">
                      “{customQuote}”
                    </p>
                  </div>

                  {/* Vintage Postal Badge & QR */}
                  <div className="w-full flex items-center justify-between border-t border-stone-200/80 pt-1.5 px-1">
                    <div className="text-left space-y-0.5">
                      <span className="inline-block border border-rose-500 text-rose-600 text-[7px] font-black uppercase px-1 rounded-xs tracking-tighter">
                        ★ AŞK POSTASI ★
                      </span>
                      <span className="block text-[7px] text-stone-400 font-mono">
                        {startDateStr}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="p-0.5 bg-stone-50 rounded border border-stone-200 shadow-2xs">
                        <QRCodeSVG
                          value={brandingQrUrl}
                          size={32}
                          fgColor="#e11d48"
                          bgColor="#fafaf9"
                          level="M"
                        />
                      </div>
                      <span className="text-[7px] font-black text-rose-500 mt-0.5">
                        asksite.com.tr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Template: AUTHENTIC BİZİM HARİTAMIZ (VIP) */}
              {selectedTemplate === 'map' && (
                <div className="relative w-full h-full flex flex-col justify-between items-center text-center p-2 animate-in fade-in">
                  {/* Top Header */}
                  <div className="w-full space-y-0.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-[8px] font-extrabold text-rose-300 border border-rose-500/30">
                      ✨ AŞK HARİTAMIZ ✨
                    </span>
                    <h3 className="font-serif text-sm font-black text-white leading-tight">
                      {partner1} & {partner2}
                    </h3>
                    <p className="text-[7.5px] text-rose-300 line-clamp-1 italic px-2">
                      “{customQuote}”
                    </p>
                  </div>

                  {/* The Authentic "Bizim Haritamız" White Card */}
                  <div className="w-full bg-white rounded-2xl p-2 shadow-2xl border border-rose-100 text-slate-800 my-auto transition-all">
                    {/* Card Header */}
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                      <h4 className="text-[11px] font-black text-slate-800 tracking-tight">
                        Bizim Haritamız
                      </h4>
                    </div>
                    <p className="text-[6.5px] text-slate-500 line-clamp-1 mb-1.5 font-medium">
                      {mapSubtitle}
                    </p>

                    {/* The OpenStreetMap Turkey Box */}
                    <div className="relative w-full h-[140px] rounded-xl overflow-hidden border border-slate-200 bg-rose-50 shadow-inner">
                      {/* 2x2 OSM Tiles Grid (Zoom 5 Turkey Tiles) */}
                      <div
                        className="absolute left-0 w-full grid grid-cols-2 grid-rows-2 pointer-events-none select-none"
                        style={{
                          top: '-31.2%',
                          height: '140%',
                        }}
                      >
                        <img
                          src="https://tile.openstreetmap.org/5/18/11.png"
                          alt="OSM NW"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          loading="eager"
                        />
                        <img
                          src="https://tile.openstreetmap.org/5/19/11.png"
                          alt="OSM NE"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          loading="eager"
                        />
                        <img
                          src="https://tile.openstreetmap.org/5/18/12.png"
                          alt="OSM SW"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          loading="eager"
                        />
                        <img
                          src="https://tile.openstreetmap.org/5/19/12.png"
                          alt="OSM SE"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          loading="eager"
                        />
                      </div>

                      {/* Real Red Heart Markers ❤️ placed on Turkey coordinates */}
                      {(markers.length > 0 ? markers : DEFAULT_TURKEY_MARKERS).map((m, idx) => {
                        const pos = projectLatLngToTurkeyBox(m.lat, m.lng, 840, 600);
                        return (
                          <div
                            key={m.id || idx}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none transition-transform hover:scale-125"
                            style={{ left: pos.xPercent, top: pos.yPercent }}
                          >
                            <span className="text-[14px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                              ❤️
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-1.5 flex items-center justify-between text-[7px] font-bold text-slate-500 px-0.5">
                      <span>
                        Toplam {(markers.length > 0 ? markers : DEFAULT_TURKEY_MARKERS).length} Aşk Noktası
                      </span>
                      <span className="bg-rose-100/90 text-rose-700 px-1.5 py-0.5 rounded-full text-[6.5px] font-bold">
                        ❤️ Sonsuz Rota
                      </span>
                    </div>
                  </div>

                  {/* Bottom QR Code & Branding */}
                  <div className="w-full flex items-center justify-between border-t border-white/10 pt-1.5 px-1">
                    <div className="text-left space-y-0.5">
                      <span className="text-[7.5px] font-bold text-rose-300 block">
                        📅 {startDateStr}
                      </span>
                      <span className="text-[7px] text-slate-300">
                        Hikayemizi Keşfet 📱
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="p-0.5 bg-white rounded shadow-md">
                        <QRCodeSVG
                          value={brandingQrUrl}
                          size={32}
                          fgColor="#e11d48"
                          bgColor="#ffffff"
                          level="M"
                        />
                      </div>
                      <span className="text-[6.5px] font-black text-rose-400 mt-0.5">
                        asksite.com.tr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Template: RELATIONSHIP TIMER */}
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

              {/* Template: SPOTIFY */}
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

              {/* Template: QUIZ */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
