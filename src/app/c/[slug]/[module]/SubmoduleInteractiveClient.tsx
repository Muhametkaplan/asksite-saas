'use client';

import { useState } from 'react';
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
import confetti from 'canvas-confetti';
import { CoupleConfig } from '@/types/couple';

interface SubmoduleClientProps {
  module: string;
  couple: CoupleConfig;
}

export default function SubmoduleInteractiveClient({ module, couple }: SubmoduleClientProps) {
  // --- 1. GAMES MODULE ---
  if (module === 'games') {
    return <GamesWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 2. COUPONS MODULE ---
  if (module === 'coupons') {
    return <CouponsWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 3. WHEEL MODULE ---
  if (module === 'wheel') {
    return <WheelWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 4. QUIZ MODULE ---
  if (module === 'quiz') {
    return <QuizWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 5. DIARY MODULE ---
  if (module === 'diary') {
    return <DiaryWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 6. CAPSULE MODULE ---
  if (module === 'capsule') {
    return <CapsuleWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 7. CINEMA MODULE ---
  if (module === 'cinema') {
    return <CinemaWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  // --- 8. THERAPY MODULE ---
  if (module === 'therapy') {
    return <TherapyWidget partner1={couple.partner1_name} partner2={couple.partner2_name} />;
  }

  return (
    <div className="rounded-3xl bg-white p-6 text-center text-gray-500 shadow-md">
      Bu modül şu an aktif.
    </div>
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
        confetti({ particleCount: 40, spread: 60 });
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
          {winner === 'Berabere' ? '🤝 Oyun Berabere Bitti!' : `🎉 Kazan taraf: ${winner}!`}
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
function CouponsWidget({ partner1, partner2 }: { partner1: string; partner2: string }) {
  const [coupons, setCoupons] = useState([
    { title: '💆‍♂️ 20 Dakika Omuz & Sırt Masajı', code: 'MASAJ-2026', used: false },
    { title: '🍿 İstediğin Filmi Seçme Hakkı', code: 'SİNEMA-PASS', used: false },
    { title: '🍕 En Sevdiğin Yemeği Ismarlama', code: 'YEMEK-VIP', used: false },
    { title: '🕊️ Sınırsız Barışma & Sarılma Kartı', code: 'SARILMA-CARD', used: false },
  ]);

  const redeemCoupon = (idx: number) => {
    const updated = [...coupons];
    updated[idx].used = true;
    setCoupons(updated);
    confetti({ particleCount: 50, spread: 70 });
  };

  return (
    <div className="space-y-4">
      {coupons.map((c, i) => (
        <div
          key={i}
          className={`rounded-3xl p-5 border shadow-md transition ${
            c.used
              ? 'bg-gray-100 border-gray-200 opacity-60'
              : 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 hover:shadow-lg'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-base font-bold text-gray-900">{c.title}</h4>
              <p className="text-xs text-rose-500 font-mono mt-1">Kod: {c.code}</p>
            </div>
            {c.used ? (
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Kullanıldı
              </span>
            ) : (
              <button
                onClick={() => redeemCoupon(i)}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-600 active:scale-95"
              >
                Kullan ✨
              </button>
            )}
          </div>
        </div>
      ))}
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
      confetti({ particleCount: 60, spread: 90 });
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
      confetti({ particleCount: 70, spread: 100 });
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
