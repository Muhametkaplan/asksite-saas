'use client';

import React, { Component, ReactNode, useState } from 'react';
import {
  Gamepad2,
  Ticket,
  Palette,
  BookOpen,
  Hourglass,
  Film,
  Disc,
  Brain,
  Sparkles,
  Heart,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Gift
} from 'lucide-react';
import { CoupleConfig, CouponItem as LibCouponItem } from '@/types/couple';
import { useCoupon } from '@/lib/couples';

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
    return <WheelWidget partner1={partner1} partner2={partner2} />;
  }

  if (module === 'quiz') {
    return <QuizWidget partner1={partner1} partner2={partner2} />;
  }

  if (module === 'diary') {
    return <DiaryWidget partner1={partner1} partner2={partner2} />;
  }

  if (module === 'capsule') {
    return <CapsuleWidget partner1={partner1} partner2={partner2} />;
  }

  if (module === 'cinema') {
    return <CinemaWidget partner1={partner1} partner2={partner2} />;
  }

  if (module === 'therapy') {
    return <TherapyWidget partner1={partner1} partner2={partner2} />;
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
function WheelWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  const rewards = [
    '☕ Yatağa Kahve Servisi',
    '🎬 Dilediğin Filmi Aç',
    '💋 10 Saniye Öpücük',
    '🍰 Tatlı Kaçamağı',
    '🎲 Masaj Yapma Sırası',
    '🎁 Küçük Bir Sürpriz Hediye',
  ];

  const [spinning, setSpinning] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setSelectedReward(null);

    setTimeout(() => {
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setSelectedReward(randomReward);
      setSpinning(false);
      triggerConfetti({ particleCount: 60, spread: 90 });
    }, 2000);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100 text-center">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Aşk Çarkıfeleği 🎡</h3>
      <p className="text-xs text-gray-500 mb-6">Çarkı çevir, şansına ne çıkacağını gör!</p>

      <div
        onClick={spinWheel}
        className={`mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 via-pink-400 to-purple-500 p-2 shadow-2xl cursor-pointer transition-transform ${
          spinning ? 'animate-spin' : 'hover:scale-105'
        }`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center p-4 shadow-inner">
          <Disc className="h-16 w-16 text-rose-500" />
        </div>
      </div>

      <button
        onClick={spinWheel}
        disabled={spinning}
        className="mt-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {spinning ? 'Çark Dönüyor... 🌀' : 'Çarkı Çevir 🚀'}
      </button>

      {selectedReward && (
        <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-center border border-rose-200 animate-in fade-in duration-300">
          <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">
            Çarkın Sonucu ✨
          </div>
          <div className="text-lg font-extrabold text-gray-900">{selectedReward}</div>
        </div>
      )}
    </div>
  );
}

/* ================= 4. QUIZ MODULE ================= */
function QuizWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  const questions = [
    { q: 'En çok hangi yemeği seversiniz?', options: ['Mantı / Pizza', 'Burger / Kebap', 'Sushi / Asya', 'Ev Yemeği'], correct: 0 },
    { q: 'İlk baş başa gittiğiniz yer neresiydi?', options: ['Kafe / Park', 'Sinema', 'Deniz Kenarı', 'AVM'], correct: 0 },
    { q: 'Ortak favori aktiviteniz nedir?', options: ['Dizi / Film İzlemek', 'Geç Saatlere Kadar Sohbet', 'Yemek Yapmak', 'Gezmek'], correct: 1 },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (index: number) => {
    if (index === questions[currentQ].correct) {
      setScore(score + 1);
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setCompleted(true);
      triggerConfetti({ particleCount: 70, spread: 100 });
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
      {!completed ? (
        <div>
          <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
            Soru {currentQ + 1} / {questions.length}
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-4">{questions[currentQ].q}</h3>

          <div className="space-y-2.5">
            {questions[currentQ].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-800 hover:bg-rose-50 hover:text-rose-600 transition border border-gray-200/80 active:scale-98"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-gray-900">Aşk Testi Tamamlandı!</h3>
          <p className="text-sm text-gray-600 mt-2">
            Skorunuz: <span className="font-extrabold text-rose-500">{score} / {questions.length}</span>
          </p>
          <p className="text-xs text-rose-400 mt-1 font-semibold">
            Siz birbiriniz için yaratılmışsınız! ❤️
          </p>
        </div>
      )}
    </div>
  );
}

/* ================= 5. DIARY MODULE ================= */
function DiaryWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100 text-left">
        <div className="flex items-center justify-between text-xs text-rose-500 font-semibold mb-2">
          <span>📅 İlk Tanıştığımız Gün</span>
          <span>❤️</span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          Gözlerinin içine ilk baktığım an, hayatımın dönüm noktasıydı. Gülüşünle dünyamı aydınlattın.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md border border-gray-100 text-left">
        <div className="flex items-center justify-between text-xs text-rose-500 font-semibold mb-2">
          <span>🌊 Birlikte İlk Tatilimiz</span>
          <span>🏖️</span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          Deniz kokusu, gün batımı ve el ele yürüyüşümüz... Unutulmaz anılarımızın en tatlısı.
        </p>
      </div>
    </div>
  );
}

/* ================= 6. CAPSULE MODULE ================= */
function CapsuleWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4">
        <Lock className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Zaman Kapsülü ⏳</h3>
      <p className="text-xs text-gray-500 mb-4">
        Bu mektup <span className="font-bold text-amber-600">1 Yıl Sonra</span> otomatik olarak kilitli kasadan açılacak!
      </p>
      <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200 text-left italic">
        "Gelecekteki bize not: Umarım yine böyle sarılarak, gülerek ve aşkla birbirimizin gözlerine bakıyoruzdur."
      </div>
    </div>
  );
}

/* ================= 7. CINEMA MODULE ================= */
function CinemaWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-gray-900">🎬 La La Land (Aşıklar Şehri)</h4>
          <span className="text-[10px] text-gray-500">Birlikte İzleme Tarihi: 2024</span>
        </div>
        <span className="text-xs font-bold text-amber-500">⭐⭐⭐⭐⭐</span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-gray-900">🍿 About Time (Zamanda Aşk)</h4>
          <span className="text-[10px] text-gray-500">İstek Listesinde</span>
        </div>
        <span className="text-xs font-bold text-rose-500">Sıradaki Film 🎥</span>
      </div>
    </div>
  );
}

/* ================= 8. THERAPY MODULE ================= */
function TherapyWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100 text-center">
      <Palette className="h-10 w-10 text-purple-500 mx-auto mb-3" />
      <h3 className="text-base font-bold text-gray-900 mb-2">Çift Sanat & Terapi Köşesi</h3>
      <p className="text-xs text-gray-600 leading-relaxed">
        Birlikte tuvale dokunarak renklerle duygularınızı ifade edin. Sanat ve sevgi ruhunuzu dinlendirir!
      </p>
    </div>
  );
}
