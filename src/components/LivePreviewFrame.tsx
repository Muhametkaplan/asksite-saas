'use client';

import { useEffect, useState } from 'react';
import { Smartphone, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LivePreviewFrameProps {
  slug: string;
  previewUrl?: string;
  refreshKey?: number;
}

export default function LivePreviewFrame({ slug, previewUrl, refreshKey = 0 }: LivePreviewFrameProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [refreshKey]);

  // Ensure relative route /c/${slug}
  const relativeUrl = previewUrl || `/c/${slug}`;

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Smartphone className="h-4 w-4 text-rose-500" /> Canlı Telefon Önizlemesi (Live Preview)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-xs text-gray-500 font-semibold hover:text-rose-600 transition"
            title="Yenile"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </button>
          <Link
            href={`/c/${slug}`}
            target="_blank"
            className="flex items-center gap-1 text-xs text-rose-600 font-semibold hover:underline ml-2"
          >
            Tam Ekran Aç <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Realistic Mobile Frame */}
      <div className="relative h-[680px] w-[340px] rounded-[48px] border-[12px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden ring-1 ring-gray-800/50">
        {/* Speaker Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 rounded-b-2xl bg-gray-900 z-20 flex items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-gray-800" />
        </div>

        {/* Live Iframe */}
        <iframe
          key={key}
          src={relativeUrl}
          className="h-full w-full bg-white pt-4"
          title="Couple Website Live Preview"
        />
      </div>
    </div>
  );
}
