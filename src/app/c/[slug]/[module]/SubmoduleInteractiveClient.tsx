'use client';

import React, { Component, ReactNode, useState, useEffect } from 'react';
import {
  Gamepad2,
  Ticket,
  Palette,
  BookOpen,
  Hourglass,
  Disc,
  Brain,
  Heart,
  Calendar,
  Sparkles,
  Award,
  Lock,
  Play,
  RotateCcw,
  Gift,
  Film,
  Star,
  ExternalLink
} from 'lucide-react';
import { CoupleConfig, CouponItem as LibCouponItem, MemoryItem, DiaryEntry, CapsuleItem, MovieItem, QuizQuestion } from '@/types/couple';
import {
  useCoupon,
  sendCanvasStroke,
  subscribeToLiveCanvas,
  clearLiveCanvas,
  saveCoupleConfig,
  addDiaryEntry,
  addTimeCapsule,
  addMovie,
  updateMovie,
  deleteMovie,
  addWheelItem,
  deleteWheelItem,
  addQuizQuestion,
  deleteQuizQuestion,
  formatDiaryDate,
  CanvasStrokeData,
} from '@/lib/couples';
import RomanticMap from '@/components/RomanticMap';
import AskSiteAIWidget from '@/components/CineAIWidget';

// Helper for dynamic window/DOM confetti execution without SSR hydration crash
const triggerConfetti = async (options?: any) => {
  if (typeof window !== 'undefined') {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti(options || { particleCount: 60, spread: 80 });
    } catch (e) {
      console.error('Confetti execution failed:', e);
    }
  }
};

// React Error Boundary for Submodules
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Submodule render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl bg-white/90 backdrop-blur-md p-8 text-center shadow-xl border border-rose-100">
          <div className="text-4xl mb-3">💖</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Modül Yükleniyor</h3>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            İçerik yüklenirken küçük bir aksaklık oluştu. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition"
          >
            Sayfayı Yenile 🔄
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SubmoduleClientProps {
  module: string;
  couple: CoupleConfig;
}

function SubmoduleContent({ module, couple }: SubmoduleClientProps) {
  const partner1 = couple?.partner1_name || 'Partner 1';
  const partner2 = couple?.partner2_name || 'Partner 2';

  if (module === 'games') {
    return <GamesWidget partner1={partner1} partner2={partner2} />;
  }

  if (module === 'coupons') {
    return <CouponsWidget couple={couple} />;
  }

  if (module === 'wheel') {
    return <WheelWidget couple={couple} />;
  }

  if (module === 'quiz') {
    return <QuizWidget couple={couple} />;
  }

  if (module === 'diary') {
    return <DiaryWidget couple={couple} />;
  }

  if (module === 'capsule') {
    return <CapsuleWidget couple={couple} />;
  }

  if (module === 'cinema') {
    return <CinemaWidget couple={couple} />;
  }

  if (module === 'therapy') {
    return <TherapyWidget couple={couple} />;
  }

  if (module === 'map') {
    return <RomanticMap coupleId={couple.id || couple.slug} />;
  }

  if (module === 'ai' || module === 'asksite-ai') {
    return <AskSiteAIWidget partnerName={partner1} slug={couple.slug} />;
  }

  return (
    <div className="rounded-3xl bg-white p-6 text-center text-gray-500 shadow-md">
      Bu modül şu an aktif.
    </div>
  );
}

export default function SubmoduleInteractiveClient(props: SubmoduleClientProps) {
  return (
    <ModuleErrorBoundary>
      <SubmoduleContent {...props} />
    </ModuleErrorBoundary>
  );
}

/* ================= 1. GAMES MODULE ================= */
function GamesWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [turn, setTurn] = useState<'❤️' | '💖'>('❤️');
  const [winner, setWinner] = useState<string | null>(null);

  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return;
    const newBoard = [...board];
    newBoard[idx] = turn;
    setBoard(newBoard);

    // Check winner
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of winningCombos) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        setWinner(newBoard[a]);
        triggerConfetti({ particleCount: 40, spread: 60 });
        return;
      }
    }

    if (newBoard.every((cell) => cell !== null)) {
      setWinner('Berabere');
      return;
    }

    setTurn(turn === '❤️' ? '💖' : '❤️');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('❤️');
    setWinner(null);
  };

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-xl border border-white text-center">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Neon XOX Aşk Oyunu</h3>
      <p className="text-xs text-gray-500 mb-4">
        {partner1} (❤️) vs {partner2} (💖)
      </p>

      <div className="mx-auto grid grid-cols-3 gap-3 max-w-[260px] mb-6">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            className="flex h-20 items-center justify-center rounded-2xl bg-rose-50 border-2 border-rose-100 text-3xl font-bold shadow-sm transition hover:bg-rose-100 active:scale-95"
          >
            {cell}
          </button>
        ))}
      </div>

      {winner && (
        <div className="mb-4 text-base font-extrabold text-rose-600 animate-bounce">
          {winner === 'Berabere' ? '🤝 Oyun Berabere Bitti!' : `🎉 Kazanan taraf: ${winner}!`}
        </div>
      )}

      <button
        onClick={resetGame}
        className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-105 active:scale-95"
      >
        <RotateCcw className="h-4 w-4" /> Yeniden Başla
      </button>
    </div>
  );
}

/* ================= 2. COUPONS MODULE ================= */
const CATEGORY_STYLES: Record<string, { bg: string; badge: string; border: string }> = {
  massage: { bg: 'from-pink-500 via-rose-500 to-red-500', badge: 'bg-pink-100 text-pink-700', border: 'border-pink-300' },
  forgive: { bg: 'from-emerald-500 via-teal-500 to-cyan-500', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-300' },
  movie: { bg: 'from-blue-500 via-indigo-500 to-purple-500', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-300' },
  food: { bg: 'from-amber-500 via-orange-500 to-red-500', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-300' },
  date: { bg: 'from-purple-500 via-fuchsia-500 to-pink-500', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-300' },
  custom: { bg: 'from-rose-500 via-purple-500 to-indigo-500', badge: 'bg-rose-100 text-rose-700', border: 'border-rose-300' },
};

function CouponsWidget({ couple }: { couple: CoupleConfig }) {
  const [couponsList, setCouponsList] = useState<LibCouponItem[]>(couple?.coupons || []);
  const [selectedCoupon, setSelectedCoupon] = useState<LibCouponItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const handleOpenModal = (coupon: LibCouponItem) => {
    if (coupon.is_used) return;
    setSelectedCoupon(coupon);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedCoupon || !couple?.slug) return;
    setRedeeming(true);

    await useCoupon(couple.slug, selectedCoupon.id);

    setCouponsList((prev) =>
      (prev || []).map((c) => (c.id === selectedCoupon.id ? { ...c, is_used: true, used_at: new Date().toISOString() } : c))
    );

    triggerConfetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    setRedeeming(false);
    setSelectedCoupon(null);
  };

  const safeCoupons = couponsList || [];

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-xs text-gray-500 font-medium">
          Sevdiğinize özel dijital aşk kuponları. Kullanmak için üzerine tıklayın! ❤️
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {safeCoupons.map((c) => {
          const style = CATEGORY_STYLES[c.category] || CATEGORY_STYLES.custom;
          return (
            <div
              key={c.id}
              onClick={() => handleOpenModal(c)}
              className={`relative overflow-hidden rounded-3xl p-5 shadow-lg transition-all duration-300 ${
                c.is_used
                  ? 'bg-gray-100 border-2 border-gray-200 opacity-65 cursor-not-allowed grayscale-[40%]'
                  : `bg-gradient-to-r ${style.bg} text-white hover:scale-[1.02] cursor-pointer shadow-rose-500/20 active:scale-98`
              }`}
            >
              {/* Used Stamp Badge */}
              {c.is_used && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                  <div className="rotate-[-12deg] rounded-2xl border-4 border-red-500 bg-white/95 px-6 py-2 shadow-2xl text-center">
                    <span className="text-lg font-black tracking-widest text-red-600 uppercase drop-shadow-xs">
                      ❌ KULLANILDI
                    </span>
                    <div className="text-[10px] text-gray-500 font-bold">
                      {c.used_at ? new Date(c.used_at).toLocaleDateString('tr-TR') : 'Tamamlandı'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{c.icon || '🎟️'}</span>
                    <h4 className={`text-base font-extrabold ${c.is_used ? 'text-gray-800' : 'text-white'}`}>
                      {c.title}
                    </h4>
                  </div>
                  <p className={`text-xs leading-relaxed ${c.is_used ? 'text-gray-500' : 'text-white/90'}`}>
                    {c.description}
                  </p>
                </div>

                {!c.is_used && (
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs border border-white/30">
                    Kullan 🎟️
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-gray-100">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 text-3xl shadow-xs">
              {selectedCoupon.icon || '🎟️'}
            </div>

            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
              {selectedCoupon.title}
            </h3>

            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              {selectedCoupon.description}
            </p>

            <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 font-semibold mb-5 border border-rose-100">
              Bu kuponu şimdi kullanmak istediğinize emin misiniz? ❤️
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={redeeming}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-95 transition disabled:opacity-50"
              >
                {redeeming ? 'İşleniyor...' : 'Evet, Kullan! 🎉'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= 3. WHEEL MODULE ================= */
/* ================= 3. WHEEL MODULE (AŞK ÇARKI) ================= */
const DEFAULT_WHEEL_TASKS = [
  '10 Saniye Sımsıkı Sarıl 🫂',
  'İstediğin Bir Şeyi Yaptır 👑',
  'Akşam Yemeği Ismarla 🍕',
  'Sinema Biletleri Benden 🍿',
  'Masaj Yap 💆‍♂️',
  'Romantik Bir Öpücük 💋',
  'Kahve Demle & Yatakta Sun ☕',
  'Soru Sormadan Affet 🕊️',
];

const WHEEL_COLORS = [
  '#ff4d6d', '#ff758f', '#ff8fa3', '#9c88ff',
  '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3',
  '#ff6b6b', '#482ff7', '#6c5ce7', '#00d2d3'
];

function WheelWidget({ couple }: { couple: CoupleConfig }) {
  const items = couple?.wheel_items && couple.wheel_items.length > 0 ? couple.wheel_items : DEFAULT_WHEEL_TASKS;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  
  const [rotationAngle, setRotationAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerItem, setWinnerItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Draw Canvas Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numSlices = items.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(rotationAngle);

    for (let i = 0; i < numSlices; i++) {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

      // Draw Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 8, startA, endA);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Text
      ctx.save();
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      
      const label = items[i].length > 20 ? items[i].substring(0, 18) + '...' : items[i];
      ctx.fillText(label, radius - 24, 4);
      ctx.restore();
    }

    // Outer Ring
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff4d6d';
    ctx.stroke();

    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('💖', 0, 0);

    ctx.restore();
  }, [items, rotationAngle]);

  const handleSpin = () => {
    if (spinning || items.length === 0) return;
    setSpinning(true);
    setWinnerItem(null);
    setShowModal(false);

    const numSlices = items.length;
    const sliceAngleDegrees = 360 / numSlices;
    
    // Pick random winning index
    const winningIndex = Math.floor(Math.random() * numSlices);
    
    const targetSliceCenter = winningIndex * sliceAngleDegrees + sliceAngleDegrees / 2;
    let finalAngleDegrees = 270 - targetSliceCenter;
    if (finalAngleDegrees < 0) finalAngleDegrees += 360;

    const extraRounds = (5 + Math.floor(Math.random() * 3)) * 360;
    const currentDeg = (rotationAngle * 180) / Math.PI;
    const targetDeg = currentDeg + extraRounds + ((finalAngleDegrees - (currentDeg % 360) + 360) % 360);

    const startTime = performance.now();
    const duration = 4000;
    const startRad = rotationAngle;
    const targetRad = (targetDeg * Math.PI) / 180;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRad = startRad + (targetRad - startRad) * easeOut;

      setRotationAngle(currentRad);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinnerItem(items[winningIndex]);
        setShowModal(true);
        triggerConfetti({ particleCount: 100, spread: 80 });
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="space-y-6">
      {/* Canvas Wheel Box */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-purple-500/10 p-6 shadow-xl border border-rose-100 text-center relative overflow-hidden">
        <h3 className="text-xl font-extrabold text-gray-900 mb-1 flex items-center justify-center gap-2">
          🎡 Aşk Çarkıfeleği
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Kaderini çark belirlesin! Butona bas ve romantik sürpriz görevi gör.
        </p>

        {/* Wheel Container */}
        <div className="relative mx-auto w-[300px] h-[300px] flex items-center justify-center">
          {/* Top Pointer Arrow */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-600 drop-shadow-md" />

          {/* Canvas Element */}
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="rounded-full shadow-2xl bg-white"
          />

          {/* Center Spin Trigger Button Overlay */}
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="absolute z-30 h-16 w-16 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs shadow-xl border-4 border-white hover:scale-110 active:scale-95 transition disabled:opacity-75 flex flex-col items-center justify-center"
          >
            <span>ÇEVİR</span>
            <span className="text-[10px]">🎡</span>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 px-8 py-3 text-xs font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {spinning ? 'Çark Heyecanla Dönüyor... 🌀' : 'Çarkı Çevir 🚀'}
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider text-left pl-1">
          📋 Çarktaki Sürpriz Görevler ({items.length})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm border border-gray-100 text-left transition hover:shadow-md"
            >
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                style={{ backgroundColor: WHEEL_COLORS[idx % WHEEL_COLORS.length] }}
              >
                #{idx + 1}
              </div>
              <span className="text-xs font-extrabold text-gray-800 leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Winner Result Modal */}
      {showModal && winnerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-rose-100 space-y-4 relative overflow-hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500 text-3xl animate-bounce">
              🎉
            </div>

            <div>
              <h4 className="text-xs font-extrabold text-rose-500 uppercase tracking-wider mb-1">
                Aşk Çarkının Kazanan Görevi ✨
              </h4>
              <p className="text-base font-black text-gray-900 leading-tight font-serif p-3 bg-rose-50 rounded-2xl border border-rose-100 mt-2">
                "{winnerItem}"
              </p>
            </div>

            <p className="text-xs text-gray-500 italic">
              Tebrikler! Sevgilinize bu görevi hemen yaptırabilirsiniz. ❤️
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 py-3 text-xs font-extrabold text-white shadow-lg hover:scale-102 transition"
            >
              Harika! Görevi Kabul Et 🥰
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= 4. QUIZ MODULE (AŞK TESTİ) ================= */
const DEFAULT_QUIZ_P1: QuizQuestion[] = [
  {
    id: 'q1-1',
    question: 'Benim en sevdiğim kahve çeşidi hangisidir?',
    options: ['Latte', 'Espresso', 'Iced Americano', 'Türk Kahvesi'],
    correct_index: 3,
    created_by: 'partner1',
  },
  {
    id: 'q1-2',
    question: 'Birlikte gittiğimiz ilk baş başa tatil neresiydi?',
    options: ['Antalya', 'Kapadokya', 'Bodrum', 'Eskişehir'],
    correct_index: 1,
    created_by: 'partner1',
  },
  {
    id: 'q1-3',
    question: 'Birlikteyken en çok neye gülerim?',
    options: ['Kötü Esprilere', 'Kedi / Köpek Videolarına', 'Birlikte Anlattığımız Anılara', 'Komik Filmlere'],
    correct_index: 2,
    created_by: 'partner1',
  },
];

const DEFAULT_QUIZ_P2: QuizQuestion[] = [
  {
    id: 'q2-1',
    question: 'Benim en çok sevdiğim yemek nedir?',
    options: ['Mantı / Lahmacun', 'Burger & Patates', 'Ev Yemeği / Kuru Fasulye', 'Pizza'],
    correct_index: 0,
    created_by: 'partner2',
  },
  {
    id: 'q2-2',
    question: 'Yoğun bir günün ardından akşam en sevdiğim aktivite nedir?',
    options: ['Kitap Okumak', 'Birlikte Dizi/Film İzlemek', 'Oyun Oynamak', 'Müzik Dinlemek'],
    correct_index: 1,
    created_by: 'partner2',
  },
  {
    id: 'q2-3',
    question: 'Bana en tatlı ve vazgeçilmez gelen halin hangisi?',
    options: ['Sabah Uykulu Hallerin', 'Bana Sarılman', 'Gülümsemen', 'Hepsi ve Daha Fazlası ❤️'],
    correct_index: 3,
    created_by: 'partner2',
  },
];

function QuizWidget({ couple }: { couple: CoupleConfig }) {
  const partner1Name = couple?.partner1_name || 'Partner 1';
  const partner2Name = couple?.partner2_name || 'Partner 2';

  const [activePartnerTab, setActivePartnerTab] = useState<'partner1' | 'partner2'>('partner1');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const questions = React.useMemo(() => {
    if (activePartnerTab === 'partner1') {
      return couple?.quiz_partner1 && couple.quiz_partner1.length > 0 ? couple.quiz_partner1 : DEFAULT_QUIZ_P1;
    } else {
      return couple?.quiz_partner2 && couple.quiz_partner2.length > 0 ? couple.quiz_partner2 : DEFAULT_QUIZ_P2;
    }
  }, [activePartnerTab, couple]);

  const handleTabChange = (tab: 'partner1' | 'partner2') => {
    setActivePartnerTab(tab);
    setCurrentQIndex(0);
    setScore(0);
    setCompleted(false);
    setSelectedOption(null);
    setIsAnswering(false);
  };

  const handleOptionClick = (optionIdx: number) => {
    if (isAnswering || completed || !questions[currentQIndex]) return;

    setIsAnswering(true);
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === questions[currentQIndex].correct_index;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQIndex + 1 < questions.length) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswering(false);
      } else {
        setCompleted(true);
        setIsAnswering(false);
        triggerConfetti({ particleCount: 90, spread: 80 });
      }
    }, 1200);
  };

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setScore(0);
    setCompleted(false);
    setSelectedOption(null);
    setIsAnswering(false);
  };

  const currentQ = questions[currentQIndex];
  const scorePct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const getRankBadge = () => {
    if (scorePct === 100) return '💞 %100 - Tam Anlamıyla Ruh Eşisiniz!';
    if (scorePct >= 70) return `💖 %${scorePct} - Birbirinizi Çok İyi Tanıyorsunuz!`;
    if (scorePct >= 50) return `🌟 %${scorePct} - Harika Bir Çiftsiniz!`;
    return `🥰 %${scorePct} - Birlikte Keşfedeceğiniz Çok Şey Var!`;
  };

  return (
    <div className="space-y-6">
      {/* Partner Quiz Selector Tabs */}
      <div className="flex rounded-2xl bg-gray-100 p-1.5 shadow-inner">
        <button
          onClick={() => handleTabChange('partner1')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activePartnerTab === 'partner1'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-gray-600 hover:text-rose-500'
          }`}
        >
          💖 {partner1Name}'in Testini Çöz
        </button>
        <button
          onClick={() => handleTabChange('partner2')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activePartnerTab === 'partner2'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-gray-600 hover:text-rose-500'
          }`}
        >
          💙 {partner2Name}'nin Testini Çöz
        </button>
      </div>

      {/* Quiz Card */}
      <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100 text-left relative overflow-hidden">
        {!completed && currentQ ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-extrabold text-rose-500 uppercase tracking-wider">
                Soru {currentQIndex + 1} / {questions.length}
              </span>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                Hazırlayan: {activePartnerTab === 'partner1' ? partner1Name : partner2Name}
              </span>
            </div>

            {/* Question Title */}
            <h3 className="text-base font-extrabold text-gray-900 leading-snug pt-1">
              {currentQ.question}
            </h3>

            {/* Options Grid */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((optionText, idx) => {
                let btnStyle = 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-rose-50 hover:border-rose-300';
                let icon = null;

                if (selectedOption !== null) {
                  if (idx === currentQ.correct_index) {
                    btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-md';
                    icon = '✓';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-500 text-white border-rose-600 font-bold shadow-md';
                    icon = '✕';
                  } else {
                    btnStyle = 'bg-gray-100 text-gray-400 border-gray-200 opacity-60';
                  }
                }

                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isAnswering}
                    className={`w-full flex items-center justify-between rounded-2xl border p-3.5 text-xs font-semibold transition active:scale-98 ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/10 text-[11px] font-bold">
                        {letter}
                      </span>
                      <span>{optionText}</span>
                    </div>
                    {icon && <span className="font-extrabold text-sm">{icon}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Result Card */
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-500 text-4xl shadow-inner animate-bounce">
              🏆
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Aşk Testi Tamamlandı!</h3>
              <p className="text-xs text-gray-500">
                {activePartnerTab === 'partner1' ? partner1Name : partner2Name} tarafından hazırlanan testi başarıyla çözdünüz.
              </p>
            </div>

            {/* Score & Compatibility Badge */}
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 space-y-2">
              <div className="text-2xl font-black text-rose-600">
                {score} / {questions.length} Doğru (%{scorePct})
              </div>
              <div className="text-xs font-extrabold text-gray-800 bg-white py-1.5 px-3 rounded-xl shadow-xs border border-rose-100 inline-block">
                {getRankBadge()}
              </div>
            </div>

            <button
              onClick={resetQuiz}
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-8 py-3 text-xs font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2 mx-auto"
            >
              Testi Tekrar Çöz 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= 5. DIARY MODULE (ANI DEFTERİ) ================= */
const MOOD_EMOJIS = ['❤️', '😊', '☕', '🍷', '🌅', '🌟', '🎉', '🥺', '🕊️'];

function DiaryWidget({ couple }: { couple: CoupleConfig }) {
  const [entries, setEntries] = useState<DiaryEntry[]>(couple?.diary_entries || []);
  const [noteContent, setNoteContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('❤️');
  const [adding, setAdding] = useState(false);

  // Authenticated Role Check
  const authState = React.useMemo<{ role: 'partner1' | 'partner2' | 'guest'; author: string; isPartner: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const role = parsed.role as 'partner1' | 'partner2' | 'guest';
          const author = role === 'partner1' ? couple.partner1_name : role === 'partner2' ? couple.partner2_name : 'Misafir';
          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) {}
      }
    }
    return { role: 'guest', author: 'Misafir', isPartner: false };
  }, [couple]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    if (!authState.isPartner) return; // Client-side Guest protection

    setAdding(true);
    const newEntryData: Omit<DiaryEntry, 'id'> = {
      author: authState.author,
      role: authState.role,
      date: new Date().toISOString(),
      content: noteContent.trim(),
      mood: selectedMood,
    };

    const success = await addDiaryEntry(couple.slug, newEntryData);
    if (success) {
      setEntries((prev) => [
        {
          id: `d-${Date.now()}`,
          ...newEntryData,
        },
        ...prev,
      ]);
      setNoteContent('');
      triggerConfetti({ particleCount: 50, spread: 60 });
    }
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Form or Guest Warning Banner */}
      {authState.isPartner ? (
        <div className="rounded-3xl bg-amber-50/90 backdrop-blur-md p-5 shadow-xl border border-amber-200 space-y-3 relative overflow-hidden">
          {/* Spiral Margin Decoration */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-amber-200/50 flex flex-col justify-around py-2 border-r border-amber-300/40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-amber-700/30 mx-auto shadow-inner" />
            ))}
          </div>

          <div className="pl-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                📖 Yeni Anı / Not Yaz ({authState.author})
              </h4>
              <span className="text-xs text-amber-700 font-serif">📅 {new Date().toLocaleDateString('tr-TR')}</span>
            </div>

            <textarea
              rows={3}
              placeholder="Aşkınıza dair bugün hissettiklerinizi yazın..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full rounded-2xl border border-amber-300/80 bg-white/90 p-3 text-xs text-gray-800 outline-none focus:border-amber-500 font-serif leading-relaxed placeholder:font-sans"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                <span className="text-[10px] font-bold text-amber-800 mr-1">Ruh Hali:</span>
                {MOOD_EMOJIS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood(m)}
                    className={`h-7 w-7 rounded-xl text-sm transition-transform ${
                      selectedMood === m ? 'scale-125 bg-amber-200 shadow-xs' : 'hover:scale-110 opacity-80'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddNote}
                disabled={adding || !noteContent.trim()}
                className="rounded-xl bg-gradient-to-r from-amber-600 to-rose-500 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:scale-102 active:scale-95 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                Anı Defterine Ekle 🖋️
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-amber-50/80 p-4 text-center shadow-md border border-amber-200 flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
          🔒 Ziyaretçiler anı defterini sadece okuyabilir.
        </div>
      )}

      {/* Diary Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-xs text-gray-500 shadow-md">
            Henüz yazılmış bir anı bulunmuyor. İlk notu siz düşün! ❤️
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-lg border border-amber-100/80 pl-8 transition hover:shadow-xl"
            >
              {/* Left Spiral Rings Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-slate-100 flex flex-col justify-around py-3 border-r border-slate-200">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-2.5 w-2.5 rounded-full bg-slate-400/50 mx-auto shadow-inner" />
                ))}
              </div>

              {/* Top Meta info */}
              <div className="flex items-center justify-between border-b border-rose-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{entry.mood || '❤️'}</span>
                  <span className="font-serif text-sm font-extrabold text-gray-900">{entry.author}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-100">
                    {entry.role === 'partner1' ? couple.partner1_name : entry.role === 'partner2' ? couple.partner2_name : 'Partner'}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">📅 {formatDiaryDate(entry.date)}</span>
              </div>

              {/* Content with notebook lines pattern */}
              <p className="font-serif text-xs text-gray-800 leading-6 bg-[linear-gradient(#f1f5f9_1px,transparent_1px)] bg-[size:100%_24px] pt-1">
                "{entry.content}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= 6. CAPSULE MODULE (ZAMAN KAPSÜLÜ) ================= */
function CapsuleCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  React.useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(targetDate).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({ d, h, m, s });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-emerald-400 font-bold">Kilit Açıldı! 🔓</span>;

  return (
    <div className="grid grid-cols-4 gap-2 text-center my-3">
      <div className="rounded-xl bg-slate-800/80 p-2 border border-slate-700">
        <span className="block text-lg font-black text-amber-400">{timeLeft.d}</span>
        <span className="text-[10px] text-slate-400 uppercase font-bold">Gün</span>
      </div>
      <div className="rounded-xl bg-slate-800/80 p-2 border border-slate-700">
        <span className="block text-lg font-black text-amber-400">{timeLeft.h}</span>
        <span className="text-[10px] text-slate-400 uppercase font-bold">Saat</span>
      </div>
      <div className="rounded-xl bg-slate-800/80 p-2 border border-slate-700">
        <span className="block text-lg font-black text-amber-400">{timeLeft.m}</span>
        <span className="text-[10px] text-slate-400 uppercase font-bold">Dak</span>
      </div>
      <div className="rounded-xl bg-slate-800/80 p-2 border border-slate-700">
        <span className="block text-lg font-black text-amber-400">{timeLeft.s}</span>
        <span className="text-[10px] text-slate-400 uppercase font-bold">San</span>
      </div>
    </div>
  );
}

function CapsuleWidget({ couple }: { couple: CoupleConfig }) {
  const [capsules, setCapsules] = useState<CapsuleItem[]>(couple?.time_capsules || []);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({});

  const authState = React.useMemo<{ role: 'partner1' | 'partner2' | 'guest'; author: string; isPartner: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const role = parsed.role as 'partner1' | 'partner2' | 'guest';
          const author = role === 'partner1' ? couple.partner1_name : role === 'partner2' ? couple.partner2_name : 'Misafir';
          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) {}
      }
    }
    return { role: 'guest', author: 'Misafir', isPartner: false };
  }, [couple]);

  const handleSealCapsule = async () => {
    if (!title.trim() || !content.trim() || !openDate) return;
    if (!authState.isPartner) return;

    setAdding(true);
    const newCapsuleData = {
      title: title.trim(),
      content: content.trim(),
      open_date: new Date(openDate).toISOString(),
      creator: authState.author,
    };

    const success = await addTimeCapsule(couple.slug, newCapsuleData);
    if (success) {
      setCapsules((prev) => [
        {
          id: `tc-${Date.now()}`,
          created_at: new Date().toISOString(),
          is_opened: false,
          ...newCapsuleData,
        },
        ...prev,
      ]);
      setTitle('');
      setContent('');
      setOpenDate('');
      triggerConfetti({ particleCount: 60, spread: 70 });
    }
    setAdding(false);
  };

  const handleOpenCapsule = (id: string) => {
    setUnlockedMap((prev) => ({ ...prev, [id]: true }));
    triggerConfetti({ particleCount: 90, spread: 80 });
  };

  return (
    <div className="space-y-6">
      {/* New Capsule Seal Form */}
      {authState.isPartner ? (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-2xl border border-indigo-500/30 space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2 border-b border-indigo-800/60 pb-3">
            <Lock className="h-5 w-5 text-amber-400 animate-pulse" />
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-amber-300">
              Geleceğe Zaman Kapsülü Mühürle 🔒
            </h4>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Kapsül Başlığı (Ör: 1. Yıl Dönümümüz 🎁)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-slate-800/90 border border-slate-700 p-3 text-xs text-white outline-none focus:border-amber-400 placeholder:text-slate-400"
            />

            <textarea
              rows={3}
              placeholder="Gelecekte açılacak gizli aşk mesajınız..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-2xl bg-slate-800/90 border border-slate-700 p-3 text-xs text-white outline-none focus:border-amber-400 placeholder:text-slate-400 leading-relaxed font-serif"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-1 uppercase tracking-wider">
                  Kapsül Açılış Tarihi (openDate)
                </label>
                <input
                  type="datetime-local"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/90 border border-slate-700 p-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleSealCapsule}
                disabled={adding || !title.trim() || !content.trim() || !openDate}
                className="w-full h-10 mt-auto rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 font-extrabold text-xs text-white shadow-lg hover:scale-102 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                Kapsülü Mühürle & Kilitle 🔒
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900 p-4 text-center text-xs font-bold text-amber-400 shadow-lg border border-slate-800">
          🔒 Ziyaretçiler sadece kapsül kilit sürelerini görebilir.
        </div>
      )}

      {/* Capsules List */}
      <div className="space-y-5">
        {capsules.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-xs text-gray-500 shadow-md">
            Henüz mühürlenmiş bir zaman kapsülü bulunmuyor. Geleceğinize ilk notu siz bırakın! ⏳
          </div>
        ) : (
          capsules.map((capsule) => {
            const isTimeReached = new Date(capsule.open_date).getTime() <= new Date().getTime();
            const isRevealed = capsule.is_opened || unlockedMap[capsule.id];

            return (
              <div
                key={capsule.id}
                className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden transition hover:border-amber-400/40"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isTimeReached ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        🔓 Kilidi Açılabilir
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Kilitli Kapsül
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">Yazar: {capsule.creator}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Açılış: {formatDiaryDate(capsule.open_date)}
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-amber-300 mb-1">{capsule.title}</h4>

                {!isTimeReached ? (
                  /* Locked View */
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-300 font-medium">
                      🔒 Bu kapsül kilitlidir. Açılmasına kalan süre:
                    </p>
                    <CapsuleCountdown targetDate={capsule.open_date} />
                    <div className="rounded-2xl bg-slate-950/60 p-3 border border-slate-800 text-[11px] text-slate-400 italic">
                      "Kapsül içeriği açılış zamanına kadar kilitli kasada güvenle saklanmaktadır."
                    </div>
                  </div>
                ) : isRevealed ? (
                  /* Unlocked & Opened View */
                  <div className="space-y-3 pt-2">
                    <div className="rounded-2xl bg-gradient-to-r from-amber-950/60 to-rose-950/60 p-4 border border-amber-500/40 text-xs text-amber-100 font-serif leading-relaxed shadow-inner">
                      "{capsule.content}"
                    </div>
                    {capsule.photo_url && (
                      <img
                        src={capsule.photo_url}
                        alt={capsule.title}
                        className="rounded-2xl w-full h-48 object-cover border border-amber-400/30 shadow-md"
                      />
                    )}
                  </div>
                ) : (
                  /* Unlocked but Needs Click */
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-emerald-300 font-bold animate-bounce">
                      🎉 Kilit tarihi doldu! Kapsülünüz açılmaya hazır.
                    </p>
                    <button
                      onClick={() => handleOpenCapsule(capsule.id)}
                      className="mx-auto rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2"
                    >
                      Kapsülü Aç & Mesajı Oku 🔓✨
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ================= 7. CINEMA MODULE (SİNEMA & İZLEME LİSTESİ) ================= */
function CinemaWidget({ couple }: { couple: CoupleConfig }) {
  const [movies, setMovies] = useState<MovieItem[]>(couple?.movies || []);
  const [activeTab, setActiveTab] = useState<'watched' | 'watchlist'>('watched');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [watchUrl, setWatchUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'watched' | 'watchlist'>('watched');
  const [adding, setAdding] = useState(false);

  // Transition Modal State for "İzledik 🍿"
  const [selectedMovieForMarking, setSelectedMovieForMarking] = useState<MovieItem | null>(null);
  const [markRating, setMarkRating] = useState(5);
  const [markNote, setMarkNote] = useState('');

  const authState = React.useMemo<{ role: 'partner1' | 'partner2' | 'guest'; author: string; isPartner: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const role = parsed.role as 'partner1' | 'partner2' | 'guest';
          const author = role === 'partner1' ? couple.partner1_name : role === 'partner2' ? couple.partner2_name : 'Misafir';
          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) {}
      }
    }
    return { role: 'guest', author: 'Misafir', isPartner: false };
  }, [couple]);

  const handleAddMovie = async () => {
    if (!title.trim()) return;
    if (!authState.isPartner) return;

    setAdding(true);
    const newMovieData = {
      title: title.trim(),
      genre: genre.trim() || 'Genel',
      poster_url: posterUrl.trim() || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      watch_url: watchUrl.trim(),
      rating: status === 'watched' ? rating : 0,
      note: note.trim(),
      status,
      added_by: authState.author,
    };

    const success = await addMovie(couple.slug, newMovieData);
    if (success) {
      setMovies((prev) => [
        {
          id: `m-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...newMovieData,
        },
        ...prev,
      ]);
      setTitle('');
      setGenre('');
      setPosterUrl('');
      setWatchUrl('');
      setNote('');
      triggerConfetti({ particleCount: 50, spread: 60 });
    }
    setAdding(false);
  };

  const handleConfirmMarkAsWatched = async () => {
    if (!selectedMovieForMarking) return;

    const updated: MovieItem = {
      ...selectedMovieForMarking,
      status: 'watched',
      rating: markRating,
      note: markNote.trim() || selectedMovieForMarking.note || '',
    };

    const success = await updateMovie(couple.slug, updated);
    if (success) {
      setMovies((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelectedMovieForMarking(null);
      setMarkNote('');
      triggerConfetti({ particleCount: 80, spread: 70 });
    }
  };

  const watchedMovies = movies.filter((m) => m.status === 'watched');
  const watchlistMovies = movies.filter((m) => m.status === 'watchlist');

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-gray-100 p-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('watched')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'watched'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-gray-600 hover:text-rose-500'
          }`}
        >
          🍿 Birlikte İzlediklerimiz ({watchedMovies.length})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'watchlist'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-gray-600 hover:text-rose-500'
          }`}
        >
          🎬 İzlenecekler Listesi ({watchlistMovies.length})
        </button>
      </div>

      {/* New Movie Form */}
      {authState.isPartner ? (
        <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Film className="h-4 w-4" /> Yeni Film / Dizi Ekle ({authState.author})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Film veya Dizi Adı *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
            />
            <input
              type="text"
              placeholder="Tür (Ör: Romantik Komedi, Bilim Kurgu)"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="url"
              placeholder="Afiş Görsel URL (İsteğe Bağlı)"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
            />
            <input
              type="url"
              placeholder="İzleme / Fragman Linki (Watch URL)"
              value={watchUrl}
              onChange={(e) => setWatchUrl(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'watched' | 'watchlist')}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2 text-xs text-white outline-none focus:border-rose-500"
              >
                <option value="watched">🍿 İzledik</option>
                <option value="watchlist">🎬 İzleyeceğiz</option>
              </select>
            </div>

            {status === 'watched' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Puan</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-sm ${star <= rating ? 'text-amber-400 scale-110' : 'text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddMovie}
              disabled={adding || !title.trim()}
              className="w-full h-9 mt-auto rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 text-xs font-bold text-white shadow-md hover:scale-102 transition disabled:opacity-50"
            >
              Listeye Ekle 🍿
            </button>
          </div>

          <input
            type="text"
            placeholder="Çift Notu (Ör: Harika bir geceydi, sonuna kadar nefesimizi tuttuk!)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
          />
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900 p-4 text-center text-xs font-bold text-rose-300 shadow-md border border-slate-800">
          🔒 Ziyaretçiler film listesini sadece görüntüleyebilir.
        </div>
      )}

      {/* Movies List */}
      <div className="space-y-4">
        {(activeTab === 'watched' ? watchedMovies : watchlistMovies).length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-xs text-gray-500 shadow-md">
            {activeTab === 'watched'
              ? 'Henüz birlikte izlediğiniz bir film kaydedilmemiş. 🍿'
              : 'İzlenecekler listeniz şu an boş. Yeni film fikri ekleyin! 🎬'}
          </div>
        ) : (
          (activeTab === 'watched' ? watchedMovies : watchlistMovies).map((movie) => (
            <div
              key={movie.id}
              className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-lg border border-dashed border-rose-200 flex flex-col sm:flex-row gap-4 items-center transition hover:shadow-xl"
            >
              {/* Ticket Notches */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-50 border-r border-rose-200" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-50 border-l border-rose-200" />

              {/* Poster */}
              <img
                src={movie.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop'}
                alt={movie.title}
                className="h-32 w-24 rounded-2xl object-cover shadow-md shrink-0 border border-gray-100"
              />

              {/* Movie Details */}
              <div className="flex-1 space-y-1.5 text-left w-full pl-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-gray-900 leading-snug">{movie.title}</h4>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100 shrink-0">
                    {movie.genre || 'Film'}
                  </span>
                </div>

                {movie.status === 'watched' && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    {'★'.repeat(movie.rating || 5)}
                    {'☆'.repeat(5 - (movie.rating || 5))}
                    <span className="text-[10px] text-gray-500 font-mono ml-1">({movie.rating || 5}/5)</span>
                  </div>
                )}

                {movie.note && (
                  <p className="text-xs text-gray-700 italic font-serif leading-relaxed bg-rose-50/50 p-2 rounded-xl border border-rose-100">
                    "{movie.note}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[10px] text-gray-400 font-mono">Ekleyen: {movie.added_by || 'Partner'}</span>

                  <div className="flex items-center gap-2">
                    {movie.watch_url && (
                      <a
                        href={movie.watch_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-xs hover:bg-slate-800 transition flex items-center gap-1"
                      >
                        İzle 🍿 <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {movie.status === 'watchlist' && authState.isPartner && (
                      <button
                        onClick={() => setSelectedMovieForMarking(movie)}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-md hover:scale-102 active:scale-95 transition flex items-center gap-1"
                      >
                        İzledik 🍿
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mark As Watched Modal */}
      {selectedMovieForMarking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-left border border-rose-100">
            <h4 className="font-extrabold text-sm text-gray-900">
              🍿 "{selectedMovieForMarking.title}" Filmini İzlediniz Mi?
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Filme Puanınız:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setMarkRating(star)}
                    className={`text-2xl transition-transform ${
                      star <= markRating ? 'text-amber-400 scale-110' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Çift Yorumunuz & Notunuz:</label>
              <textarea
                rows={3}
                placeholder="Harika bir akşam filmiydi! Sahnesi beni benden aldı..."
                value={markNote}
                onChange={(e) => setMarkNote(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-gray-800 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedMovieForMarking(null)}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmMarkAsWatched}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-2.5 text-xs font-bold text-white shadow-md hover:scale-102 transition"
              >
                İzlenenlere Aktar 🍿
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= 8. THERAPY MODULE (SANAT TERAPİSİ & BOYAMA) ================= */
const PALETTE_COLORS = [
  { name: 'Gül Pembesi', hex: '#ff4d6d' },
  { name: 'Tatlı Pembe', hex: '#ff758f' },
  { name: 'Aşk Moru', hex: '#9c88ff' },
  { name: 'Gökyüzü Mavi', hex: '#48dbfb' },
  { name: 'Nane Yeşil', hex: '#1dd1a1' },
  { name: 'Güneş Sarı', hex: '#feca57' },
  { name: 'Şeker Pembe', hex: '#ff9ff3' },
  { name: 'Gece Siyahı', hex: '#2f3542' },
  { name: 'Silgi (Beyaz)', hex: '#ffffff' },
];

const TEMPLATES: Record<string, { title: string; icon: string; svg: string }> = {
  heart: {
    title: 'Büyük Kalp 💖',
    icon: '💖',
    svg: `<path d="M180 300 C70 200, 20 120, 90 50 C140 0, 180 70, 180 70 C180 70, 220 0, 270 50 C340 120, 290 200, 180 300 Z" fill="none" stroke="#ff4d6d" stroke-width="4" stroke-dasharray="6,4"/>`,
  },
  hug: {
    title: 'Sarılan Çift 👩‍❤️‍👨',
    icon: '👩‍❤️‍👨',
    svg: `<path d="M100 120 C100 70 140 70 140 120 C140 160 100 160 100 120 Z M220 120 C220 70 260 70 260 120 C260 160 220 160 220 120 Z M80 280 C80 200 120 170 180 170 C240 170 280 200 280 280 M120 220 C140 200 220 200 240 220" fill="none" stroke="#9c88ff" stroke-width="4" stroke-dasharray="5,5"/>`,
  },
  moon: {
    title: 'Yıldızlar & Ay 🌙',
    icon: '🌙',
    svg: `<path d="M160 50 A100 100 0 1 0 270 230 A120 120 0 1 1 160 50 Z" fill="none" stroke="#feca57" stroke-width="4" stroke-dasharray="6,4"/><path d="M70 70 L75 85 L90 90 L75 95 L70 110 L65 95 L50 90 L65 85 Z M280 100 L283 110 L293 113 L283 116 L280 126 L277 116 L267 113 L277 110 Z M220 280 L223 290 L233 293 L223 296 L220 306 L217 296 L207 293 L217 290 Z" fill="none" stroke="#feca57" stroke-width="2"/>`,
  },
  tree: {
    title: 'Aşk Ağacı 🌳',
    icon: '🌳',
    svg: `<path d="M180 340 L180 220 M180 280 L140 240 M180 260 L220 220 M180 230 L130 190 M180 210 L230 170" stroke="#2f3542" stroke-width="5"/><path d="M180 180 C110 180 90 100 150 70 C160 20 220 20 230 70 C280 100 250 180 180 180 Z" fill="none" stroke="#1dd1a1" stroke-width="4" stroke-dasharray="5,4"/><path d="M130 100 A10 10 0 0 1 150 100 A10 10 0 0 1 130 100 Z M210 120 A10 10 0 0 1 230 120 A10 10 0 0 1 210 120 Z M170 80 A10 10 0 0 1 190 80 A10 10 0 0 1 170 80 Z" fill="none" stroke="#ff4d6d" stroke-width="3"/>`,
  },
};

function TherapyWidget({ couple }: { couple: CoupleConfig }) {
  const [tab, setTab] = useState<'free' | 'template'>('free');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('heart');
  const [selectedColor, setSelectedColor] = useState<string>('#ff4d6d');
  const [strokeWidth, setStrokeWidth] = useState<number>(7);
  const [savingMemory, setSavingMemory] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef<boolean>(false);
  const currentPointsRef = React.useRef<Array<{ x: number; y: number }>>([]);

  const userRole: 'partner1' | 'partner2' | 'guest' = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role) return parsed.role;
        } catch (e) {}
      }
    }
    return 'partner1';
  }, [couple.slug]);

  // Subscribe to live strokes from Firestore
  React.useEffect(() => {
    const unsubscribe = subscribeToLiveCanvas(couple.slug, (strokes) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Redraw canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      strokes.forEach((s) => {
        if (!s.points || s.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      });
    });

    return () => unsubscribe();
  }, [couple.slug]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const p = getCanvasCoords(e);
    currentPointsRef.current = [p];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(p.x, p.y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const p = getCanvasCoords(e);
    currentPointsRef.current.push(p);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const handleEndDraw = async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 1) {
      const strokeData: CanvasStrokeData = {
        points: currentPointsRef.current,
        color: selectedColor,
        strokeWidth: strokeWidth,
        role: userRole,
      };
      await sendCanvasStroke(couple.slug, strokeData);
    }
    currentPointsRef.current = [];
  };

  const handleClear = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    await clearLiveCanvas(couple.slug);
  };

  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSavingMemory(true);
    try {
      // Create offscreen canvas to composite background template + strokes
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');

      if (offCtx) {
        // Fill white background
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

        // Draw active template SVG if in template mode
        if (tab === 'template' && TEMPLATES[selectedTemplateKey]) {
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360">${TEMPLATES[selectedTemplateKey].svg}</svg>`;
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
          });
          offCtx.drawImage(img, 0, 0);
        }

        // Draw canvas strokes on top
        offCtx.drawImage(canvas, 0, 0);

        const dataUrl = offscreen.toDataURL('image/png');

        const newMemory: MemoryItem = {
          id: `m-${Date.now()}`,
          photo_url: dataUrl,
          date: new Date().toISOString().split('T')[0],
          title: tab === 'template' ? `🎨 Sanat Terapisi: ${TEMPLATES[selectedTemplateKey]?.title || 'Boyama'}` : '🎨 Bizim Sanat Terapisi Çizimimiz',
          note: `${couple.partner1_name} & ${couple.partner2_name} ortak tuval çalışması ❤️`,
        };

        const updatedMemories = [newMemory, ...(couple.memories || [])];
        await saveCoupleConfig({
          ...couple,
          memories: updatedMemories,
        });

        triggerConfetti({ particleCount: 70, spread: 80 });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving therapy image to gallery:', err);
    }
    setSavingMemory(false);
  };

  const activeSvg = tab === 'template' ? TEMPLATES[selectedTemplateKey]?.svg : null;

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-white p-1.5 shadow-md border border-gray-100 gap-1 max-w-sm mx-auto">
        <button
          onClick={() => setTab('free')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            tab === 'free'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-rose-500'
          }`}
        >
          🎨 Serbest Çizim
        </button>
        <button
          onClick={() => setTab('template')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            tab === 'template'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-rose-500'
          }`}
        >
          🖼️ Hazır Şablon Çizim / Boyama
        </button>
      </div>

      {/* Template Selector Bar (If in template mode) */}
      {tab === 'template' && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplateKey(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedTemplateKey === key
                  ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-rose-50/50'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas & SVG Overlay Wrapper */}
      <div className="relative mx-auto w-[340px] sm:w-[360px] h-[340px] sm:h-[360px] rounded-3xl bg-white shadow-2xl border-4 border-rose-100 overflow-hidden touch-none select-none">
        {/* SVG Background Layer for Templates */}
        {activeSvg && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none p-4 opacity-75"
            viewBox="0 0 360 360"
            dangerouslySetInnerHTML={{ __html: activeSvg }}
          />
        )}

        {/* Interactive Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          onMouseDown={handleStartDraw}
          onMouseMove={handleDraw}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleDraw}
          onTouchEnd={handleEndDraw}
          className="absolute inset-0 w-full h-full cursor-crosshair z-10"
        />
      </div>

      {/* Drawing Toolbar */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-md p-4 shadow-lg border border-gray-100 space-y-3">
        {/* Color Palette */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 text-center">
            Fırça Renkleri 🎨
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                title={c.name}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  selectedColor === c.hex
                    ? 'scale-125 border-gray-900 shadow-md'
                    : 'border-white hover:scale-110 shadow-2xs'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Stroke Thickness & Control Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setStrokeWidth(3)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                strokeWidth === 3 ? 'bg-rose-500 text-white' : 'text-gray-600'
              }`}
            >
              İnce (3px)
            </button>
            <button
              onClick={() => setStrokeWidth(7)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                strokeWidth === 7 ? 'bg-rose-500 text-white' : 'text-gray-600'
              }`}
            >
              Orta (7px)
            </button>
            <button
              onClick={() => setStrokeWidth(14)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                strokeWidth === 14 ? 'bg-rose-500 text-white' : 'text-gray-600'
              }`}
            >
              Kalın (14px)
            </button>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Temizle 🗑️
          </button>
        </div>

        {/* Save to Memory Gallery Button */}
        <button
          onClick={handleSaveToGallery}
          disabled={savingMemory}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 py-3 text-xs font-extrabold text-white shadow-md hover:scale-[1.01] active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Gift className="h-4 w-4" /> {savingMemory ? 'Anı Galerisine Kaydediliyor...' : 'Anı Galerisine Kaydet 📸'}
        </button>

        {saveSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-700 animate-in fade-in">
            ✨ Çiziminiz Anı Galerisine başarıyla eklendi!
          </div>
        )}
      </div>
    </div>
  );
}
