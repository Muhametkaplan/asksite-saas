'use client';

interface PbnToolbarProps {
  onUndo: () => void;
  onHint: () => void;
  onReset: () => void;
  onSave: () => void;
  onToggleNumbers: () => void;
  showNumbers: boolean;
  hintsUsed: number;
  canUndo: boolean;
  progress: number; // 0-100
}

export default function PbnToolbar({
  onUndo,
  onHint,
  onReset,
  onSave,
  onToggleNumbers,
  showNumbers,
  hintsUsed,
  canUndo,
  progress,
}: PbnToolbarProps) {
  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f43f5e, #a855f7)',
            }}
          />
        </div>
        <span className="text-xs font-black text-gray-700 tabular-nums w-10 text-right">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Geri Al (Ctrl+Z)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 14L4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" strokeLinecap="round" />
          </svg>
          Geri Al
        </button>

        {/* Hint */}
        <button
          onClick={onHint}
          title={`İpucu — ${hintsUsed} kez kullanıldı`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 transition active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
          İpucu {hintsUsed > 0 ? `(${hintsUsed})` : ''}
        </button>

        {/* Toggle Numbers */}
        <button
          onClick={onToggleNumbers}
          title={showNumbers ? 'Sayıları Gizle' : 'Sayıları Göster'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-90 ${
            showNumbers ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {showNumbers ? 'Sayılar' : 'Gizli'}
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          title="Galeri'ye Kaydet"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kaydet
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="Sıfırla"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
            <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sıfırla
        </button>
      </div>
    </div>
  );
}
