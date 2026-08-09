'use client';

import { useEffect, useState } from 'react';

interface PbnCelebrationOverlayProps {
  onClose: () => void;
  onSaveToGallery?: () => void;
}

export default function PbnCelebrationOverlay({ onClose, onSaveToGallery }: PbnCelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; color: string; delay: number; size: number; speed: number }>
  >([]);

  useEffect(() => {
    const items = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#fff'][
        Math.floor(Math.random() * 8)
      ],
      delay: Math.random() * 2.5,
      size: Math.random() * 10 + 6,
      speed: Math.random() * 3 + 2,
    }));
    setConfetti(items);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Confetti pieces */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm opacity-0"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size,
            height: p.size * 0.6,
            animationName: 'pbnConfettiFall',
            animationDuration: `${p.speed}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-in',
            animationIterationCount: 'infinite',
            animationFillMode: 'both',
          }}
        />
      ))}

      <style>{`
        @keyframes pbnConfettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
        }
      `}</style>

      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl animate-bounce">🎉</div>
        <h2 className="text-2xl font-black text-gray-900">Tebrikler!</h2>
        <p className="text-gray-500 font-medium">
          Harika iş çıkardın! Boyamayı tamamladın 🎨✨
        </p>
        <div className="flex flex-col gap-2 pt-2">
          {onSaveToGallery && (
            <button
              onClick={() => { onSaveToGallery(); onClose(); }}
              className="w-full py-3 rounded-2xl font-extrabold text-white text-sm shadow-lg transition active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
            >
              🖼️ Galeri'ye Kaydet
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 text-sm transition active:scale-95"
          >
            Boyamaya Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
