'use client';

import { useState } from 'react';
import { Plane, Film, Sparkles, CheckCircle, Circle, MapPin, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BucketListItem } from '@/types/couple';

interface CoupleBucketListProps {
  items?: BucketListItem[];
}

const DEFAULT_BUCKET_ITEMS: BucketListItem[] = [
  { id: '1', title: 'Roma & Venedik Gezisi 🇮🇹', category: 'city', completed: false },
  { id: '2', title: 'Kapadokya Balon Turu 🎈', category: 'activity', completed: true },
  { id: '3', title: 'Interstellar Sinema Gecesi 🍿', category: 'movie', completed: true },
  { id: '4', title: 'Paris’te Eyfel Altında Kahve ☕', category: 'city', completed: false },
  { id: '5', title: 'Kuzey Işıkları (Aurora) Kampı 🌌', category: 'activity', completed: false },
];

export default function CoupleBucketList({ items }: CoupleBucketListProps) {
  const [list, setList] = useState<BucketListItem[]>(items && items.length > 0 ? items : DEFAULT_BUCKET_ITEMS);
  const [filter, setFilter] = useState<'all' | 'city' | 'movie' | 'activity'>('all');

  const toggleItem = (id: string) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          if (nextCompleted) {
            // Trigger confetti explosion on completion
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#ff4d6d', '#ff758f', '#38ef7d', '#11998e', '#ffd166'],
            });
          }
          return { ...item, completed: nextCompleted };
        }
        return item;
      })
    );
  };

  const filteredList = list.filter((item) => filter === 'all' || item.category === filter);
  const completedCount = list.filter((i) => i.completed).length;

  return (
    <div id="bucketlist" className="bucket-list-widget my-6 rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-md border border-white/90 text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              Birlikte Rotamız <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-xs text-gray-500 font-medium">Couple Bucket List & Hayallerimiz</p>
          </div>
        </div>

        <div className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-100">
          {completedCount} / {list.length} Tamamlandı
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            filter === 'all' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tümü ✨
        </button>
        <button
          onClick={() => setFilter('city')}
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            filter === 'city' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" /> Şehirler
        </button>
        <button
          onClick={() => setFilter('movie')}
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            filter === 'movie' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Film className="h-3.5 w-3.5" /> Filmler
        </button>
        <button
          onClick={() => setFilter('activity')}
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            filter === 'activity' ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> Aktiviteler
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-2.5">
        {filteredList.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex cursor-pointer items-center justify-between rounded-2xl p-3.5 border transition-all duration-200 ${
              item.completed
                ? 'bg-emerald-50/70 border-emerald-200 text-gray-500 opacity-80 line-through'
                : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm text-gray-800'
            }`}
          >
            <span className="text-xs font-semibold">{item.title}</span>
            {item.completed ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 hover:text-purple-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
