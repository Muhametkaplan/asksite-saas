'use client';

import React, { useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { CoupleConfig } from '@/types/couple';
import StoryCardModal from '@/components/StoryCardModal';

interface StoryShareButtonProps {
  couple: CoupleConfig;
}

export default function StoryShareButton({ couple }: StoryShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isPremium =
    couple.plan === 'yearly_premium' ||
    couple.package_type === 'yearly_premium' ||
    couple.package_type === 'lifetime';

  return (
    <>
      {/* Floating Story Card Trigger Button (Bottom Right) */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-40">
        <button
          onClick={() => setModalOpen(true)}
          className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/40 cursor-pointer"
          title="Instagram Story Kartı Oluştur ve Paylaş"
        >
          <Camera className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span className="hidden sm:inline">Story Kartı Al</span>
          <span className="sm:hidden">Story</span>
          <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
        </button>
      </div>

      {/* Modal */}
      <StoryCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        config={couple}
        isPremium={isPremium}
      />
    </>
  );
}
