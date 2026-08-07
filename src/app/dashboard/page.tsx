'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Heart,
  Palette,
  MapPin,
  QrCode,
  Save,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Music,
  FileText
} from 'lucide-react';

import { CoupleConfig, MapMarker } from '@/types/couple';
import { getCoupleBySlug, saveCoupleConfig, addMapMarker, getMapMarkers, clearMapMarkers } from '@/lib/couples';
import { uploadFileToSupabase } from '@/lib/storage';
import LivePreviewFrame from '@/components/LivePreviewFrame';
import QRCodeGenerator from '@/components/QRCodeGenerator';

function DashboardContent() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get('slug') || 'irem-muhammet';
  const isNewAccount = searchParams.get('new') === 'true';

  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'modules' | 'map' | 'qr'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // Form State
  const [config, setConfig] = useState<CoupleConfig>({
    slug: slugFromUrl,
    partner1_name: 'İrem',
    partner2_name: 'Muhammet',
    subtitle: 'Bizim Dünyamız ❤️',
    start_date: new Date().toISOString().split('T')[0],
    theme_color_primary: '#ff4d6d',
    theme_color_tech: '#6c5ce7',
    bg_music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    custom_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
    spotify_lyrics: [
      'Sen benim kalbimin en tatlı melodisisin... 🎶',
      'Gözlerine baktığım an zaman duruyor...',
    ],
    whatsapp_number: '905524185530',
    whatsapp_message: 'Acil sarılmana ihtiyacım var 🥺',
    love_reasons: ['Gülüşünle dünyamı aydınlatıyorsun.'],
    memories: [],
    bucket_list: [],
    upcoming_event: { title: 'Kapadokya Yıl Dönümü Kaçamağı 🎈', date: '2026-09-15' },
    feature_toggles: {
      spotify: true,
      memory: true,
      bucket_list: true,
      day_night: true,
      countdown: true,
      custom_audio: true,
      canvas: true,
      love_jar: true,
      map: true,
    },
  });

  const [newReasonText, setNewReasonText] = useState('');
  
  // New Module Inputs
  const [newLyricText, setNewLyricText] = useState('');
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemDate, setNewMemDate] = useState('');
  const [newMemPhoto, setNewMemPhoto] = useState('');
  const [newMemNote, setNewMemNote] = useState('');

  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketCategory, setNewBucketCategory] = useState<'city' | 'movie' | 'activity'>('city');

  // Map state
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [newLat, setNewLat] = useState('39.0');
  const [newLng, setNewLng] = useState('35.0');
  const [newMarkerTitle, setNewMarkerTitle] = useState('Bizim Aşk Noktamız ❤️');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getCoupleBySlug(slugFromUrl);
      if (data) {
        setConfig({
          ...data,
          start_date: data.start_date ? data.start_date.split('T')[0] : '2023-01-01',
          upcoming_event: data.upcoming_event
            ? { ...data.upcoming_event, date: data.upcoming_event.date ? data.upcoming_event.date.split('T')[0] : '2026-09-15' }
            : undefined,
          feature_toggles: data.feature_toggles || {
            spotify: true,
            memory: true,
            bucket_list: true,
            day_night: true,
            countdown: true,
            custom_audio: true,
            canvas: true,
            love_jar: true,
            map: true,
          },
        });

        const existingMarkers = await getMapMarkers(data.id || slugFromUrl);
        setMarkers(existingMarkers);
      }
      setLoading(false);
    }
    loadData();
  }, [slugFromUrl]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    const saved = await saveCoupleConfig({
      ...config,
      start_date: new Date(config.start_date).toISOString(),
      upcoming_event: config.upcoming_event
        ? { ...config.upcoming_event, date: new Date(config.upcoming_event.date).toISOString() }
        : undefined,
    });

    if (saved) {
      setSavedSuccess(true);
      setPreviewRefreshKey((prev) => prev + 1);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleToggleFeature = (feature: keyof NonNullable<CoupleConfig['feature_toggles']>) => {
    setConfig((prev) => ({
      ...prev,
      feature_toggles: {
        ...prev.feature_toggles,
        [feature]: !prev.feature_toggles?.[feature],
      },
    }));
    setPreviewRefreshKey((prev) => prev + 1);
  };

  const handleAddLyric = () => {
    if (!newLyricText.trim()) return;
    setConfig((prev) => ({
      ...prev,
      spotify_lyrics: [...(prev.spotify_lyrics || []), newLyricText.trim()],
    }));
    setNewLyricText('');
  };

  const handleRemoveLyric = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      spotify_lyrics: (prev.spotify_lyrics || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddMemory = () => {
    if (!newMemTitle.trim()) return;
    const item = {
      id: `mem-${Date.now()}`,
      title: newMemTitle.trim(),
      date: newMemDate || new Date().toISOString().split('T')[0],
      photo_url: newMemPhoto.trim() || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
      note: newMemNote.trim() || 'Unutulmaz bir anı...',
    };
    setConfig((prev) => ({
      ...prev,
      memories: [...(prev.memories || []), item],
    }));
    setNewMemTitle('');
    setNewMemPhoto('');
    setNewMemNote('');
  };

  const handleRemoveMemory = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      memories: (prev.memories || []).filter((m) => m.id !== id),
    }));
  };

  const handleAddBucketItem = () => {
    if (!newBucketTitle.trim()) return;
    const item = {
      id: `bck-${Date.now()}`,
      title: newBucketTitle.trim(),
      category: newBucketCategory,
      completed: false,
    };
    setConfig((prev) => ({
      ...prev,
      bucket_list: [...(prev.bucket_list || []), item],
    }));
    setNewBucketTitle('');
  };

  const handleRemoveBucketItem = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      bucket_list: (prev.bucket_list || []).filter((b) => b.id !== id),
    }));
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadFileToSupabase(file, 'music');
    if (uploadedUrl) {
      setConfig((prev) => ({ ...prev, bg_music_url: uploadedUrl, custom_audio_url: uploadedUrl }));
    }
  };

  const handleAddReason = () => {
    if (!newReasonText.trim()) return;
    setConfig((prev) => ({
      ...prev,
      love_reasons: [...prev.love_reasons, newReasonText.trim()],
    }));
    setNewReasonText('');
  };

  const handleRemoveReason = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      love_reasons: prev.love_reasons.filter((_, i) => i !== index),
    }));
  };

  const handleAddMarker = async () => {
    const latNum = parseFloat(newLat);
    const lngNum = parseFloat(newLng);
    if (isNaN(latNum) || isNaN(lngNum)) return;

    const created = await addMapMarker({
      couple_id: config.id || config.slug,
      lat: latNum,
      lng: lngNum,
      title: newMarkerTitle,
    });

    if (created) {
      setMarkers((prev) => [...prev, created]);
      setNewMarkerTitle('Bizim Aşk Noktamız ❤️');
    }
  };

  const handleClearMap = async () => {
    if (confirm('Tüm harita anılarını silmek istediğine emin misin?')) {
      await clearMapMarkers(config.id || config.slug);
      setMarkers([]);
    }
  };

  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-pink-50 text-rose-600 font-bold">
        Yönetim Paneli Yükleniyor... ✨
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 p-4 sm:p-8">
      {/* Top Banner */}
      <div className="mx-auto max-w-7xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white/80 backdrop-blur-md p-6 border border-white/90 shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" /> Müşteri Yönetim Paneli
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {config.partner1_name} & {config.partner2_name} Siteniz 💖
          </h1>
          <p className="text-xs text-gray-500">
            Canlı Linkiniz:{' '}
            <a href={`/c/${config.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-600 hover:underline">
              {baseUrl ? `${baseUrl}/c/${config.slug}` : `/c/${config.slug}`}
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Değişiklikleri Kaydet
          </button>

          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle className="h-4 w-4" /> Kaydedildi!
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left Editor Wizard, Right Live Preview */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Wizard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap rounded-2xl bg-white/70 p-1.5 shadow-sm border border-white/80 gap-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'info'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Heart className="h-3.5 w-3.5" /> 1. Temel
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'media'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Palette className="h-3.5 w-3.5" /> 2. Görsel & Ses
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'modules'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> 3. Modüller & Toggles
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'map'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" /> 4. Harita
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'qr'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" /> 5. QR & NFC
            </button>
          </div>

          {/* TAB 1: TEMEL BİLGİLER */}
          {activeTab === 'info' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" /> Çift & İletişim Bilgileri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Partner 1 İsmi</label>
                  <input
                    type="text"
                    value={config.partner1_name}
                    onChange={(e) => setConfig({ ...config, partner1_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Partner 2 İsmi</label>
                  <input
                    type="text"
                    value={config.partner2_name}
                    onChange={(e) => setConfig({ ...config, partner2_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alt Başlık Mesajı</label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">İlişki Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={config.start_date}
                    onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Sarılma Numarası</label>
                  <input
                    type="text"
                    value={config.whatsapp_number}
                    onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Hazır Sarılma Mesajı</label>
                <input
                  type="text"
                  value={config.whatsapp_message}
                  onChange={(e) => setConfig({ ...config, whatsapp_message: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GÖRSEL & SES & SEVGİ KAVANOZU */}
          {activeTab === 'media' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Music className="h-5 w-5 text-rose-500" /> Müzik & Renk Teması & Sevgi Kavanozu
              </h3>

              {/* Music upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Arka Plan Müziği (MP3 URL)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={config.bg_music_url}
                    onChange={(e) => setConfig({ ...config, bg_music_url: e.target.value, custom_audio_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none"
                  />
                  <label className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200">
                    <Upload className="h-4 w-4" /> MP3 Yükle
                    <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Love jar note editor */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Sevgi Kavanozu Notları (Şu an {config.love_reasons.length} not var)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Kavanoza eklemek istediğin romantik bir söz yaz..."
                    value={newReasonText}
                    onChange={(e) => setNewReasonText(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none"
                  />
                  <button
                    onClick={handleAddReason}
                    className="flex items-center gap-1 rounded-xl bg-pink-500 px-4 py-2 text-xs font-bold text-white hover:bg-pink-600"
                  >
                    <Plus className="h-4 w-4" /> Ekle
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {config.love_reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-900">
                      <span>✨ {reason}</span>
                      <button onClick={() => handleRemoveReason(idx)} className="text-rose-400 hover:text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ÖZEL MODÜLLER & TOGGLES */}
          {activeTab === 'modules' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose-500" /> Modül Aç / Kapat (Toggle Switches) & İçerikler
              </h3>

              {/* Toggle Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">🎵 Spotify & Karaoke</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.spotify !== false}
                    onChange={() => handleToggleFeature('spotify')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">📸 Günün Anısı Kartı</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.memory !== false}
                    onChange={() => handleToggleFeature('memory')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">✈️ Birlikte Rotamız (Bucket List)</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.bucket_list !== false}
                    onChange={() => handleToggleFeature('bucket_list')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">🌙 Dinamik Saat Karşılama</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.day_night !== false}
                    onChange={() => handleToggleFeature('day_night')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">⏳ Etkinlik Geri Sayımı</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.countdown !== false}
                    onChange={() => handleToggleFeature('countdown')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">🎶 Özel HTML5 Müzik Çalar</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.custom_audio !== false}
                    onChange={() => handleToggleFeature('custom_audio')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">🎨 Real-time Live Canvas</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.canvas !== false}
                    onChange={() => handleToggleFeature('canvas')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">🏺 Sevgi Kavanozu (Love Jar)</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.love_jar !== false}
                    onChange={() => handleToggleFeature('love_jar')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white shadow-xs">
                  <span className="text-xs font-bold text-gray-800">📌 Aşk Haritası (Map Markers)</span>
                  <input
                    type="checkbox"
                    checked={config.feature_toggles?.map !== false}
                    onChange={() => handleToggleFeature('map')}
                    className="h-4 w-4 accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Partner Auth & PIN Settings */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  🔐 Çift İçi Kimlik Doğrulama & PIN Ayarları
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">4 Haneli Çift PIN'i</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={config.allowed_users?.access_pin || '1234'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          allowed_users: { ...config.allowed_users, access_pin: e.target.value },
                        })
                      }
                      className="w-full text-center font-bold tracking-widest rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Ziyaretçi PIN Kodu</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={config.allowed_users?.visitor_pin || '1111'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          allowed_users: { ...config.allowed_users, visitor_pin: e.target.value },
                        })
                      }
                      className="w-full text-center font-bold tracking-widest rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{config.partner1_name} E-Postası</label>
                    <input
                      type="email"
                      value={config.allowed_users?.partner1_email || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          allowed_users: { ...config.allowed_users, partner1_email: e.target.value },
                        })
                      }
                      placeholder="irem@asksite.com"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{config.partner2_name} E-Postası</label>
                    <input
                      type="email"
                      value={config.allowed_users?.partner2_email || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          allowed_users: { ...config.allowed_users, partner2_email: e.target.value },
                        })
                      }
                      placeholder="muhammet@asksite.com"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* 1. Spotify & Karaoke Editor */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  🎵 Spotify & Karaoke Ayarları
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Spotify Playlist / Track Embed Linki</label>
                  <input
                    type="text"
                    value={config.spotify_url || ''}
                    onChange={(e) => setConfig({ ...config, spotify_url: e.target.value })}
                    placeholder="https://open.spotify.com/embed/playlist/..."
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Karaoke Akış Sözleri</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Romantik bir şarkı dizesi ekle..."
                      value={newLyricText}
                      onChange={(e) => setNewLyricText(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none"
                    />
                    <button
                      onClick={handleAddLyric}
                      className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {(config.spotify_lyrics || []).map((lyric, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700">
                        <span>🎵 "{lyric}"</span>
                        <button onClick={() => handleRemoveLyric(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Günün Anısı Galerisi */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  📸 Günün Anısı Sürpriz Kartları ({config.memories?.length || 0} Anı)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Anı Başlığı (Örn: Deniz Kenarı Sunset)"
                    value={newMemTitle}
                    onChange={(e) => setNewMemTitle(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="date"
                    value={newMemDate}
                    onChange={(e) => setNewMemDate(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Fotoğraf Görsel URL'si"
                    value={newMemPhoto}
                    onChange={(e) => setNewMemPhoto(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Romantik Notunuz"
                    value={newMemNote}
                    onChange={(e) => setNewMemNote(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none sm:col-span-2"
                  />
                </div>
                <button
                  onClick={handleAddMemory}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600"
                >
                  <Plus className="h-4 w-4 inline mr-1" /> Anı Ekle
                </button>
                <div className="space-y-2 max-h-36 overflow-y-auto pt-1">
                  {(config.memories || []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{m.title}</span> ({m.date})
                        <p className="text-[11px] text-gray-500 truncate">{m.note}</p>
                      </div>
                      <button onClick={() => handleRemoveMemory(m.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Bucket List Editor */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  ✈️ Bucket List Maddeleri ({config.bucket_list?.length || 0} Madde)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Gezilecek şehir, film veya aktivite..."
                    value={newBucketTitle}
                    onChange={(e) => setNewBucketTitle(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none"
                  />
                  <select
                    value={newBucketCategory}
                    onChange={(e: any) => setNewBucketCategory(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                  >
                    <option value="city">Şehir</option>
                    <option value="movie">Film</option>
                    <option value="activity">Aktivite</option>
                  </select>
                  <button
                    onClick={handleAddBucketItem}
                    className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600"
                  >
                    Ekle
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(config.bucket_list || []).map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs">
                      <span>
                        {b.category === 'city' ? '🏙️' : b.category === 'movie' ? '🍿' : '🎯'} {b.title}
                      </span>
                      <button onClick={() => handleRemoveBucketItem(b.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Upcoming Event Editor */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  ⏳ Yaklaşan Etkinlik Geri Sayımı
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Etkinlik Başlığı</label>
                    <input
                      type="text"
                      value={config.upcoming_event?.title || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          upcoming_event: { ...config.upcoming_event, title: e.target.value, date: config.upcoming_event?.date || '' },
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hedef Tarih</label>
                    <input
                      type="date"
                      value={config.upcoming_event?.date || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          upcoming_event: { ...config.upcoming_event, title: config.upcoming_event?.title || '', date: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Konum / Şehir</label>
                    <input
                      type="text"
                      value={config.upcoming_event?.location || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          upcoming_event: { ...config.upcoming_event, title: config.upcoming_event?.title || '', date: config.upcoming_event?.date || '', location: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HARİTA NOKTALARI */}
          {activeTab === 'map' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" /> Harita Anı Noktaları Ekle / Çıkar
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Enlem (Lat)</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Boylam (Lng)</label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    value={newMarkerTitle}
                    onChange={(e) => setNewMarkerTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleAddMarker}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600"
                >
                  <Plus className="h-4 w-4" /> Kalp Noktası Ekle
                </button>
                <button
                  onClick={handleClearMap}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200"
                >
                  <Trash2 className="h-4 w-4" /> Tümünü Temizle
                </button>
              </div>

              {/* Marker List */}
              <div className="space-y-2 pt-2">
                {markers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    <span>❤️ {m.title || 'Aşk Noktası'} ({m.lat.toFixed(2)}, {m.lng.toFixed(2)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HD QR KOD & NFC KART */}
          {activeTab === 'qr' && (
            <QRCodeGenerator
              slug={config.slug}
              partner1={config.partner1_name}
              partner2={config.partner2_name}
            />
          )}
        </div>

        {/* Right Desktop Live Preview (5 cols) */}
        <div className="lg:col-span-5 hidden lg:block sticky top-8">
          <LivePreviewFrame slug={config.slug} previewUrl={`/c/${config.slug}`} refreshKey={previewRefreshKey} />
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-rose-500 font-bold">Dashboard yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
