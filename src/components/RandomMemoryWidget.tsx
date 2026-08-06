'use client';

import { useState, useEffect } from 'react';
import { Camera, RefreshCw, Calendar, Sparkles, Heart } from 'lucide-react';
import { MemoryItem } from '@/types/couple';

interface RandomMemoryWidgetProps {
  memories?: MemoryItem[];
}

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: '1',
    photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
    date: '2023-01-01',
    title: 'İlk Tanışma Anımız ✨',
    note: 'Dünyadaki tüm sesler sustu, sadece gözlerin kaldı zihnimde...',
  },
  {
    id: '2',
    photo_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop',
    date: '2023-07-15',
    title: 'Deniz Kenarı Gün Batımı 🌅',
    note: 'Dalga sesleri eşliğinde el ele yürüyüşümüz dün gibi aklımda.',
  },
  {
    id: '3',
    photo_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop',
    date: '2024-02-14',
    title: 'Göz Göze Romantik Akşam 🍷',
    note: 'Seninle dakikalar saat gibi hızla aksa da, her an paha biçilemez.',
  },
];

export default function RandomMemoryWidget({ memories }: RandomMemoryWidgetProps) {
  const activeMemories = memories && memories.length > 0 ? memories : DEFAULT_MEMORIES;
  const [currentMemory, setCurrentMemory] = useState<MemoryItem | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    // Pick a random memory on initial load
    const randomIndex = Math.floor(Math.random() * activeMemories.length);
    setCurrentMemory(activeMemories[randomIndex]);
  }, [memories]);

  const handleNextMemory = () => {
    if (activeMemories.length === 0) return;
    setIsRotating(true);
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * activeMemories.length);
      // Try to get a different memory if possible
      if (activeMemories.length > 1 && currentMemory) {
        while (activeMemories[nextIndex].id === currentMemory.id) {
          nextIndex = Math.floor(Math.random() * activeMemories.length);
        }
      }
      setCurrentMemory(activeMemories[nextIndex]);
      setIsRotating(false);
    }, 300);
  };

  if (!currentMemory) return null;

  return (
    <div className="random-memory-widget my-6 rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-md border border-white/90 text-left relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-3 border-b pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              Günün Anısı <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </h3>
            <span className="text-[10px] text-gray-500 font-medium">Sürpriz Fotoğraf Kartı</span>
          </div>
        </div>

        <button
          onClick={handleNextMemory}
          disabled={isRotating}
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
          title="Başka Bir Anı Getir"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>Başka Anı</span>
        </button>
      </div>

      {/* Memory Photo Card */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-gray-100">
        <img
          src={currentMemory.photo_url}
          alt={currentMemory.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Date Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[10px] font-medium text-white border border-white/20">
          <Calendar className="h-3 w-3 text-pink-400" />
          <span>{currentMemory.date}</span>
        </div>

        {/* Caption */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h4 className="text-sm font-bold text-pink-100 drop-shadow-sm flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
            {currentMemory.title}
          </h4>
          <p className="text-xs text-gray-200 line-clamp-2 mt-0.5 font-light italic">
            "{currentMemory.note}"
          </p>
        </div>
      </div>
    </div>
  );
}
