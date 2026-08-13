'use client';

import React, { Component, ReactNode, useState, useEffect, useRef, useMemo } from 'react';
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
  Trash2,
  Gift,
  Film,
  Star,
  ExternalLink
} from 'lucide-react';
import { CoupleConfig, CouponItem as LibCouponItem, MemoryItem, DiaryEntry, CapsuleItem, MovieItem, QuizQuestion, CanvasDrawing } from '@/types/couple';
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
  saveQuizScore,
  addCanvasDrawing,
  getCanvasDrawings,
  deleteCanvasDrawing,
  saveGameScore,
  getXoxScore,
  saveXoxScore,
  getDinoHighScores,
  saveDinoHighScore,
  getArcadeHighScores,
  saveArcadeHighScore,
  save2048State,
  get2048State,
  subscribeTo2048Games,
  Game2048StateData,
  formatDiaryDate,
  CanvasStrokeData,
} from '@/lib/couples';
import { isDeviceAuthorized } from '@/lib/deviceSession';
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
    return <GamesWidget couple={couple} />;
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

/* ================= 1. GAMES MODULE (MINI GAME SUITE) ================= */
function GamesWidget({ couple }: { couple: CoupleConfig }) {
  const partner1 = couple?.partner1_name || 'Partner 1';
  const partner2 = couple?.partner2_name || 'Partner 2';
  const slug = couple?.slug || 'demo';

  const [activeTab, setActiveTab] = useState<'menu' | 'dino' | 'flappy' | '2048' | 'tower' | 'duel' | 'memory' | 'tod' | 'xox' | 'tkm'>('menu');

  // Read Session Auth for seamless uninterrupted play across devices
  const authState = useMemo<{ role: 'partner1' | 'partner2' | 'guest'; author: string; isPartner: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('asksite_auth_' + slug) || localStorage.getItem('asksite_auth_' + slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          let role: 'partner1' | 'partner2' | 'guest' = parsed.role === 'partner1' || parsed.role === 'partner2' ? parsed.role : 'guest';
          let author = parsed.partnerName || (role === 'partner1' ? partner1 : role === 'partner2' ? partner2 : 'Partner');

          if (parsed.partnerName) {
            const pNorm = (parsed.partnerName || '').trim().toLocaleLowerCase('tr');
            const p1Norm = (partner1 || '').trim().toLocaleLowerCase('tr');
            const p2Norm = (partner2 || '').trim().toLocaleLowerCase('tr');
            if (pNorm === p1Norm) role = 'partner1';
            else if (pNorm === p2Norm) role = 'partner2';
          }

          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) { }
      }

      const deviceCheck = isDeviceAuthorized(couple);
      if (deviceCheck.isAuthorized && deviceCheck.role) {
        const role = deviceCheck.role;
        const author = deviceCheck.partnerName || (role === 'partner1' ? partner1 : partner2);
        return { role, author, isPartner: true };
      }
    }
    return { role: 'partner1', author: partner1, isPartner: true };
  }, [slug, partner1, partner2, couple]);

  return (
    <div className="space-y-4">
      {/* Navigation Sub-Header */}
      {activeTab !== 'menu' && (
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-rose-100 shadow-sm mb-3">
          <button
            onClick={() => setActiveTab('menu')}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 transition active:scale-95"
          >
            ← Oyun Menüsü
          </button>
          <span className="text-xs font-extrabold text-gray-800">
            🎮 {authState.author} Oynuyor
          </span>
        </div>
      )}

      {/* 1. MENU HUB */}
      {activeTab === 'menu' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="rounded-3xl bg-white/90 backdrop-blur-md p-6 text-center shadow-xl border border-rose-100 space-y-2">
            <span className="text-3xl">🎮</span>
            <h3 className="text-xl font-black text-gray-900">Aşk Salonumuz & Mini Oyunlar</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Sevgilinizle birlikte eğlenin, düello yapın ve skorlarınızı kaydedin! ❤️
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Dino Runner */}
            <button
              onClick={() => setActiveTab('dino')}
              className="col-span-2 flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition text-center group active:scale-98"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🦖🏃‍♂️</div>
              <h4 className="text-sm font-black text-white">Sonsuz Aşk Koşusu (Dino Runner)</h4>
              <p className="text-xs text-white/90 font-bold mt-0.5">Chrome Dino Orijinal Motoru 🏆</p>
            </button>

            {/* Flappy Bird */}
            <button
              onClick={() => setActiveTab('flappy')}
              className="flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md hover:shadow-xl transition text-center group active:scale-95"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🐤</div>
              <h4 className="text-xs font-black text-white">Flappy Bird</h4>
              <p className="text-[10px] text-sky-100 font-bold mt-0.5">Orijinal Fizik & Borular</p>
            </button>

            {/* 2048 */}
            <button
              onClick={() => setActiveTab('2048')}
              className="flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:shadow-xl transition text-center group active:scale-95"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🧩</div>
              <h4 className="text-xs font-black text-white">2048 Klasik</h4>
              <p className="text-[10px] text-amber-100 font-bold mt-0.5">Stratejik Matris</p>
            </button>

            {/* Tower Stacker */}
            <button
              onClick={() => setActiveTab('tower')}
              className="col-span-2 flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition text-center group active:scale-98"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🏰</div>
              <h4 className="text-sm font-black text-white">Tower Stacker (Kule Denge)</h4>
              <p className="text-xs text-white/90 font-bold mt-0.5">Sonsuz Kule İnşası 🧱</p>
            </button>

            {/* Click Duel (Halat Çekme) */}
            <button
              onClick={() => setActiveTab('duel')}
              className="col-span-2 flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition text-center group active:scale-98"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🤼</div>
              <h4 className="text-sm font-black text-white">Tıklama & Halat Çekme Düellosu</h4>
              <p className="text-xs text-white/90 font-bold mt-0.5">Kırmızı vs Mavi Hız Yarışı 🔴🔵</p>
            </button>

            {/* Memory Match */}
            <button
              onClick={() => setActiveTab('memory')}
              className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-rose-100 shadow-md hover:shadow-xl transition text-center group active:scale-95"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🃏</div>
              <h4 className="text-xs font-black text-gray-900">3D Hafıza Kartları</h4>
              <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Kart Eşleştirme</p>
            </button>

            {/* Truth or Dare */}
            <button
              onClick={() => setActiveTab('tod')}
              className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-rose-100 shadow-md hover:shadow-xl transition text-center group active:scale-95"
            >
              <div className="text-4xl mb-2 group-hover:rotate-12 transition-transform duration-300">🔥</div>
              <h4 className="text-xs font-black text-gray-900">Doğruluk mu Cesaret mi?</h4>
              <p className="text-[10px] text-red-500 font-bold mt-0.5">Çift Özel Kartlar</p>
            </button>

            {/* XOX */}
            <button
              onClick={() => setActiveTab('xox')}
              className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-rose-100 shadow-md hover:shadow-xl transition text-center group active:scale-95"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">❌⭕</div>
              <h4 className="text-xs font-black text-gray-900">Neon XOX Oyunu</h4>
              <p className="text-[10px] text-pink-500 font-bold mt-0.5">X vs O Klasik</p>
            </button>

            {/* TKM */}
            <button
              onClick={() => setActiveTab('tkm')}
              className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-rose-100 shadow-md hover:shadow-xl transition text-center group active:scale-95"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">✊✌️</div>
              <h4 className="text-xs font-black text-gray-900">Taş Kağıt Makas</h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Aşk Düellosu</p>
            </button>
          </div>
        </div>
      )}

      {/* 2. DINO RUNNER */}
      {activeTab === 'dino' && (
        <DinoRunnerGame
          partner1={partner1}
          partner2={partner2}
          slug={slug}
          playerName={authState.author}
          role={authState.role}
        />
      )}

      {/* FLAPPY BIRD */}
      {activeTab === 'flappy' && (
        <FlappyBirdGame
          partner1={partner1}
          partner2={partner2}
          slug={slug}
          playerName={authState.author}
          role={authState.role}
        />
      )}

      {/* 2048 */}
      {activeTab === '2048' && (
        <Game2048
          partner1={partner1}
          partner2={partner2}
          slug={slug}
          playerName={authState.author}
          role={authState.role}
        />
      )}

      {/* TOWER STACKER */}
      {activeTab === 'tower' && (
        <TowerStackerGame
          partner1={partner1}
          partner2={partner2}
          slug={slug}
          playerName={authState.author}
          role={authState.role}
        />
      )}

      {/* 3. CLICK DUEL (HALAT ÇEKME) */}
      {activeTab === 'duel' && <ClickDuelGame partner1={partner1} partner2={partner2} slug={slug} playerName={authState.author} />}

      {/* 4. 3D MEMORY MATCH */}
      {activeTab === 'memory' && <MemoryMatchGame slug={slug} playerName={authState.author} />}

      {/* 5. TRUTH OR DARE */}
      {activeTab === 'tod' && <TruthOrDareGame slug={slug} playerName={authState.author} />}

      {/* 6. NEON XOX */}
      {activeTab === 'xox' && <NeonXoxGame partner1={partner1} partner2={partner2} slug={slug} playerName={authState.author} />}

      {/* 7. ROCK PAPER SCISSORS (TKM) */}
      {activeTab === 'tkm' && <RockPaperScissorsGame slug={slug} playerName={authState.author} />}
    </div>
  );
}

/* --- SUB-GAME 1: DINO RUNNER (JUICY 2D PARALLAX RUNNER & ASYNC LEADERBOARD) --- */
function playDinoSFX(type: 'jump' | 'milestone' | 'gameover', isMuted: boolean) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'milestone') {
      // Classic Chrome Dino 2-tone retro double beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.05);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.06);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.06);
      osc2.stop(ctx.currentTime + 0.12);
    } else if (type === 'gameover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
}

function DinoRunnerGame({
  partner1,
  partner2,
  slug,
  playerName,
  role,
}: {
  partner1: string;
  partner2: string;
  slug: string;
  playerName: string;
  role: 'partner1' | 'partner2' | 'guest';
}) {
  const [highScores, setHighScores] = useState<{ p1Score: number; p2Score: number }>({ p1Score: 0, p2Score: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState('6.0');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isDuckingRef = useRef(false);
  const touchStartYRef = useRef(0);

  // Load existing high scores from Firestore on mount
  useEffect(() => {
    async function loadScores() {
      if (slug) {
        const fetched = await getDinoHighScores(slug);
        setHighScores(fetched);
      }
    }
    loadScores();
  }, [slug]);

  // Determine current champion
  const championName = useMemo(() => {
    if (highScores.p1Score === 0 && highScores.p2Score === 0) return 'Henüz Rekor Yok 🎯';
    if (highScores.p1Score > highScores.p2Score) return `🌸 Kız Partner (${partner1})`;
    if (highScores.p2Score > highScores.p1Score) return `🔵 Erkek Partner (${partner2})`;
    return 'Berabere 🤝';
  }, [highScores, partner1, partner2]);

  // Game Engine logic
  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setIsNewRecord(false);
    setCurrentScore(0);
    setCurrentSpeed('6.0');
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let distanceRan = 0;
    let score = 0;
    let shakeTimer = 0;
    let scoreFlashTimer = 0;
    let liveRecordBroken = false;

    // Chromium Dino Engine Constants
    const groundY = 320;
    let speed = 6.0;
    const maxSpeed = 14.0;
    const acceleration = 0.0015;

    const previousRecord = role === 'partner1' ? highScores.p1Score : highScores.p2Score;

    // Clouds & Night Horizon Stars
    const clouds = Array.from({ length: 4 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * 80 + 30,
      size: Math.random() * 20 + 30,
    }));

    const stars = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * 150 + 10,
      size: Math.random() * 2 + 1,
    }));

    // T-Rex Runner State
    const dino = {
      x: 70,
      y: groundY - 47,
      normalWidth: 44,
      normalHeight: 47,
      duckWidth: 59,
      duckHeight: 30,
      vy: 0,
      jumpVelocity: -12.5,
      gravity: 0.65,
      isJumping: false,
    };

    let obstacles: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'cactus' | 'pterodactyl';
      wingState?: number;
    }> = [];

    const jump = () => {
      if (!dino.isJumping) {
        dino.vy = dino.jumpVelocity;
        dino.isJumping = true;
        playDinoSFX('jump', isMuted);
      }
    };

    // Controls (Jump: Space / ArrowUp; Duck: ArrowDown / KeyS)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        isDuckingRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        isDuckingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let isRunning = true;

    const loop = () => {
      frameCount++;
      distanceRan += speed * 0.15;
      score = Math.floor(distanceRan);
      setCurrentScore(score);

      // Smooth acceleration like Chromium Runner
      if (speed < maxSpeed) {
        speed += acceleration;
      }
      setCurrentSpeed(speed.toFixed(1));

      // Chrome Dino 100-point double beep & flash
      if (score > 0 && score % 100 === 0 && frameCount % 6 === 0) {
        playDinoSFX('milestone', isMuted);
        shakeTimer = 5;
        scoreFlashTimer = 12;
      }

      // Check Live Record Breaking
      if (!liveRecordBroken && previousRecord > 0 && score > previousRecord) {
        liveRecordBroken = true;
        triggerConfetti({ particleCount: 75, spread: 85 });
        playDinoSFX('milestone', isMuted);
      }

      // Physics update
      dino.y += dino.vy;
      dino.vy += dino.gravity;

      const isDucking = isDuckingRef.current && !dino.isJumping;
      const currentHeight = isDucking ? dino.duckHeight : dino.normalHeight;
      const currentWidth = isDucking ? dino.duckWidth : dino.normalWidth;
      const currentGroundY = isDucking ? groundY - dino.duckHeight : groundY - dino.normalHeight;

      if (dino.y >= currentGroundY) {
        dino.y = currentGroundY;
        dino.vy = 0;
        dino.isJumping = false;
      }

      // Update Parallax Backgrounds
      clouds.forEach((cloud) => {
        cloud.x -= speed * 0.2;
        if (cloud.x < -cloud.size) cloud.x = canvas.width + cloud.size;
      });

      stars.forEach((star) => {
        star.x -= speed * 0.1;
        if (star.x < 0) star.x = canvas.width;
      });

      // Spawn Obstacles (Cacti or Pterodactyls)
      const spawnInterval = Math.max(45, Math.floor(110 - speed * 4));
      if (frameCount % spawnInterval === 0) {
        const canFly = score >= 300;
        if (canFly && Math.random() < 0.3) {
          // Low Flying Pterodactyl (Dodged by ducking!)
          obstacles.push({
            x: canvas.width,
            y: groundY - 58,
            width: 46,
            height: 38,
            type: 'pterodactyl',
            wingState: 0,
          });
        } else {
          // Cactus cluster
          const isLarge = Math.random() < 0.4;
          obstacles.push({
            x: canvas.width,
            y: isLarge ? groundY - 50 : groundY - 38,
            width: isLarge ? 34 : 24,
            height: isLarge ? 50 : 38,
            type: 'cactus',
          });
        }
      }

      // Move obstacles
      obstacles = obstacles.map((obs) => {
        if (obs.type === 'pterodactyl' && frameCount % 10 === 0) {
          obs.wingState = obs.wingState === 0 ? 1 : 0;
        }
        return { ...obs, x: obs.x - speed };
      }).filter((obs) => obs.x + obs.width > 0);

      // --- CANVAS DRAWING (Native Chromium Dino Aesthetics) ---
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (shakeTimer > 0) {
        shakeTimer--;
        ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      }

      // Day / Night background shift based on score
      const isNight = Math.floor(score / 700) % 2 === 1;
      if (isNight) {
        ctx.fillStyle = '#171717';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f5f5f5';
        stars.forEach((star) => {
          ctx.fillRect(star.x, star.y, star.size, star.size);
        });
      } else {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Clouds
      ctx.fillStyle = isNight ? '#404040' : '#d4d4d4';
      clouds.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground Horizon Line
      ctx.strokeStyle = isNight ? '#737373' : '#525252';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Horizon Bumps
      ctx.fillStyle = isNight ? '#737373' : '#525252';
      for (let i = 0; i < canvas.width; i += 60) {
        const bumpX = (i - (frameCount * speed) % 60 + canvas.width) % canvas.width;
        ctx.fillRect(bumpX, groundY + 4, 4, 2);
        ctx.fillRect(bumpX + 20, groundY + 8, 8, 2);
      }

      // Draw Native Chrome Dino T-Rex Character
      ctx.save();
      ctx.translate(dino.x, dino.y);

      ctx.fillStyle = isNight ? '#e5e5e5' : '#333333';
      ctx.strokeStyle = isNight ? '#e5e5e5' : '#333333';

      if (isDucking) {
        // --- DUCKING T-REX SPRITE ---
        ctx.fillRect(0, 8, 52, 20); // Low body
        ctx.fillRect(36, 0, 20, 14); // Low head
        ctx.fillRect(52, 4, 4, 4); // Eye
        ctx.fillRect(-8, 10, 10, 6); // Tail
        // Legs
        const legPhase = frameCount % 8 < 4 ? 0 : 6;
        ctx.fillRect(12 + legPhase, 24, 6, 8);
        ctx.fillRect(28 - legPhase, 24, 6, 8);
      } else if (dino.isJumping) {
        // --- JUMPING T-REX SPRITE ---
        ctx.fillRect(8, 0, 32, 40); // Body
        ctx.fillRect(24, -8, 20, 16); // Head
        ctx.fillStyle = isNight ? '#171717' : '#fafafa';
        ctx.fillRect(38, -4, 4, 4); // Eye
        ctx.fillStyle = isNight ? '#e5e5e5' : '#333333';
        ctx.fillRect(0, 14, 10, 8); // Tail
        ctx.fillRect(12, 38, 6, 8); // Tucked Left leg
        ctx.fillRect(24, 38, 6, 8); // Tucked Right leg
      } else {
        // --- RUNNING T-REX SPRITE ---
        ctx.fillRect(8, 0, 32, 40); // Body
        ctx.fillRect(24, -8, 20, 16); // Head
        ctx.fillStyle = isNight ? '#171717' : '#fafafa';
        ctx.fillRect(38, -4, 4, 4); // Eye
        ctx.fillStyle = isNight ? '#e5e5e5' : '#333333';
        ctx.fillRect(0, 14, 10, 8); // Tail
        // Alternating Running Legs
        const legStep = frameCount % 8 < 4;
        ctx.fillRect(14, 38, 6, legStep ? 10 : 4);
        ctx.fillRect(26, 38, 6, legStep ? 4 : 10);
      }
      ctx.restore();

      // Draw Obstacles (Cacti & Pterodactyls)
      for (const obs of obstacles) {
        ctx.fillStyle = isNight ? '#e5e5e5' : '#333333';
        if (obs.type === 'pterodactyl') {
          // Pterodactyl Sprite (Wing Flap)
          ctx.fillRect(obs.x, obs.y + 10, 36, 12); // Body
          ctx.fillRect(obs.x + 30, obs.y + 2, 14, 12); // Head & Beak
          if (obs.wingState === 0) {
            ctx.fillRect(obs.x + 12, obs.y - 12, 12, 22); // Wings Up
          } else {
            ctx.fillRect(obs.x + 12, obs.y + 16, 12, 18); // Wings Down
          }
        } else {
          // Cactus Sprite
          ctx.fillRect(obs.x + (obs.width / 2 - 4), obs.y, 8, obs.height);
          ctx.fillRect(obs.x, obs.y + 10, obs.width, 6);
          ctx.fillRect(obs.x, obs.y + 4, 4, 12);
          ctx.fillRect(obs.x + obs.width - 4, obs.y + 4, 4, 12);
        }

        // Tightened 80% Bounding Box Collision Check
        const rInsetX = currentWidth * 0.1;
        const rInsetY = currentHeight * 0.1;
        const dinoBox = {
          x: dino.x + rInsetX,
          y: dino.y + rInsetY,
          width: currentWidth * 0.8,
          height: currentHeight * 0.8,
        };

        const obsBox = {
          x: obs.x + obs.width * 0.1,
          y: obs.y + obs.height * 0.1,
          width: obs.width * 0.8,
          height: obs.height * 0.8,
        };

        if (
          dinoBox.x < obsBox.x + obsBox.width &&
          dinoBox.x + dinoBox.width > obsBox.x &&
          dinoBox.y < obsBox.y + obsBox.height &&
          dinoBox.y + dinoBox.height > obsBox.y
        ) {
          // Collision! Game Over
          isRunning = false;
          break;
        }
      }

      // Draw HUD Score & High Score
      if (scoreFlashTimer > 0) {
        scoreFlashTimer--;
        ctx.fillStyle = '#eab308';
      } else {
        ctx.fillStyle = isNight ? '#e5e5e5' : '#525252';
      }
      ctx.font = '700 16px monospace';
      const formattedScore = String(score).padStart(5, '0');
      const formattedHI = String(previousRecord).padStart(5, '0');
      ctx.fillText(`HI ${formattedHI}  ${formattedScore}`, canvas.width - 180, 30);

      // Real-time Record Broken Banner
      if (liveRecordBroken) {
        ctx.fillStyle = '#eab308';
        ctx.font = '700 14px monospace';
        ctx.fillText('🏆 YENİ REKOR! 🏆', canvas.width / 2 - 70, 30);
      }

      ctx.restore();

      if (isRunning) {
        animationFrameId.current = requestAnimationFrame(loop);
      } else {
        // Handle Game Over
        setIsPlaying(false);
        setGameOver(true);
        playDinoSFX('gameover', isMuted);

        const currentFinalScore = score;
        const isP1 = role === 'partner1';

        if (currentFinalScore > previousRecord) {
          setIsNewRecord(true);
          const updatedScores = {
            p1Score: isP1 ? currentFinalScore : highScores.p1Score,
            p2Score: !isP1 ? currentFinalScore : highScores.p2Score,
          };
          setHighScores(updatedScores);
          saveDinoHighScore(slug, updatedScores.p1Score, updatedScores.p2Score);
          saveGameScore(slug, 'Chrome Dino', currentFinalScore, playerName);
        }
      }
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, role, slug, playerName, highScores, isMuted]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95 duration-200 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦖</span>
          <h3 className="text-xl font-black text-gray-900">Chrome Dinozor Oyunu (Runner Engine)</h3>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black hover:bg-gray-200 transition active:scale-95 border border-gray-200"
          title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
        >
          {isMuted ? '🔇 Ses Kapalı' : '🔊 Ses Açık'}
        </button>
      </div>

      {/* Leaderboard Panel */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50 border border-gray-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-2 text-pink-600">
            <span>🌸 Kız Partner ({partner1})</span>
            <span className="rounded-xl bg-pink-100 px-3 py-1 text-xs font-black text-pink-700 shadow-2xs">
              {highScores.p1Score} Puan
            </span>
          </div>

          <div className="flex items-center gap-2 text-blue-600">
            <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 shadow-2xs">
              {highScores.p2Score} Puan
            </span>
            <span>🔵 Erkek Partner ({partner2})</span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-2 text-xs font-extrabold text-gray-800 flex items-center justify-center gap-1">
          <span>🏆 Şampiyon:</span> <span className="text-zinc-800 font-black text-sm">{championName}</span>
        </div>
      </div>

      {/* Chrome Dino Engine Canvas */}
      <div
        className="relative mx-auto w-full max-w-4xl bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-300 cursor-pointer touch-none select-none"
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            touchStartYRef.current = e.touches[0].clientY;
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            const deltaY = e.touches[0].clientY - touchStartYRef.current;
            if (deltaY > 25) {
              isDuckingRef.current = true;
            }
          }
        }}
        onTouchEnd={() => {
          isDuckingRef.current = false;
        }}
        onClick={(e) => {
          if (isPlaying) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            if (clickY > rect.height * 0.65) {
              isDuckingRef.current = true;
              setTimeout(() => {
                isDuckingRef.current = false;
              }, 600);
            } else {
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            }
          }
        }}
      >
        <canvas ref={canvasRef} width={800} height={380} className="w-full max-w-full h-auto block touch-none" />

        {/* Overlay Modal */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-4 z-30 animate-in fade-in duration-200">
            {gameOver ? (
              <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-md p-6 text-center shadow-2xl space-y-4 border border-gray-200 animate-in zoom-in-95">
                {isNewRecord ? (
                  <div className="space-y-1.5">
                    <div className="text-5xl animate-bounce">🎉</div>
                    <h4 className="text-lg font-black text-emerald-600">TEBRİKLER! YENİ REKOR!</h4>
                    <p className="text-xs text-gray-600 font-bold">Chrome Dino rekorunu kırdınız!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-4xl">💥</div>
                    <h4 className="text-lg font-black text-gray-900">GAME OVER</h4>
                  </div>
                )}

                <div className="py-3 px-4 bg-gray-100 rounded-2xl border border-gray-200 text-xs font-black text-gray-800 flex items-center justify-around font-mono">
                  <span>SCORE: <strong className="text-base text-gray-900">{currentScore}</strong></span>
                  <span>SPEED: <strong className="text-base text-emerald-600">{currentSpeed}</strong></span>
                </div>

                <button
                  onClick={startGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-gray-800 via-gray-900 to-black py-3.5 text-xs font-black text-white shadow-lg hover:scale-102 active:scale-95 transition"
                >
                  Oyna 🔄
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-md">
                <div className="text-5xl animate-bounce">🦖</div>
                <h4 className="text-2xl font-black text-white font-mono drop-shadow-md">CHROME DINO RUNNER</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-mono">
                  Zıplama: <span className="font-bold text-emerald-400">Space / Up</span> | Eğilme: <span className="font-bold text-emerald-400">Down / S</span>
                  <br />
                  Mobilde zıplamak için dokunun, eğilmek için aşağı sürükleyin!
                </p>
                <button
                  onClick={startGame}
                  className="rounded-2xl bg-gradient-to-r from-gray-800 via-gray-900 to-black px-10 py-3.5 text-sm font-black text-white shadow-xl hover:scale-105 active:scale-95 transition border border-gray-600 font-mono"
                >
                  START GAME 🚀
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Explicit Controls */}
      {isPlaying && (
        <div className="flex items-center justify-center gap-4 pt-1 md:hidden">
          <button
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
            className="flex-1 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black shadow-md active:scale-95 font-mono"
          >
            🦘 JUMP (Space)
          </button>
          <button
            onPointerDown={() => {
              isDuckingRef.current = true;
            }}
            onPointerUp={() => {
              isDuckingRef.current = false;
            }}
            className="flex-1 py-3 bg-gray-700 text-white rounded-2xl text-xs font-black shadow-md active:scale-95 font-mono"
          >
            👇 DUCK (Down)
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 font-medium">
        💡 DinoRunner.com standartlarında pürüzsüz hızlanma ve 350+ puandan sonra gelen alçak uçan engellere karşı eğilme!
      </p>
    </div>
  );
}

/* --- SUB-GAME 2: CLICK DUEL / HALAT ÇEKME --- */
function ClickDuelGame({ partner1, partner2, slug, playerName }: { partner1: string; partner2: string; slug: string; playerName: string }) {
  const [redVal, setRedVal] = useState(50); // 0 to 100 scale, 50 is center
  const [winner, setWinner] = useState<string | null>(null);

  const handleRedClick = () => {
    if (winner) return;
    const next = redVal + 4;
    if (next >= 100) {
      setRedVal(100);
      setWinner(partner1);
      triggerConfetti({ particleCount: 80, spread: 90 });
      saveGameScore(slug, 'Tıklama Düellosu', 100, partner1);
    } else {
      setRedVal(next);
    }
  };

  const handleBlueClick = () => {
    if (winner) return;
    const next = redVal - 4;
    if (next <= 0) {
      setRedVal(0);
      setWinner(partner2);
      triggerConfetti({ particleCount: 80, spread: 90 });
      saveGameScore(slug, 'Tıklama Düellosu', 100, partner2);
    } else {
      setRedVal(next);
    }
  };

  const resetDuel = () => {
    setRedVal(50);
    setWinner(null);
  };

  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xl border border-rose-100 space-y-5 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-black text-gray-900">🤼 Tıklama & Halat Çekme Düellosu</h3>
      <p className="text-xs text-gray-500">
        Ekrandaki kendi renginize olabildiğince hızlı tıklayın ve halatı kendi tarafınıza çekin!
      </p>

      {/* Live Tug-of-war Progress Track */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-black">
          <span className="text-rose-600 font-bold">🔴 {partner1}: %{redVal}</span>
          <span className="text-indigo-600 font-bold">🔵 {partner2}: %{100 - redVal}</span>
        </div>

        <div className="relative h-6 w-full rounded-full bg-gray-100 overflow-hidden border border-gray-200 shadow-inner">
          {/* Middle Indicator */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-400 z-10 opacity-70" />

          {/* Dynamic Tug Fill */}
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 transition-all duration-150 ease-out"
            style={{ width: `${redVal}%` }}
          />

          {/* Tug Marker Icon */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center text-xs z-20 transition-all duration-150"
            style={{ left: `${redVal}%` }}
          >
            📍
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {winner && (
        <div className="p-3 bg-emerald-50 text-emerald-700 font-extrabold text-sm rounded-2xl animate-bounce border border-emerald-200">
          🏆 Düelloyu Kazanan: <span className="text-rose-600">{winner}</span>! 🎉
        </div>
      )}

      {/* Mobile-Responsive Side-by-Side Click Buttons */}
      <div className="grid grid-cols-2 gap-3.5 pt-2">
        <button
          onClick={handleRedClick}
          disabled={!!winner}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-xs sm:text-sm shadow-lg hover:opacity-95 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          🔴 {partner1} <br className="sm:hidden" /> Tıkla!
        </button>

        <button
          onClick={handleBlueClick}
          disabled={!!winner}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs sm:text-sm shadow-lg hover:opacity-95 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          🔵 {partner2} <br className="sm:hidden" /> Tıkla!
        </button>
      </div>

      <button
        onClick={resetDuel}
        className="w-full rounded-2xl bg-gray-100 border border-gray-200 py-3 text-xs font-extrabold text-gray-700 hover:bg-gray-200 transition active:scale-95"
      >
        Düelloyu Sıfırla 🔄
      </button>
    </div>
  );
}

/* --- SUB-GAME 2: 3D MEMORY MATCH (WITH PERSPECTIVE FLIP) --- */
function MemoryMatchGame({ slug, playerName }: { slug: string; playerName: string }) {
  const initialCards = ['❤️', '❤️', '💖', '💖', '🌹', '🌹', '🍿', '🍿', '💍', '💍', '🎨', '🎨', '✈️', '✈️', '💌', '💌'];

  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    setCards([...initialCards].sort(() => Math.random() - 0.5));
  }, []);

  const handleCardClick = (idx: number) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (cards[first] === cards[second]) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) {
          triggerConfetti({ particleCount: 80, spread: 90 });
          saveGameScore(slug, 'Hafıza Kartları', Math.max(10, 100 - moves * 5), playerName);
        }
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const resetMemoryGame = () => {
    setCards([...initialCards].sort(() => Math.random() - 0.5));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xl border border-rose-100 space-y-4 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-black text-gray-900">🃏 3D Hafıza Kartı Oyunu</h3>
      <p className="text-xs text-gray-500">Kartları çevirin ve aynı aşk sembollerini eşleştirin. Hamle: {moves}</p>

      {/* 3D Flip Grid */}
      <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto">
        {cards.map((emoji, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(idx);
          return (
            <div
              key={idx}
              onClick={() => handleCardClick(idx)}
              className="h-16 w-full cursor-pointer"
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative h-full w-full rounded-2xl transition-transform duration-500 shadow-sm"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front face (Face Down) */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-white text-xl font-bold border-2 border-white/80 shadow-sm"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  ❓
                </div>

                {/* Back face (Revealed Emoji) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-2xl text-2xl font-bold border-2 shadow-inner ${matched.includes(idx) ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-rose-300'
                    }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {emoji}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {matched.length === cards.length && (
        <div className="p-3 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl animate-bounce border border-emerald-200">
          🎉 Tebrikler! Tüm kartları {moves} hamlede eşleştirdiniz!
        </div>
      )}

      <button
        onClick={resetMemoryGame}
        className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-xs font-black text-white shadow-md hover:scale-102 active:scale-95 transition"
      >
        Kartları Karıştır & Baştan Oyna 🔄
      </button>
    </div>
  );
}

/* --- SUB-GAME 3: TRUTH OR DARE --- */
function TruthOrDareGame({ slug, playerName }: { slug: string; playerName: string }) {
  const truths = [
    "Beni ilk gördüğünde aklından geçen ilk düşünce neydi? 💭",
    "Benimle ilgili en çok hayran olduğun kişilik özelliğim nedir? 💖",
    "Birlikte yaşadığımız en utanç verici ama komik anımız hangisi? 🤣",
    "Beni en çok kıskandığın an ne zamandı? 🙈",
    "Gelecekte birlikte gitmek istediğin 3 ülkeyi sırayla say 🗺️",
  ];

  const dares = [
    "Partnerine 10 saniye boyunca romantik bir cümle kurarak gözlerinin içine bak 💖",
    "Sevgilinin yanağına en tatlı öpücüğünü kondur ve bir özçekim yap 📸",
    "En sevdiğiniz aşk şarkısının nakaratını partnerinle birlikte söyle 🎵",
    "Partnerine 30 saniyelik harika bir omuz masajı yap 💆‍♂️",
    "Telefonundan en tatlı fotoğrafınızı aç ve ekran kağıdı yap 📱",
  ];

  const [activeType, setActiveType] = useState<'truth' | 'dare'>('truth');
  const [currentText, setCurrentText] = useState<string | null>(null);

  const drawCard = (type: 'truth' | 'dare') => {
    setActiveType(type);
    const list = type === 'truth' ? truths : dares;
    const random = list[Math.floor(Math.random() * list.length)];
    setCurrentText(random);
    saveGameScore(slug, `Doğruluk mu Cesaret mi (${type})`, 50, playerName);
  };

  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xl border border-rose-100 space-y-4 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-black text-gray-900">🔥 Doğruluk mu Cesaret mi?</h3>
      <p className="text-xs text-gray-500">Kategorinizi seçin ve çıkan karttaki görevi veya cevabı tamamlayın!</p>

      <div className="flex gap-3">
        <button
          onClick={() => drawCard('truth')}
          className="flex-1 py-3.5 rounded-2xl bg-blue-500 text-white font-extrabold text-xs shadow-md hover:bg-blue-600 transition active:scale-95"
        >
          🔍 Doğruluk Kartı Çek
        </button>
        <button
          onClick={() => drawCard('dare')}
          className="flex-1 py-3.5 rounded-2xl bg-rose-500 text-white font-extrabold text-xs shadow-md hover:bg-rose-600 transition active:scale-95"
        >
          🔥 Cesaret Kartı Çek
        </button>
      </div>

      {currentText && (
        <div
          className={`p-5 rounded-3xl border text-xs font-black leading-relaxed animate-in fade-in ${activeType === 'truth' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
        >
          <span className="uppercase text-[10px] tracking-wider block mb-1 font-extrabold">
            {activeType === 'truth' ? '🔍 Doğruluk Sorusu' : '🔥 Cesaret Görevi'}
          </span>
          <span className="text-sm font-bold block">{currentText}</span>
        </div>
      )}
    </div>
  );
}

/* --- SUB-GAME 4: NEON XOX (2-PLAYER DUAL PARTNER & FIRESTORE SCORE) --- */
function NeonXoxGame({ partner1, partner2, slug, playerName }: { partner1: string; partner2: string; slug: string; playerName: string }) {
  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState<{ p1Wins: number; p2Wins: number }>({ p1Wins: 0, p2Wins: 0 });

  // Load existing total scores from Firestore on mount
  useEffect(() => {
    async function loadScore() {
      if (slug) {
        const fetched = await getXoxScore(slug);
        setScores(fetched);
      }
    }
    loadScore();
  }, [slug]);

  const handleCellClick = async (idx: number) => {
    if (board[idx] || winner) return;
    const newBoard = [...board];
    newBoard[idx] = turn;
    setBoard(newBoard);

    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of winningCombos) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        const isP1 = newBoard[a] === 'X';
        const winningName = isP1 ? `🌸 Kız Partner (${partner1})` : `🔵 Erkek Partner (${partner2})`;
        setWinner(winningName);
        triggerConfetti({ particleCount: 60, spread: 80 });

        const updatedScores = {
          p1Wins: isP1 ? scores.p1Wins + 1 : scores.p1Wins,
          p2Wins: !isP1 ? scores.p2Wins + 1 : scores.p2Wins,
        };
        setScores(updatedScores);
        await saveXoxScore(slug, updatedScores.p1Wins, updatedScores.p2Wins);
        await saveGameScore(slug, 'Neon XOX', 100, isP1 ? partner1 : partner2);
        return;
      }
    }

    if (newBoard.every((cell) => cell !== null)) {
      setWinner('Berabere');
      return;
    }

    setTurn(turn === 'X' ? 'O' : 'X');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-black text-gray-900">❌⭕ Neon XOX Çift Düellosu</h3>

      {/* Scoreboard Panel */}
      <div className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-200 p-3 shadow-inner text-xs font-black">
        <div className="flex items-center gap-1.5 text-pink-600">
          <span>🌸 Kız Partner ({partner1}) - X</span>
          <span className="rounded-lg bg-pink-100 px-2 py-0.5 text-sm font-extrabold text-pink-700">{scores.p1Wins}</span>
        </div>
        <span className="text-gray-400 font-extrabold text-sm">-</span>
        <div className="flex items-center gap-1.5 text-blue-600">
          <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-sm font-extrabold text-blue-700">{scores.p2Wins}</span>
          <span>🔵 Erkek Partner ({partner2}) - O</span>
        </div>
      </div>

      {/* Active Turn Indicator Banner */}
      {!winner && (
        <div className="py-1">
          {turn === 'X' ? (
            <div className="rounded-xl bg-pink-50 border border-pink-200 py-1.5 px-4 text-xs font-black text-pink-700 inline-flex items-center gap-1.5 animate-pulse">
              <span>Sıra:</span> 🌸 Kız Partner ({partner1}) - X
            </div>
          ) : (
            <div className="rounded-xl bg-blue-50 border border-blue-200 py-1.5 px-4 text-xs font-black text-blue-700 inline-flex items-center gap-1.5 animate-pulse">
              <span>Sıra:</span> 🔵 Erkek Partner ({partner2}) - O
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="mx-auto grid grid-cols-3 gap-3 max-w-[250px] pt-1">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            className="flex h-20 items-center justify-center rounded-2xl bg-gray-50 border-2 border-gray-200 text-3xl font-black shadow-xs transition hover:bg-rose-50 active:scale-95"
          >
            {cell === 'X' && (
              <span className="text-pink-500 font-black text-3xl drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">
                X
              </span>
            )}
            {cell === 'O' && (
              <span className="text-blue-500 font-black text-3xl drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]">
                O
              </span>
            )}
          </button>
        ))}
      </div>

      {winner && (
        <div className="text-sm font-black text-rose-600 animate-bounce py-1">
          {winner === 'Berabere' ? '🤝 Oyun Berabere Bitti!' : `🎉 Kazanan Taraf: ${winner}!`}
        </div>
      )}

      <button
        onClick={resetGame}
        className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-xs font-black text-white shadow-md hover:scale-102 active:scale-95 transition"
      >
        Yeni Tur Başlat 🔄
      </button>
    </div>
  );
}

/* --- SUB-GAME 5: ROCK PAPER SCISSORS (TKM) --- */
function RockPaperScissorsGame({ slug, playerName }: { slug: string; playerName: string }) {
  const choices = ['✊ Taş', '✋ Kağıt', '✌️ Makas'];
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [cpuChoice, setCpuChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const play = (choice: string) => {
    setUserChoice(choice);
    const cpu = choices[Math.floor(Math.random() * choices.length)];
    setCpuChoice(cpu);

    let res = '';
    if (choice === cpu) {
      res = 'Berabere! 🤝';
    } else if (
      (choice.includes('Taş') && cpu.includes('Makas')) ||
      (choice.includes('Kağıt') && cpu.includes('Taş')) ||
      (choice.includes('Makas') && cpu.includes('Kağıt'))
    ) {
      res = 'Kazandınız! 🎉';
      triggerConfetti({ particleCount: 50, spread: 60 });
      saveGameScore(slug, 'Taş Kağıt Makas', 100, playerName);
    } else {
      res = 'Kaybettiniz! 😅';
    }

    setResult(res);
  };

  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xl border border-rose-100 space-y-4 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-black text-gray-900">✊✌️ Taş Kağıt Makas Düellosu</h3>
      <p className="text-xs text-gray-500">Seçiminizi yapın ve rakibinizle hamle yapın!</p>

      <div className="flex justify-center gap-3">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => play(c)}
            className="flex-1 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black hover:bg-rose-50 hover:border-rose-300 transition active:scale-95"
          >
            {c.split(' ')[0]}
          </button>
        ))}
      </div>

      {userChoice && cpuChoice && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-xs font-bold animate-in fade-in">
          <div>Siz: {userChoice} | Rakip: {cpuChoice}</div>
          <div className="text-sm font-black text-rose-600 mt-1">{result}</div>
        </div>
      )}
    </div>
  );
}

/* --- SUB-GAME 6: FLAPPY BIRD (ORIGINAL PHYSICS) --- */
function FlappyBirdGame({
  partner1,
  partner2,
  slug,
  playerName,
  role,
}: {
  partner1: string;
  partner2: string;
  slug: string;
  playerName: string;
  role: 'partner1' | 'partner2' | 'guest';
}) {
  const [highScores, setHighScores] = useState<{ p1Score: number; p2Score: number }>({ p1Score: 0, p2Score: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    async function loadScores() {
      if (slug) {
        const fetched = await getArcadeHighScores(slug, 'flappy');
        setHighScores(fetched);
      }
    }
    loadScores();
  }, [slug]);

  const championName = useMemo(() => {
    if (highScores.p1Score === 0 && highScores.p2Score === 0) return 'Henüz Rekor Yok 🎯';
    if (highScores.p1Score > highScores.p2Score) return `🌸 Kız Partner (${partner1})`;
    if (highScores.p2Score > highScores.p1Score) return `🔵 Erkek Partner (${partner2})`;
    return 'Berabere 🤝';
  }, [highScores, partner1, partner2]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setIsNewRecord(false);
    setCurrentScore(0);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let score = 0;
    let gameState: 'READY' | 'PLAYING' = 'READY';

    const previousRecord = role === 'partner1' ? highScores.p1Score : highScores.p2Score;

    const bird = {
      x: 100,
      y: 200,
      radius: 16,
      vy: 0,
      gravity: 0.45,
      jump: -7.5,
    };

    let pipes: Array<{ x: number; topHeight: number; bottomY: number; passed: boolean }> = [];
    const pipeGap = 135;
    const pipeWidth = 52;
    const pipeSpeed = 3.0;

    const flap = () => {
      if (gameState === 'READY') {
        gameState = 'PLAYING';
        bird.vy = bird.jump;
        playDinoSFX('jump', false);
      } else if (gameState === 'PLAYING') {
        bird.vy = bird.jump;
        playDinoSFX('jump', false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    let isRunning = true;

    const loop = () => {
      frameCount++;

      if (gameState === 'READY') {
        // Idle floating sine wave animation before first tap
        bird.y = 200 + Math.sin(frameCount * 0.08) * 8;
        bird.vy = 0;
      } else if (gameState === 'PLAYING') {
        bird.vy += bird.gravity;
        bird.y += bird.vy;

        // Ground / Ceiling collision
        if (bird.y - bird.radius <= 0 || bird.y + bird.radius >= canvas.height - 30) {
          isRunning = false;
        }

        // Spawn pipes
        if (frameCount % 90 === 0) {
          const topHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 40;
          pipes.push({
            x: canvas.width,
            topHeight,
            bottomY: topHeight + pipeGap,
            passed: false,
          });
        }

        // Move & filter pipes
        pipes = pipes
          .map((p) => {
            const nextX = p.x - pipeSpeed;
            if (!p.passed && nextX + pipeWidth < bird.x) {
              score += 1;
              setCurrentScore(score);
              return { ...p, x: nextX, passed: true };
            }
            return { ...p, x: nextX };
          })
          .filter((p) => p.x + pipeWidth > 0);

        // Check pipe collisions
        for (const p of pipes) {
          if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + pipeWidth) {
            if (bird.y - bird.radius < p.topHeight || bird.y + bird.radius > p.bottomY) {
              isRunning = false;
              break;
            }
          }
        }
      }

      // --- CANVAS DRAWING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground Track
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, canvas.height - 30, canvas.width, 4);

      // Draw Pipes
      pipes.forEach((p) => {
        // Top Pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(p.x - 2, p.topHeight - 16, pipeWidth + 4, 16);

        // Bottom Pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, p.bottomY, pipeWidth, canvas.height - p.bottomY - 30);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(p.x - 2, p.bottomY, pipeWidth + 4, 16);
      });

      // Draw Flappy Bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      const angle = gameState === 'READY' ? 0 : Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08));
      ctx.rotate(angle);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();

      // Eye & Beak
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(22, 4);
      ctx.lineTo(12, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Idle Ready Instruction Banner
      if (gameState === 'READY') {
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 20px sans-serif';
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText('👆 Uçmak İçin Dokun / Space Bas!', canvas.width / 2 - 160, canvas.height / 2 - 40);
      }

      // HUD Score
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(`🏆 Skor: ${score}`, canvas.width - 150, 40);

      if (isRunning) {
        animationFrameId.current = requestAnimationFrame(loop);
      } else {
        setIsPlaying(false);
        setGameOver(true);
        playDinoSFX('gameover', false);

        if (score > previousRecord) {
          setIsNewRecord(true);
          triggerConfetti({ particleCount: 80, spread: 90 });
          const isP1 = role === 'partner1';
          const updatedScores = {
            p1Score: isP1 ? score : highScores.p1Score,
            p2Score: !isP1 ? score : highScores.p2Score,
          };
          setHighScores(updatedScores);
          saveArcadeHighScore(slug, 'flappy', updatedScores.p1Score, updatedScores.p2Score);
          saveGameScore(slug, 'Flappy Bird', score, playerName);
        }
      }
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, role, slug, playerName, highScores]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95 duration-200 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🐤</span>
        <h3 className="text-xl font-black text-gray-900">Flappy Bird (Orijinal Fizik)</h3>
      </div>

      {/* Leaderboard Panel */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-2 text-pink-600">
            <span>🌸 Kız Partner ({partner1})</span>
            <span className="rounded-xl bg-pink-100 px-3 py-1 text-xs font-black text-pink-700">
              {highScores.p1Score} Puan
            </span>
          </div>

          <div className="flex items-center gap-2 text-blue-600">
            <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
              {highScores.p2Score} Puan
            </span>
            <span>🔵 Erkek Partner ({partner2})</span>
          </div>
        </div>

        <div className="border-t border-sky-200 pt-2 text-xs font-extrabold text-gray-800 flex items-center justify-center gap-1">
          <span>🏆 Şampiyon:</span> <span className="text-sky-800 font-black text-sm">{championName}</span>
        </div>
      </div>

      <div
        className="relative mx-auto w-full max-w-4xl bg-sky-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-sky-300 cursor-pointer touch-none select-none"
        onClick={() => {
          if (isPlaying) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
          }
        }}
      >
        <canvas ref={canvasRef} width={800} height={420} className="w-full max-w-full h-auto block touch-none" />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-4 z-30 animate-in fade-in duration-200">
            {gameOver ? (
              <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-md p-6 text-center shadow-2xl space-y-4 border border-sky-200 animate-in zoom-in-95">
                {isNewRecord ? (
                  <div className="space-y-1.5">
                    <div className="text-5xl animate-bounce">🎉</div>
                    <h4 className="text-lg font-black text-sky-600">TEBRİKLER! YENİ REKOR!</h4>
                    <p className="text-xs text-gray-600 font-bold">Harika bir Flappy rekoru kırıldı!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-4xl">💥</div>
                    <h4 className="text-lg font-black text-gray-900">Oyun Bitti!</h4>
                  </div>
                )}

                <div className="py-3 px-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs font-black text-sky-700 flex items-center justify-center font-mono">
                  SKOR: <strong className="text-base text-gray-900 ml-2">{currentScore} Pass</strong>
                </div>

                <button
                  onClick={startGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg hover:scale-102 active:scale-95 transition"
                >
                  Yeniden Uç 🐤
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-md">
                <div className="text-5xl animate-bounce">🐤</div>
                <h4 className="text-2xl font-black text-white drop-shadow-md">FLAPPY BIRD</h4>
                <p className="text-xs text-sky-200 leading-relaxed font-mono">
                  Uçmak için <span className="font-bold text-sky-300">Space / Tık / Dokun</span> tuşuna basın!
                </p>
                <button
                  onClick={startGame}
                  className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-10 py-3.5 text-sm font-black text-white shadow-xl hover:scale-105 active:scale-95 transition"
                >
                  BAŞLAT 🚀
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- SUB-GAME 7: 2048 (KLASİK STRATEJİ & PARTNER TAHTALARI) --- */
function Game2048({
  partner1,
  partner2,
  slug,
  playerName,
  role,
}: {
  partner1: string;
  partner2: string;
  slug: string;
  playerName: string;
  role: 'partner1' | 'partner2' | 'guest';
}) {
  const userKey: 'partner1' | 'partner2' = useMemo(() => {
    const pNameNorm = (playerName || '').trim().toLocaleLowerCase('tr');
    const p1Norm = (partner1 || '').trim().toLocaleLowerCase('tr');
    const p2Norm = (partner2 || '').trim().toLocaleLowerCase('tr');

    if (pNameNorm && pNameNorm === p2Norm) return 'partner2';
    if (pNameNorm && pNameNorm === p1Norm) return 'partner1';
    if (role === 'partner2') return 'partner2';
    return 'partner1';
  }, [playerName, partner1, partner2, role]);

  const [allGamesData, setAllGamesData] = useState<{
    partner1?: Game2048StateData;
    partner2?: Game2048StateData;
  }>({});

  const [isGameLoading, setIsGameLoading] = useState<boolean>(true);

  function createEmptyGrid() {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }

  function addRandomTile(g: number[][]) {
    const emptyCells: { r: number; c: number }[] = [];
    g.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push({ r, c });
      });
    });
    if (emptyCells.length === 0) return g;
    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newG = g.map((row) => [...row]);
    newG[randCell.r][randCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newG;
  }

  const [grid, setGrid] = useState<number[][]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`asksite_2048_${slug}_${userKey}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed.board) && parsed.board.length === 4) {
            return parsed.board;
          }
        }
      } catch (e) {}
    }
    return createEmptyGrid();
  });

  const [score, setScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`asksite_2048_${slug}_${userKey}`);
        if (local) {
          const parsed = JSON.parse(local);
          return parsed.currentScore || 0;
        }
      } catch (e) {}
    }
    return 0;
  });

  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`asksite_2048_${slug}_${userKey}`);
        if (local) {
          const parsed = JSON.parse(local);
          return parsed.highScore || 0;
        }
      } catch (e) {}
    }
    return 0;
  });

  const [gameOver, setGameOver] = useState<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isGameLoaded = useRef<boolean>(false);

  // 1. One-shot getDoc fetch on mount to load active player board & both partners high scores without writing
  useEffect(() => {
    let isMounted = true;
    isGameLoaded.current = false;
    setIsGameLoading(true);

    async function loadGameData() {
      try {
        const [myData, p1Data, p2Data, arcadeScores] = await Promise.all([
          get2048State(slug, userKey),
          get2048State(slug, 'partner1'),
          get2048State(slug, 'partner2'),
          getArcadeHighScores(slug, '2048'),
        ]);

        if (!isMounted) return;

        // Initialize allGamesData right away on mount for instant partner score hydration
        setAllGamesData({
          partner1: p1Data || (arcadeScores.p1Score > 0 ? { board: [], currentScore: arcadeScores.p1Score, highScore: arcadeScores.p1Score, gameOver: false } : undefined),
          partner2: p2Data || (arcadeScores.p2Score > 0 ? { board: [], currentScore: arcadeScores.p2Score, highScore: arcadeScores.p2Score, gameOver: false } : undefined),
        });

        if (myData && Array.isArray(myData.board) && myData.board.length === 4) {
          const bestScore = Math.max(myData.highScore || 0, myData.currentScore || 0);
          setGrid(myData.board);
          setScore(myData.currentScore || 0);
          setHighScore(bestScore);
          setGameOver(myData.gameOver || false);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `asksite_2048_${slug}_${userKey}`,
              JSON.stringify({ board: myData.board, currentScore: myData.currentScore || 0, highScore: bestScore, gameOver: myData.gameOver || false })
            );
          }
        } else {
          // Check local storage fallback if DB is empty or uninitialized
          let localBoard: number[][] | null = null;
          let localScore = 0;
          let localHighScore = 0;

          if (typeof window !== 'undefined') {
            try {
              const local = localStorage.getItem(`asksite_2048_${slug}_${userKey}`);
              if (local) {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed.board) && parsed.board.length === 4) {
                  localBoard = parsed.board;
                  localScore = parsed.currentScore || 0;
                  localHighScore = parsed.highScore || 0;
                }
              }
            } catch (e) {}
          }

          if (localBoard) {
            setGrid(localBoard);
            setScore(localScore);
            setHighScore(localHighScore);
          } else {
            let initGrid = createEmptyGrid();
            initGrid = addRandomTile(initGrid);
            initGrid = addRandomTile(initGrid);
            setGrid(initGrid);
            setScore(0);
            setHighScore(0);
            setGameOver(false);
          }
          // ABSOLUTELY ZERO FIRESTORE WRITE CALLS HERE!
        }
      } catch (err) {
        console.error('Error loading 2048 state:', err);
      } finally {
        if (isMounted) {
          isGameLoaded.current = true;
          setIsGameLoading(false);
        }
      }
    }

    loadGameData();

    return () => {
      isMounted = false;
    };
  }, [slug, userKey]);

  // 2. Realtime listener for Leaderboard / Partner high score updates
  useEffect(() => {
    const unsub = subscribeTo2048Games(slug, (data) => {
      setAllGamesData(data);
    });
    return () => unsub();
  }, [slug]);

  // 3. Reset Game Handler
  const restartGame = () => {
    if (!isGameLoaded.current) return;

    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);

    save2048State(slug, userKey, {
      board: newGrid,
      currentScore: 0,
      highScore: highScore,
      gameOver: false,
      updatedBy: playerName,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `asksite_2048_${slug}_${userKey}`,
        JSON.stringify({ board: newGrid, currentScore: 0, highScore, gameOver: false })
      );
    }
  };

  const slideRow = (row: number[]): { newRow: number[]; addedScore: number } => {
    let filtered = row.filter((v) => v !== 0);
    let addedScore = 0;
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        addedScore += filtered[i];
        filtered[i + 1] = 0;
        i++;
      }
    }
    filtered = filtered.filter((v) => v !== 0);
    while (filtered.length < 4) {
      filtered.push(0);
    }
    return { newRow: filtered, addedScore };
  };

  const move = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (!isGameLoaded.current || isGameLoading || gameOver) return;
    let current = grid;
    let newG = createEmptyGrid();
    let totalAdded = 0;
    let changed = false;

    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < 4; r++) {
        let row = current[r];
        if (dir === 'right') row = [...row].reverse();
        const { newRow, addedScore } = slideRow(row);
        let finalRow = dir === 'right' ? newRow.reverse() : newRow;
        newG[r] = finalRow;
        totalAdded += addedScore;
        if (finalRow.some((val, c) => val !== current[r][c])) changed = true;
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let col = [current[0][c], current[1][c], current[2][c], current[3][c]];
        if (dir === 'down') col = [...col].reverse();
        const { newRow, addedScore } = slideRow(col);
        let finalCol = dir === 'down' ? newRow.reverse() : newRow;
        totalAdded += addedScore;
        for (let r = 0; r < 4; r++) {
          newG[r][c] = finalCol[r];
          if (finalCol[r] !== current[r][c]) changed = true;
        }
      }
    }

    if (changed) {
      const updatedGrid = addRandomTile(newG);
      const newScore = score + totalAdded;
      const newHighScore = Math.max(highScore, newScore);
      const isOver = isGameOver(updatedGrid);

      setGrid(updatedGrid);
      setScore(newScore);
      if (newHighScore > highScore) {
        setHighScore(newHighScore);
        saveGameScore(slug, '2048', newHighScore, playerName);
        const otherPartnerScore = userKey === 'partner1'
          ? Math.max(allGamesData.partner2?.highScore || 0, allGamesData.partner2?.currentScore || 0)
          : Math.max(allGamesData.partner1?.highScore || 0, allGamesData.partner1?.currentScore || 0);
        if (newHighScore > otherPartnerScore) {
          triggerConfetti({ particleCount: 90, spread: 90 });
        }
      }
      setGameOver(isOver);

      save2048State(slug, userKey, {
        board: updatedGrid,
        currentScore: newScore,
        highScore: newHighScore,
        gameOver: isOver,
        updatedBy: playerName,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `asksite_2048_${slug}_${userKey}`,
          JSON.stringify({ board: updatedGrid, currentScore: newScore, highScore: newHighScore, gameOver: isOver })
        );
      }
    }
  };

  const isGameOver = (g: number[][]) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) return false;
        if (c < 3 && g[r][c] === g[r][c + 1]) return false;
        if (r < 3 && g[r][c] === g[r + 1][c]) return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, score, gameOver, isGameLoading]);

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-[#eee4da] text-[#776e65]';
      case 4: return 'bg-[#ede0c8] text-[#776e65]';
      case 8: return 'bg-[#f2b179] text-white';
      case 16: return 'bg-[#f59563] text-white';
      case 32: return 'bg-[#f67c5f] text-white';
      case 64: return 'bg-[#f65e3b] text-white';
      case 128: return 'bg-[#edcf72] text-white shadow-lg';
      case 256: return 'bg-[#edcc61] text-white shadow-lg';
      case 512: return 'bg-[#edc850] text-white shadow-xl';
      case 1024: return 'bg-[#edc53f] text-white shadow-2xl';
      case 2048: return 'bg-[#edc22e] text-white shadow-2xl animate-pulse';
      default: return 'bg-[#edc22e] text-white';
    }
  };

  // High Scores & Champion logic with robust fallbacks for both partners
  const p1Data = allGamesData.partner1;
  const p2Data = allGamesData.partner2;

  const p1HighScore = Math.max(
    p1Data?.highScore || 0,
    p1Data?.currentScore || 0,
    userKey === 'partner1' ? highScore : 0,
    userKey === 'partner1' ? score : 0
  );

  const p2HighScore = Math.max(
    p2Data?.highScore || 0,
    p2Data?.currentScore || 0,
    userKey === 'partner2' ? highScore : 0,
    userKey === 'partner2' ? score : 0
  );

  const championName = useMemo(() => {
    if (p1HighScore === 0 && p2HighScore === 0) return 'Henüz Rekor Yok 🎯';
    if (p1HighScore > p2HighScore) return `${partner1} (${p1HighScore} Puan)`;
    if (p2HighScore > p1HighScore) return `${partner2} (${p2HighScore} Puan)`;
    return `Berabere (${p1HighScore} Puan) 🤝`;
  }, [p1HighScore, p2HighScore, partner1, partner2]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95 duration-200 max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-left">
          <span className="text-2xl">🧩</span>
          <div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">2048 (Klasik Strateji)</h3>
            <p className="text-[11px] text-rose-600 font-bold">
              🎮 {playerName} ({userKey === 'partner1' ? partner1 : partner2}) Tahtası
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3.5 py-1.5 border border-amber-200 text-xs font-black text-amber-800 font-mono">
          MEVCUT SKOR: <span className="text-base text-amber-900">{score}</span>
        </div>
      </div>

      {/* Leaderboard Panel */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-black flex-wrap gap-1">
          <div className="flex items-center gap-1.5 text-pink-600">
            <span>🌸 {partner1} Puan:</span>
            <span className="rounded-xl bg-pink-100 px-2.5 py-0.5 text-xs font-black text-pink-700">
              {p1HighScore} Puan
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-blue-600">
            <span>🔵 {partner2} Puan:</span>
            <span className="rounded-xl bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-700">
              {p2HighScore} Puan
            </span>
          </div>
        </div>

        <div className="border-t border-amber-200 pt-2 text-xs font-extrabold text-gray-800 flex items-center justify-center gap-1.5">
          <span>🏆 Şampiyon:</span> <span className="text-amber-900 font-black text-sm">{championName}</span>
        </div>
      </div>

      {/* 2048 Grid Board */}
      <div
        className="relative mx-auto bg-[#bbada0] p-2.5 sm:p-3 rounded-3xl w-full max-w-[340px] sm:max-w-[360px] aspect-square grid grid-cols-4 gap-2 sm:gap-2.5 shadow-2xl select-none touch-none"
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchEnd={(e) => {
          if (touchStartRef.current && e.changedTouches.length > 0) {
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              if (dx > 30) move('right');
              else if (dx < -30) move('left');
            } else {
              if (dy > 30) move('down');
              else if (dy < -30) move('up');
            }
          }
        }}
      >
        {isGameLoading && (
          <div className="absolute inset-0 rounded-3xl bg-amber-50/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-3 z-40 animate-in fade-in">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-xs font-black text-amber-900">Tahtanız Yükleniyor... 🧩</p>
          </div>
        )}

        {grid.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className={`rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl transition-all duration-150 ${val === 0 ? 'bg-[#ccc0b4]/60' : getTileColor(val)
                }`}
            >
              {val > 0 ? val : ''}
            </div>
          ))
        )}

        {gameOver && !isGameLoading && (
          <div className="absolute inset-0 rounded-3xl bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-3 z-30 animate-in fade-in">
            <div className="text-4xl">💥</div>
            <h4 className="text-xl font-black text-white">OYUN BİTTİ!</h4>
            <p className="text-xs text-amber-200 font-mono">Son Oyun Skoru: {score}</p>
            <p className="text-[11px] text-gray-300 font-bold">Kişisel Rekorunuz: {highScore}</p>
            <button
              onClick={restartGame}
              className="rounded-2xl bg-amber-500 text-white font-black px-6 py-3 text-xs shadow-lg hover:bg-amber-600 transition min-h-[44px]"
            >
              Yeni Oyun Başlat 🔄
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
        <button
          onClick={restartGame}
          className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-extrabold text-xs hover:bg-rose-100 transition active:scale-95 border border-rose-100 min-h-[40px]"
        >
          Yeniden Başlat 🔄
        </button>
        <span className="text-[10px] text-gray-400 font-bold">Klavye (W A S D) / Kaydır</span>
      </div>

      {/* Touch Control Buttons */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
        <div />
        <button onClick={() => move('up')} className="h-12 flex items-center justify-center bg-rose-50 text-rose-600 font-black rounded-2xl text-lg active:scale-90 border border-rose-100 shadow-sm hover:bg-rose-100 transition min-h-[44px]">⬆️</button>
        <div />
        <button onClick={() => move('left')} className="h-12 flex items-center justify-center bg-rose-50 text-rose-600 font-black rounded-2xl text-lg active:scale-90 border border-rose-100 shadow-sm hover:bg-rose-100 transition min-h-[44px]">⬅️</button>
        <button onClick={() => move('down')} className="h-12 flex items-center justify-center bg-rose-50 text-rose-600 font-black rounded-2xl text-lg active:scale-90 border border-rose-100 shadow-sm hover:bg-rose-100 transition min-h-[44px]">⬇️</button>
        <button onClick={() => move('right')} className="h-12 flex items-center justify-center bg-rose-50 text-rose-600 font-black rounded-2xl text-lg active:scale-90 border border-rose-100 shadow-sm hover:bg-rose-100 transition min-h-[44px]">➡️</button>
      </div>
    </div>
  );
}

/* --- SUB-GAME 8: TOWER STACKER (KULE DENGE) --- */
function TowerStackerGame({
  partner1,
  partner2,
  slug,
  playerName,
  role,
}: {
  partner1: string;
  partner2: string;
  slug: string;
  playerName: string;
  role: 'partner1' | 'partner2' | 'guest';
}) {
  const [highScores, setHighScores] = useState<{ p1Score: number; p2Score: number }>({ p1Score: 0, p2Score: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    async function loadScores() {
      if (slug) {
        const fetched = await getArcadeHighScores(slug, 'tower');
        setHighScores(fetched);
      }
    }
    loadScores();
  }, [slug]);

  const championName = useMemo(() => {
    if (highScores.p1Score === 0 && highScores.p2Score === 0) return 'Henüz Rekor Yok 🎯';
    if (highScores.p1Score > highScores.p2Score) return `🌸 Kız Partner (${partner1})`;
    if (highScores.p2Score > highScores.p1Score) return `🔵 Erkek Partner (${partner2})`;
    return 'Berabere 🤝';
  }, [highScores, partner1, partner2]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setIsNewRecord(false);
    setCurrentScore(0);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockHeight = 24;
    let cameraY = 0;

    let stack: Array<{ x: number; y: number; width: number; color: string }> = [
      { x: 260, y: canvas.height - blockHeight - 20, width: 280, color: '#f43f5e' },
    ];

    let currentBlock = {
      x: 0,
      y: canvas.height - blockHeight * 2 - 20,
      width: 280,
      speed: 4.5,
      direction: 1,
      color: '#ec4899',
    };

    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'];
    let score = 0;
    let isRunning = true;

    const dropBlock = () => {
      if (!isRunning) return;

      const topStack = stack[stack.length - 1];
      const prevX = topStack.x;
      const prevWidth = topStack.width;
      const currX = currentBlock.x;
      const currWidth = currentBlock.width;

      const leftOverlap = Math.max(currX, prevX);
      const rightOverlap = Math.min(currX + currWidth, prevX + prevWidth);
      const newWidth = rightOverlap - leftOverlap;

      if (newWidth <= 0) {
        isRunning = false;
        return;
      }

      let finalX = leftOverlap;
      let finalWidth = newWidth;
      if (Math.abs(currX - prevX) < 4) {
        finalX = prevX;
        finalWidth = prevWidth;
        triggerConfetti({ particleCount: 30, spread: 50 });
      }

      score += 1;
      setCurrentScore(score);

      stack.push({
        x: finalX,
        y: currentBlock.y,
        width: finalWidth,
        color: currentBlock.color,
      });

      const nextY = currentBlock.y - blockHeight;
      const nextColor = colors[stack.length % colors.length];

      currentBlock = {
        x: Math.random() > 0.5 ? 0 : canvas.width - finalWidth,
        y: nextY,
        width: finalWidth,
        speed: 4.5 + Math.min(4.0, score * 0.15),
        direction: Math.random() > 0.5 ? 1 : -1,
        color: nextColor,
      };

      if (stack.length > 6) {
        cameraY += blockHeight;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        dropBlock();
      }
    };

    const handleCanvasClick = () => {
      dropBlock();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);

    const loop = () => {
      currentBlock.x += currentBlock.speed * currentBlock.direction;
      if (currentBlock.x <= 0) {
        currentBlock.x = 0;
        currentBlock.direction = 1;
      } else if (currentBlock.x + currentBlock.width >= canvas.width) {
        currentBlock.x = canvas.width - currentBlock.width;
        currentBlock.direction = -1;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(0, cameraY);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, -cameraY, canvas.width, canvas.height);

      stack.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, blockHeight - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(b.x, b.y, b.width, 3);
      });

      if (isRunning) {
        ctx.fillStyle = currentBlock.color;
        ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, blockHeight - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, 3);
      }

      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(`🏰 Kat: ${score}`, canvas.width - 150, 40);

      if (isRunning) {
        animationFrameId.current = requestAnimationFrame(loop);
      } else {
        setIsPlaying(false);
        setGameOver(true);
        playDinoSFX('gameover', false);

        const previousRecord = role === 'partner1' ? highScores.p1Score : highScores.p2Score;
        if (score > previousRecord) {
          setIsNewRecord(true);
          triggerConfetti({ particleCount: 90, spread: 90 });
          const isP1 = role === 'partner1';
          const updatedScores = {
            p1Score: isP1 ? score : highScores.p1Score,
            p2Score: !isP1 ? score : highScores.p2Score,
          };
          setHighScores(updatedScores);
          saveArcadeHighScore(slug, 'tower', updatedScores.p1Score, updatedScores.p2Score);
          saveGameScore(slug, 'Tower Stacker', score, playerName);
        }
      }
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, role, slug, playerName, highScores]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95 duration-200 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏰</span>
        <h3 className="text-xl font-black text-gray-900">Tower Stacker (Kule Denge)</h3>
      </div>

      {/* Leaderboard Panel */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 border border-purple-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-2 text-pink-600">
            <span>🌸 Kız Partner ({partner1})</span>
            <span className="rounded-xl bg-pink-100 px-3 py-1 text-xs font-black text-pink-700">
              {highScores.p1Score} Kat
            </span>
          </div>

          <div className="flex items-center gap-2 text-blue-600">
            <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
              {highScores.p2Score} Kat
            </span>
            <span>🔵 Erkek Partner ({partner2})</span>
          </div>
        </div>

        <div className="border-t border-purple-200 pt-2 text-xs font-extrabold text-gray-800 flex items-center justify-center gap-1">
          <span>🏆 Şampiyon:</span> <span className="text-purple-800 font-black text-sm">{championName}</span>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-4xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-purple-300 cursor-pointer touch-none select-none">
        <canvas ref={canvasRef} width={800} height={420} className="w-full max-w-full h-auto block touch-none" />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-4 z-30 animate-in fade-in duration-200">
            {gameOver ? (
              <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-md p-6 text-center shadow-2xl space-y-4 border border-purple-200 animate-in zoom-in-95">
                {isNewRecord ? (
                  <div className="space-y-1.5">
                    <div className="text-5xl animate-bounce">🎉</div>
                    <h4 className="text-lg font-black text-purple-600">TEBRİKLER! YENİ REKOR!</h4>
                    <p className="text-xs text-gray-600 font-bold">Harika bir kule kat rekoru kırıldı!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-4xl">💥</div>
                    <h4 className="text-lg font-black text-gray-900">Kule Yıkıldı!</h4>
                  </div>
                )}

                <div className="py-3 px-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs font-black text-purple-700 flex items-center justify-center font-mono">
                  İNŞA EDİLEN: <strong className="text-base text-gray-900 ml-2">{currentScore} Kat</strong>
                </div>

                <button
                  onClick={startGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 py-3.5 text-xs font-black text-white shadow-lg hover:scale-102 active:scale-95 transition"
                >
                  Yeniden İnşa Et 🏰
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-md">
                <div className="text-5xl animate-bounce">🏰</div>
                <h4 className="text-2xl font-black text-white drop-shadow-md">TOWER STACKER</h4>
                <p className="text-xs text-purple-200 leading-relaxed font-mono">
                  Bloğu düşürmek için <span className="font-bold text-pink-300">Space / Tık / Dokun</span> tuşuna basın!
                </p>
                <button
                  onClick={startGame}
                  className="rounded-2xl bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 px-10 py-3.5 text-sm font-black text-white shadow-xl hover:scale-105 active:scale-95 transition"
                >
                  BAŞLAT 🚀
                </button>
              </div>
            )}
          </div>
        )}
      </div>
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
              className={`relative overflow-hidden rounded-3xl p-5 shadow-lg transition-all duration-300 ${c.is_used
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

  const [p1Score, setP1Score] = useState<number>(couple?.partner1_score !== undefined ? couple.partner1_score : 0);
  const [p2Score, setP2Score] = useState<number>(couple?.partner2_score !== undefined ? couple.partner2_score : 0);

  const [activePartnerTab, setActivePartnerTab] = useState<'partner1' | 'partner2'>('partner1');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const questions = React.useMemo(() => {
    if (activePartnerTab === 'partner1') {
      return couple?.quiz_partner1 && couple.quiz_partner1.length > 0 ? couple.quiz_partner1 : DEFAULT_QUIZ_P1;
    } else {
      return couple?.quiz_partner2 && couple.quiz_partner2.length > 0 ? couple.quiz_partner2 : DEFAULT_QUIZ_P2;
    }
  }, [activePartnerTab, couple]);

  // Weekly lock countdown calculation
  const expiresAtStr = activePartnerTab === 'partner1' ? couple?.quiz_partner1_expires_at : couple?.quiz_partner2_expires_at;
  const expiresTime = expiresAtStr ? new Date(expiresAtStr).getTime() : 0;
  const now = Date.now();
  const remainingMs = Math.max(0, expiresTime - now);
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const handleTabChange = (tab: 'partner1' | 'partner2') => {
    setActivePartnerTab(tab);
    setCurrentQIndex(0);
    setScore(0);
    setCompleted(false);
    setSelectedOption(null);
    setIsAnswering(false);
    setPointsEarned(0);
  };

  const handleOptionClick = (optionIdx: number) => {
    if (isAnswering || completed || !questions[currentQIndex]) return;

    setIsAnswering(true);
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === questions[currentQIndex].correct_index;
    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
    }

    setTimeout(async () => {
      if (currentQIndex + 1 < questions.length) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswering(false);
      } else {
        const totalPoints = newScore * 10;
        setPointsEarned(totalPoints);
        setCompleted(true);
        setIsAnswering(false);
        triggerConfetti({ particleCount: 90, spread: 80 });

        // Save score to Firebase
        const solverRole = activePartnerTab === 'partner1' ? 'partner2' : 'partner1';
        await saveQuizScore(couple.slug, solverRole, totalPoints);
        if (solverRole === 'partner1') {
          setP1Score((prev) => prev + totalPoints);
        } else {
          setP2Score((prev) => prev + totalPoints);
        }
      }
    }, 1200);
  };

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setScore(0);
    setCompleted(false);
    setSelectedOption(null);
    setIsAnswering(false);
    setPointsEarned(0);
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
    <div className="space-y-5">
      {/* Scoreboard (Puan Tablosu) Header */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-3.5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-extrabold text-xs tracking-wide">
          <span className="text-base">🏆</span> AŞK PUAN TABLOSU
        </div>
        <div className="flex items-center gap-2 text-xs font-black">
          <span className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-xl border border-white/30">
            💖 {partner1Name}: <strong className="text-amber-200">{p1Score} Puan</strong>
          </span>
          <span className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-xl border border-white/30">
            💙 {partner2Name}: <strong className="text-amber-200">{p2Score} Puan</strong>
          </span>
        </div>
      </div>

      {/* Weekly Countdown Badge */}
      {expiresTime > now && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5 shadow-xs">
          <span>⏳</span>
          <span>
            Haftalık Test Hazırlama Süresi Devam Ediyor (Kalan: {remainingDays} Gün {remainingHours} Saat)
          </span>
        </div>
      )}

      {/* Partner Quiz Selector Tabs */}
      <div className="flex rounded-2xl bg-gray-100 p-1.5 shadow-inner">
        <button
          onClick={() => handleTabChange('partner1')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${activePartnerTab === 'partner1'
            ? 'bg-rose-500 text-white shadow-md'
            : 'text-gray-600 hover:text-rose-500'
            }`}
        >
          💖 {partner1Name}'in Testini Çöz
        </button>
        <button
          onClick={() => handleTabChange('partner2')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${activePartnerTab === 'partner2'
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
                Soru {currentQIndex + 1} / {questions.length} (Soru Başı 10 Puan)
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

            {/* Score & Points Earned Badge */}
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 space-y-2">
              <div className="text-2xl font-black text-rose-600">
                {score} / {questions.length} Doğru (%{scorePct})
              </div>
              <div className="text-sm font-black text-emerald-600 bg-emerald-50 py-1.5 px-4 rounded-xl border border-emerald-200 inline-block">
                🎉 Kazanılan Aşk Puanı: +{pointsEarned} Puan!
              </div>
              <div className="text-xs font-extrabold text-gray-800 bg-white py-1.5 px-3 rounded-xl shadow-xs border border-rose-100 block mt-2">
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
      const stored = sessionStorage.getItem('asksite_auth_' + couple.slug) || localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const role = parsed.role as 'partner1' | 'partner2' | 'guest';
          const author = role === 'partner1' ? couple.partner1_name : role === 'partner2' ? couple.partner2_name : 'Misafir';
          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) { }
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
                    className={`h-7 w-7 rounded-xl text-sm transition-transform ${selectedMood === m ? 'scale-125 bg-amber-200 shadow-xs' : 'hover:scale-110 opacity-80'
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
          <div className="rounded-3xl bg-white/95 backdrop-blur-md p-10 text-center shadow-xl border border-amber-100/80 space-y-4 my-4 animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 text-4xl shadow-inner border border-amber-200/60 animate-bounce">
              📖
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">Henüz kaydedilmiş bir anınız yok.</h3>
              <p className="text-xs font-semibold text-gray-500 max-w-sm mx-auto leading-relaxed">
                İlk anınızı ekleyerek defterinizi doldurmaya başlayın! ✨
              </p>
            </div>
            {authState.isPartner && (
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) textarea.focus();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 px-6 py-3 text-xs font-black text-white shadow-lg hover:scale-105 active:scale-95 transition"
              >
                <span>Anı Ekle</span>
                <span>🖋️</span>
              </button>
            )}
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
      const stored = sessionStorage.getItem('asksite_auth_' + couple.slug) || localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const role = parsed.role as 'partner1' | 'partner2' | 'guest';
          const author = role === 'partner1' ? couple.partner1_name : role === 'partner2' ? couple.partner2_name : 'Misafir';
          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) { }
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
                        KİLİT AÇILDI 🔓
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> KİLİTLİ 🔒
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
                  <div className="text-center py-2 space-y-2">
                    <p className="text-xs text-slate-300 font-medium">
                      Açılmasına kalan süre:
                    </p>
                    <CapsuleCountdown targetDate={capsule.open_date} />
                    <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-amber-500/30 text-xs text-amber-300 font-serif italic flex items-center justify-center gap-1.5 shadow-inner">
                      🔒 Bu mesaj kilitlidir. Açılış tarihi geldiğinde görüntülenecektir.
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
      const stored = sessionStorage.getItem('asksite_auth_' + couple.slug) || localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const role = parsed.role as 'partner1' | 'partner2' | 'guest';
          const author = role === 'partner1' ? couple.partner1_name : role === 'partner2' ? couple.partner2_name : 'Misafir';
          return { role, author, isPartner: role === 'partner1' || role === 'partner2' };
        } catch (e) { }
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
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${activeTab === 'watched'
            ? 'bg-rose-500 text-white shadow-md'
            : 'text-gray-600 hover:text-rose-500'
            }`}
        >
          🍿 Birlikte İzlediklerimiz ({watchedMovies.length})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${activeTab === 'watchlist'
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
                    className={`text-2xl transition-transform ${star <= markRating ? 'text-amber-400 scale-110' : 'text-gray-300'
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

function TherapyWidget({ couple }: { couple: CoupleConfig }) {
  const [selectedColor, setSelectedColor] = useState<string>('#ff4d6d');
  const [strokeWidth, setStrokeWidth] = useState<number>(7);
  const [savingMemory, setSavingMemory] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [drawings, setDrawings] = useState<CanvasDrawing[]>([]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef<boolean>(false);
  const currentPointsRef = React.useRef<Array<{ x: number; y: number }>>([]);

  const userRole: 'partner1' | 'partner2' | 'guest' = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('asksite_auth_' + couple.slug) || localStorage.getItem('asksite_auth_' + couple.slug);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role) return parsed.role;
        } catch (e) { }
      }
    }
    return 'partner1';
  }, [couple.slug]);

  const loadDrawings = React.useCallback(async () => {
    const list = await getCanvasDrawings(couple.slug);
    setDrawings(list);
  }, [couple.slug]);

  React.useEffect(() => {
    loadDrawings();

    const unsubscribe = subscribeToLiveCanvas(couple.slug, (strokes) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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
  }, [couple.slug, loadDrawings]);

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
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');

      if (offCtx) {
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

        offCtx.drawImage(canvas, 0, 0);
        const dataUrl = offscreen.toDataURL('image/png');

        const drawnBy = userRole === 'partner1' ? couple.partner1_name : userRole === 'partner2' ? couple.partner2_name : 'Misafir Partner';
        const ok = await addCanvasDrawing(couple.slug, { imageUrl: dataUrl, drawnBy });

        if (ok) {
          await loadDrawings();
          triggerConfetti({ particleCount: 70, spread: 80 });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }
      }
    } catch (err) {
      console.error('Error saving canvas drawing:', err);
    }
    setSavingMemory(false);
  };

  const handleDeleteDrawing = async (drawingId: string) => {
    if (confirm('Bu çizimi silmek istediğinizden emin misiniz?')) {
      const ok = await deleteCanvasDrawing(couple.slug, drawingId);
      if (ok) {
        setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Canvas Wrapper */}
      <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] aspect-square rounded-3xl bg-white shadow-2xl border-4 border-rose-100 overflow-hidden touch-none select-none">
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
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 text-center">
            Fırça Renkleri 🎨
          </div>
          <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto py-1 px-1 max-w-full no-scrollbar flex-nowrap sm:flex-wrap">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                title={c.name}
                className={`h-8 w-8 shrink-0 rounded-full border-2 transition-transform ${selectedColor === c.hex
                  ? 'scale-125 border-gray-900 shadow-md'
                  : 'border-white hover:scale-110 shadow-2xs'
                  }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setStrokeWidth(3)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition min-h-[40px] ${strokeWidth === 3 ? 'bg-rose-500 text-white' : 'text-gray-600'
                }`}
            >
              İnce (3px)
            </button>
            <button
              onClick={() => setStrokeWidth(7)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${strokeWidth === 7 ? 'bg-rose-500 text-white' : 'text-gray-600'
                }`}
            >
              Orta (7px)
            </button>
            <button
              onClick={() => setStrokeWidth(14)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${strokeWidth === 14 ? 'bg-rose-500 text-white' : 'text-gray-600'
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

        <button
          onClick={handleSaveToGallery}
          disabled={savingMemory}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 py-3 text-xs font-extrabold text-white shadow-md hover:scale-[1.01] active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Palette className="h-4 w-4" /> {savingMemory ? 'Kaydediliyor...' : '🎨 Sanat Eserini Kaydet'}
        </button>

        {saveSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-700 animate-in fade-in">
            ✨ Çiziminiz Aşkımızın Çizim Galerisi'ne başarıyla eklendi!
          </div>
        )}
      </div>

      {/* Aşkımızın Çizim Galerisi 🎨 */}
      <div className="mt-8 pt-6 border-t border-rose-100 text-left space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <span>Aşkımızın Çizim Galerisi 🎨</span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-600">
                {drawings.length} Eser
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Ortak tuval üzerinde çizip mühürlediğiniz tüm özel çizimler.
            </p>
          </div>
        </div>

        {drawings.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-gray-400 italic border border-dashed border-gray-200 shadow-sm">
            Henüz kaydedilmiş bir çizim eseri bulunmuyor. İlk sanat eserinizi yukarıdaki tuvalde çizip "🎨 Sanat Eserini Kaydet" butonuna basın!
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
