'use client';

import { useEffect, useState } from 'react';

interface Heart {
  id: number;
  emoji: string;
  left: string;
  duration: string;
  fontSize: string;
  opacity: number;
}

export default function FloatingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newHeart: Heart = {
        id: Date.now() + Math.random(),
        emoji: Math.random() > 0.5 ? '❤️' : '💖',
        left: `${Math.random() * 100}vw`,
        duration: `${6 + Math.random() * 8}s`,
        fontSize: `${0.8 + Math.random() * 1.2}rem`,
        opacity: 0.1 + Math.random() * 0.25,
      };

      setHearts((prev) => [...prev.slice(-25), newHeart]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hearts-bg pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="floating-heart absolute"
          style={{
            left: h.left,
            animationDuration: h.duration,
            fontSize: h.fontSize,
            opacity: h.opacity,
          }}
        >
          {h.emoji}
        </div>
      ))}
    </div>
  );
}
