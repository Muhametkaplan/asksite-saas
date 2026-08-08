'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FileText,
  Ticket,
  RefreshCw,
  BookOpen,
  Hourglass,
  Film,
  Disc,
  Brain,
  User,
  LogOut,
  Key,
  ExternalLink,
  Lock,
  Shield,
  ChevronDown,
  Copy,
  Users,
  Link2,
  LayoutDashboard,
} from 'lucide-react';

import { onAuthStateChanged, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { CoupleConfig, MapMarker, CouponItem, DiaryEntry, CapsuleItem, MovieItem, QuizQuestion } from '@/types/couple';
import { getCoupleBySlug, saveCoupleConfig, addMapMarker, getMapMarkers, clearMapMarkers, deleteMapMarker, resetAllCoupons, formatDiaryDate, connectPartnerWithPairCode, getCoupleByPairCode } from '@/lib/couples';
import { uploadFileToSupabase } from '@/lib/storage';
import LivePreviewFrame from '@/components/LivePreviewFrame';
import QRCodeGenerator from '@/components/QRCodeGenerator';

function DashboardContent() {
  const searchParams = useSearchParams();
  const slugFromUrl = searchParams.get('slug');
  const isNewAccount = searchParams.get('new') === 'true';

  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [userCoupleSlug, setUserCoupleSlug] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'modules' | 'coupons' | 'diary' | 'capsule' | 'cinema' | 'wheel' | 'quiz' | 'map' | 'qr'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // Form State
  const [config, setConfig] = useState<CoupleConfig>({
    slug: slugFromUrl || 'demo',
    partner1_name: 'Partner 1',
    partner2_name: 'Partner 2',
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
    coupons: [],
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
      coupons: true,
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

  // Coupon State
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponCategory, setNewCouponCategory] = useState<'massage' | 'date' | 'food' | 'forgive' | 'movie' | 'custom'>('massage');
  const [newCouponIcon, setNewCouponIcon] = useState('💆‍♂️');

  // Map state
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [newLat, setNewLat] = useState('39.0');
  const [newLng, setNewLng] = useState('35.0');
  const [newMarkerTitle, setNewMarkerTitle] = useState('Bizim Aşk Noktamız ❤️');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const effectiveSlug = slugFromUrl || userCoupleSlug || 'demo';
      const data = await getCoupleBySlug(effectiveSlug);
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

        const existingMarkers = await getMapMarkers(data.id || effectiveSlug);
        setMarkers(existingMarkers);
      }
      setLoading(false);
    }
    loadData();
  }, [slugFromUrl, userCoupleSlug]);

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

  const handleAddCoupon = () => {
    if (!newCouponTitle.trim()) return;
    const coupon: CouponItem = {
      id: `c-${Date.now()}`,
      title: newCouponTitle.trim(),
      description: newCouponDesc.trim() || 'Özel aşk kuponu',
      category: newCouponCategory,
      icon: newCouponIcon || '🎟️',
      is_used: false,
    };
    setConfig((prev) => ({
      ...prev,
      coupons: [...(prev.coupons || []), coupon],
    }));
    setNewCouponTitle('');
    setNewCouponDesc('');
  };

  const handleDeleteCoupon = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      coupons: (prev.coupons || []).filter((c) => c.id !== id),
    }));
  };

  const handleResetAllCoupons = async () => {
    if (confirm('Tüm kuponları yeniden aktif hale getirmek istiyor musunuz?')) {
      await resetAllCoupons(config.slug);
      setConfig((prev) => ({
        ...prev,
        coupons: (prev.coupons || []).map((c) => ({ ...c, is_used: false, used_at: undefined })),
      }));
      setPreviewRefreshKey((prev) => prev + 1);
    }
  };

  const handleDeleteDiaryEntry = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      diary_entries: (prev.diary_entries || []).filter((e) => e.id !== id),
    }));
  };

  // Time Capsule State & Handlers
  const [newCapsuleTitle, setNewCapsuleTitle] = useState('');
  const [newCapsuleContent, setNewCapsuleContent] = useState('');
  const [newCapsuleOpenDate, setNewCapsuleOpenDate] = useState('');

  const handleAddCapsule = () => {
    if (!newCapsuleTitle.trim() || !newCapsuleContent.trim() || !newCapsuleOpenDate) return;
    const capsule: CapsuleItem = {
      id: `tc-${Date.now()}`,
      title: newCapsuleTitle.trim(),
      content: newCapsuleContent.trim(),
      open_date: new Date(newCapsuleOpenDate).toISOString(),
      created_at: new Date().toISOString(),
      creator: config.partner1_name || 'Partner',
      is_opened: false,
    };
    setConfig((prev) => ({
      ...prev,
      time_capsules: [capsule, ...(prev.time_capsules || [])],
    }));
    setNewCapsuleTitle('');
    setNewCapsuleContent('');
    setNewCapsuleOpenDate('');
  };

  const handleDeleteCapsule = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      time_capsules: (prev.time_capsules || []).filter((c) => c.id !== id),
    }));
  };

  // Movie State & Handlers
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieGenre, setNewMovieGenre] = useState('');
  const [newMoviePosterUrl, setNewMoviePosterUrl] = useState('');
  const [newMovieWatchUrl, setNewMovieWatchUrl] = useState('');
  const [newMovieRating, setNewMovieRating] = useState(5);
  const [newMovieNote, setNewMovieNote] = useState('');
  const [newMovieStatus, setNewMovieStatus] = useState<'watched' | 'watchlist'>('watched');

  const handleAddMovieDashboard = () => {
    if (!newMovieTitle.trim()) return;
    const movie: MovieItem = {
      id: `m-${Date.now()}`,
      title: newMovieTitle.trim(),
      genre: newMovieGenre.trim() || 'Film',
      poster_url: newMoviePosterUrl.trim() || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      watch_url: newMovieWatchUrl.trim(),
      rating: newMovieStatus === 'watched' ? newMovieRating : 0,
      note: newMovieNote.trim(),
      status: newMovieStatus,
      added_by: config.partner1_name || 'Partner',
      created_at: new Date().toISOString(),
    };
    setConfig((prev) => ({
      ...prev,
      movies: [movie, ...(prev.movies || [])],
    }));
    setNewMovieTitle('');
    setNewMovieGenre('');
    setNewMoviePosterUrl('');
    setNewMovieWatchUrl('');
    setNewMovieNote('');
  };

  const handleToggleMovieStatus = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      movies: (prev.movies || []).map((m) =>
        m.id === id ? { ...m, status: m.status === 'watched' ? 'watchlist' : 'watched', rating: m.rating || 5 } : m
      ),
    }));
  };

  const handleDeleteMovieDashboard = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      movies: (prev.movies || []).filter((m) => m.id !== id),
    }));
  };

  // Wheel State & Handlers
  const [newWheelItem, setNewWheelItem] = useState('');

  const handleAddWheelItemDashboard = (customText?: string) => {
    const textToAdd = (customText || newWheelItem).trim();
    if (!textToAdd) return;
    setConfig((prev) => ({
      ...prev,
      wheel_items: [...(prev.wheel_items || []), textToAdd],
    }));
    setNewWheelItem('');
  };

  const handleDeleteWheelItemDashboard = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      wheel_items: (prev.wheel_items || []).filter((_, idx) => idx !== index),
    }));
  };

  // Quiz State & Handlers
  const [quizPartnerTab, setQuizPartnerTab] = useState<'partner1' | 'partner2'>('partner1');
  const [newQuizQuestion, setNewQuizQuestion] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  const handleAddQuizQuestionDashboard = () => {
    if (!newQuizQuestion.trim() || !newOptionA.trim() || !newOptionB.trim() || !newOptionC.trim() || !newOptionD.trim()) return;

    const questionObj: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: newQuizQuestion.trim(),
      options: [newOptionA.trim(), newOptionB.trim(), newOptionC.trim(), newOptionD.trim()],
      correct_index: newCorrectIndex,
      created_by: quizPartnerTab,
    };

    const key = quizPartnerTab === 'partner1' ? 'quiz_partner1' : 'quiz_partner2';
    setConfig((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), questionObj],
    }));

    setNewQuizQuestion('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setNewCorrectIndex(0);
  };

  const handleDeleteQuizQuestionDashboard = (partnerKey: 'partner1' | 'partner2', qId: string) => {
    const key = partnerKey === 'partner1' ? 'quiz_partner1' : 'quiz_partner2';
    setConfig((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((q) => q.id !== qId),
    }));
  };

  const handleClearMap = async () => {
    if (confirm('Tüm harita anılarını silmek istediğine emin misin?')) {
      await clearMapMarkers(config.id || config.slug);
      setMarkers([]);
    }
  };

  const handleDeleteSingleMarker = async (markerId?: string) => {
    if (!markerId) return;
    await deleteMapMarker(config.id || config.slug, markerId);
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
  };

  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const [currentUser, setCurrentUser] = useState<{ displayName?: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({
          displayName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
        });
      } else if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('asksite_user');
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {}
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);

  const handleToggleSiteActive = async (newStatus: boolean) => {
    const updated = { ...config, is_active: newStatus };
    setConfig(updated);
    await saveCoupleConfig(updated);
    setDisableModalOpen(false);
  };
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Account Modal Form State
  const [accountName, setAccountName] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');
  const [accountStatusMsg, setAccountStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accountUpdating, setAccountUpdating] = useState(false);

  // Partner Pairing State
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [pairConnecting, setPairConnecting] = useState(false);
  const [pairStatusMsg, setPairStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedPairCode, setCopiedPairCode] = useState(false);

  const handleConnectPartner = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pairCodeInput.trim()) {
      setPairStatusMsg({ type: 'error', text: 'Lütfen eşleşme kodunu girin (Örn: ASK-X79B2).' });
      return;
    }
    setPairConnecting(true);
    setPairStatusMsg(null);
    try {
      const res = await connectPartnerWithPairCode(
        auth.currentUser?.uid || 'demo-user',
        auth.currentUser?.email || 'partner2@example.com',
        pairCodeInput
      );
      if (res.success && res.slug) {
        setPairStatusMsg({ type: 'success', text: res.message || 'Eşleşme başarıyla tamamlandı!' });
        setPairCodeInput('');
        setTimeout(() => {
          window.location.href = `/dashboard?slug=${res.slug}`;
        }, 1500);
      } else {
        setPairStatusMsg({ type: 'error', text: res.message || 'Eşleşme yapılamadı.' });
      }
    } catch (err: any) {
      setPairStatusMsg({ type: 'error', text: err.message || 'Bir hata oluştu.' });
    } finally {
      setPairConnecting(false);
    }
  };

  const copyPairCode = () => {
    const code = config.pair_code || 'ASK-X79B2';
    navigator.clipboard.writeText(code);
    setCopiedPairCode(true);
    setTimeout(() => setCopiedPairCode(false), 2000);
  };

  useEffect(() => {
    async function checkSubscription() {
      if (auth.currentUser && db) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.coupleSlug) {
              setUserCoupleSlug(data.coupleSlug);
              setHasPurchased(true);
            } else if (data.hasPurchasedSite === false || data.hasActiveSubscription === false) {
              setHasPurchased(false);
              setUserCoupleSlug(null);
            } else {
              setHasPurchased(true);
            }
          }
        } catch (e) {}
      }
    }
    checkSubscription();
  }, [currentUser]);

  useEffect(() => {
    async function loadCoupleData() {
      setLoading(true);
      const targetSlug = slugFromUrl || userCoupleSlug || 'demo';
      const fetched = await getCoupleBySlug(targetSlug);
      if (fetched) {
        setConfig(fetched);
      }
      setLoading(false);
    }
    loadCoupleData();
  }, [slugFromUrl, userCoupleSlug]);

  useEffect(() => {
    if (currentUser) {
      setAccountName(currentUser.displayName || '');
      setAccountPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('asksite_user');
    }
    router.push('/login');
  };

  const handleSaveAccountProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountStatusMsg(null);
    setAccountUpdating(true);

    try {
      if (auth.currentUser) {
        if (accountName) {
          await updateProfile(auth.currentUser, { displayName: accountName });
        }
        if (newAccountPassword) {
          if (newAccountPassword.length < 6) {
            setAccountStatusMsg({ type: 'error', text: 'Yeni şifreniz en az 6 karakter olmalıdır.' });
            setAccountUpdating(false);
            return;
          }
          if (newAccountPassword !== confirmAccountPassword) {
            setAccountStatusMsg({ type: 'error', text: 'Şifreler birbiriyle eşleşmiyor.' });
            setAccountUpdating(false);
            return;
          }
          await updatePassword(auth.currentUser, newAccountPassword);
        }

        if (db) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(
            userRef,
            {
              displayName: accountName,
              phone: accountPhone,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      setCurrentUser((prev) => ({
        ...prev,
        displayName: accountName || prev?.displayName,
        phone: accountPhone || prev?.phone,
      }));

      setAccountStatusMsg({ type: 'success', text: 'Profil ve şifre bilgileriniz başarıyla güncellendi!' });
      setNewAccountPassword('');
      setConfirmAccountPassword('');
    } catch (err: any) {
      console.error('Update Account Profile Error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setAccountStatusMsg({ type: 'error', text: 'Şifre değişikliği için güvenlik gereği yeniden giriş yapmalısınız.' });
      } else {
        setAccountStatusMsg({ type: 'error', text: err.message || 'Güncelleme yapılırken bir sorun oluştu.' });
      }
    } finally {
      setAccountUpdating(false);
    }
  };

  const copyLiveLink = () => {
    const fullUrl = baseUrl ? `${baseUrl}/c/${config.slug}` : `https://asksite-saas.vercel.app/c/${config.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-pink-50 text-rose-600 font-bold">
        Yönetim Paneli Yükleniyor... ✨
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 p-4 sm:p-8">
      {/* Top Banner & Profile Dropdown Header */}
      <div className="mx-auto max-w-7xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white/80 backdrop-blur-md p-6 border border-white/90 shadow-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-500 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              <Sparkles className="h-3.5 w-3.5" /> SaaS Yönetim Paneli
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              ₺399 VIP Paket Aktif
            </span>
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
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:scale-102 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Değişiklikleri Kaydet
          </button>

          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle className="h-4 w-4" /> Kaydedildi!
            </span>
          )}

          {/* Sağ Üst Profil Menüsü Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 rounded-2xl bg-white border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-sm hover:bg-gray-50 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white font-extrabold text-xs">
                {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
              </div>
              <span className="max-w-[110px] truncate">{currentUser?.displayName || currentUser?.email || 'Hesabım'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 animate-in fade-in duration-150 text-left">
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-extrabold text-gray-900 truncate">
                    {currentUser?.displayName || 'Müşteri Hesabı'}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {currentUser?.email || ''}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setAccountModalOpen(true);
                    }}
                    className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <User className="h-4 w-4 text-rose-500" /> Profil & Şifre Ayarları
                  </button>

                  {hasPurchased === true && (userCoupleSlug || searchParams.get('slug')) ? (
                    <>
                      <Link
                        href={`/dashboard?slug=${userCoupleSlug || searchParams.get('slug')}`}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-rose-500" /> Çift Sitem / Panel ➔
                      </Link>
                      <a
                        href={`/c/${userCoupleSlug || searchParams.get('slug')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition"
                      >
                        <ExternalLink className="h-4 w-4 text-purple-500" /> Sitemi Gör 🔗
                      </a>
                    </>
                  ) : (
                    <Link
                      href="/checkout"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Sparkles className="h-4 w-4 text-rose-500" /> Paket Seç / Satın Al 🚀
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border-t border-gray-100 mt-1"
                  >
                    <LogOut className="h-4 w-4 text-rose-600" /> Oturumu Kapat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Checkout Callout Banner if no active subscription */}
      {hasPurchased === false && (
        <div className="mx-auto max-w-7xl mb-6 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 p-6 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1 text-left">
            <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white border border-white/30">
              Henüz Aktif Siteniz Bulunmamaktadır 🚀
            </span>
            <h2 className="text-xl font-black">
              Hemen Kendi Çift Sitenizi Oluşturun ve Yayına Alın! 💖
            </h2>
            <p className="text-xs text-white/90">
              Tek tıkla VIP paketinizi tamamlayın, anında kendinize özel link ve QR kod ile çift sayfanızı yönetin.
            </p>
          </div>
          <Link
            href="/checkout"
            className="shrink-0 rounded-2xl bg-white px-6 py-3 text-xs font-black text-rose-600 shadow-xl hover:bg-rose-50 transition active:scale-95 flex items-center gap-1.5"
          >
            Satın Almayı Tamamla (₺399) 🛒
          </Link>
        </div>
      )}

      {/* Aktif Site Yönetim Kartı */}
      <div className="mx-auto max-w-7xl mb-6 rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Aktif Çift Sitesi Yönetim Kartı
              </span>
              {config.is_active !== false ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Canlıda / Yayında 🟢
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  Pasif / Kapatıldı 🔴
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {config.partner1_name} & {config.partner2_name}
            </h2>
            <p className="text-xs text-gray-500">
              {baseUrl ? `${baseUrl}/c/${config.slug}` : `https://asksite-saas.vercel.app/c/${config.slug}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={copyLiveLink}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" /> {copiedLink ? 'Kopyalandı! ✓' : 'Link Kopyala'}
            </button>

            <a
              href={`/c/${config.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:scale-102 transition active:scale-95"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Siteme Git 🔗
            </a>

            {config.is_active !== false ? (
              <button
                onClick={() => setDisableModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition active:scale-95"
              >
                Sitemi Yayından Kaldır / Kapat 🚫
              </button>
            ) : (
              <button
                onClick={() => handleToggleSiteActive(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md hover:scale-102 transition active:scale-95"
              >
                Sitemi Yeniden Yayına Al 🟢
              </button>
            )}
          </div>
        </div>

        {/* Quick Edit Form: İsimler, Tarih & PIN Şifreleri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div>
            <label className="block text-[11px] font-extrabold text-gray-700 mb-1">Partner 1 İsmi</label>
            <input
              type="text"
              value={config.partner1_name}
              onChange={(e) => setConfig((prev) => ({ ...prev, partner1_name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-700 mb-1">Partner 2 İsmi</label>
            <input
              type="text"
              value={config.partner2_name}
              onChange={(e) => setConfig((prev) => ({ ...prev, partner2_name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-700 mb-1">Çift Giriş PIN (4 Haneli)</label>
            <input
              type="text"
              maxLength={4}
              value={config.allowed_users?.access_pin || '1234'}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  allowed_users: {
                    ...(prev.allowed_users || { partner1_email: '', partner2_email: '', access_pin: '1234' }),
                    access_pin: e.target.value,
                  },
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-rose-600 outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Çift Eşleşme Kodu & QR Davet Protokolü */}
        <div className="mt-5 border-t border-gray-100 pt-5 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gradient-to-r from-rose-50/70 via-purple-50/70 to-pink-50/70 p-5 rounded-2xl border border-rose-100/80">
            {/* Left: Current Couple Pair Code & QR */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white font-black text-xs">
                  🤝
                </span>
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Sitenizin Çift Eşleşme Kodu & QR Davetiyesi
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Partneriniz bu kodu girerek aynı sitenin eş yöneticisi (co-owner) olabilir.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-white border border-rose-200 px-4 py-2.5 font-mono text-sm font-black text-rose-600 tracking-widest shadow-inner text-center">
                  {config.pair_code || 'ASK-X79B2'}
                </div>
                <button
                  type="button"
                  onClick={copyPairCode}
                  className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-rose-600 transition shrink-0 active:scale-95 flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" /> {copiedPairCode ? 'Kopyalandı! ✓' : 'Kodu Kopyala'}
                </button>
              </div>
            </div>

            {/* Right: Partner 2 Connect Form */}
            <form onSubmit={handleConnectPartner} className="space-y-2.5 border-t md:border-t-0 md:border-l border-rose-200/60 pt-3 md:pt-0 md:pl-6">
              <label className="block text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-purple-600" /> Başka Bir Çift Koduna Bağlan (Partner Girişi)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Örn: ASK-X79B2"
                  value={pairCodeInput}
                  onChange={(e) => setPairCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-700 outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={pairConnecting}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:opacity-95 transition disabled:opacity-50 shrink-0"
                >
                  {pairConnecting ? 'Bağlanıyor...' : 'Eşleş ve Bağlan 🚀'}
                </button>
              </div>

              {pairStatusMsg && (
                <div
                  className={`rounded-xl p-2.5 text-[11px] font-bold border ${
                    pairStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {pairStatusMsg.text}
                </div>
              )}
            </form>
          </div>
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
              <Sparkles className="h-3.5 w-3.5" /> 3. Modüller
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'coupons'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Ticket className="h-3.5 w-3.5" /> 4. Kuponlar
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`flex-1 min-w-[105px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'diary'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> 5. Anı Defteri
            </button>
            <button
              onClick={() => setActiveTab('capsule')}
              className={`flex-1 min-w-[125px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'capsule'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Hourglass className="h-3.5 w-3.5" /> 6. Zaman Kapsülü
            </button>
            <button
              onClick={() => setActiveTab('cinema')}
              className={`flex-1 min-w-[115px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'cinema'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Film className="h-3.5 w-3.5" /> 7. Sinema & Film
            </button>
            <button
              onClick={() => setActiveTab('wheel')}
              className={`flex-1 min-w-[105px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'wheel'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Disc className="h-3.5 w-3.5" /> 8. Aşk Çarkı
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 min-w-[105px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'quiz'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <Brain className="h-3.5 w-3.5" /> 9. Aşk Testi
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'map'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" /> 10. Harita
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'qr'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-rose-500'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" /> 11. QR & NFC
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Çift PIN Kodu</label>
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

          {/* TAB 4: AŞK KUPONLARI */}
          {activeTab === 'coupons' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-rose-500" /> Aşk Kuponları Yönetimi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sevdiğinize özel dijital kuponlar oluşturun, silin veya tümünü tek tıkla sıfırlayın.
                  </p>
                </div>
                <button
                  onClick={handleResetAllCoupons}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition active:scale-95 shadow-2xs self-start sm:self-auto"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> Tüm Kuponları Yeniden Aktif Et / Sıfırla
                </button>
              </div>

              {/* Yeni Kupon Ekleme Formu */}
              <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 space-y-3">
                <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">
                  ✨ Sınırsız Yeni Kupon Ekle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kupon Başlığı</label>
                    <input
                      type="text"
                      placeholder="Örn: 1 Saat Omuz Masajı 💆‍♂️"
                      value={newCouponTitle}
                      onChange={(e) => setNewCouponTitle(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori / Tema</label>
                    <select
                      value={newCouponCategory}
                      onChange={(e) => {
                        const cat = e.target.value as any;
                        setNewCouponCategory(cat);
                        const icons: Record<string, string> = {
                          massage: '💆‍♂️',
                          forgive: '🕊️',
                          movie: '🍿',
                          food: '🍕',
                          date: '🍷',
                          custom: '✨',
                        };
                        setNewCouponIcon(icons[cat] || '🎟️');
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-500 font-semibold"
                    >
                      <option value="massage">💆‍♂️ Masaj & Rahatlama</option>
                      <option value="forgive">🕊️ Barışma & Sarılma</option>
                      <option value="movie">🍿 Sinema & Dizi</option>
                      <option value="food">🍕 Yemek & Tatlı</option>
                      <option value="date">🍷 Romantik Randevu</option>
                      <option value="custom">✨ Özel Sürpriz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kupon Açıklaması</label>
                  <input
                    type="text"
                    placeholder="Örn: Yorgunluğunu alacak sıcacık bir masaj hakkı."
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  onClick={handleAddCoupon}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-95 transition"
                >
                  <Plus className="h-4 w-4" /> Kuponu Listeye Ekle
                </button>
              </div>

              {/* Mevcut Kuponlar Listesi */}
              <div>
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">
                  Mevcut Kuponlar ({config.coupons?.length || 0})
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(config.coupons || []).map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`flex items-center justify-between rounded-2xl p-3 border text-xs transition ${
                        coupon.is_used ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-rose-100 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{coupon.icon || '🎟️'}</span>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{coupon.title}</span>
                            {coupon.is_used ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 uppercase">
                                KULLANILDI ❌
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                                Aktif ✅
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{coupon.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Kuponu Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANI DEFTERİ */}
          {activeTab === 'diary' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-rose-500" /> Anı Defteri Yönetimi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Çiftin anı defterine yazdığı özel notları ve duygusal günlük kayıtlarını görüntüleyin.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Kayıtlı Anı Notları ({config.diary_entries?.length || 0})
                </h4>

                {(!config.diary_entries || config.diary_entries.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-2xl">
                    Henüz eklenmiş bir anı notu bulunmuyor.
                  </p>
                ) : (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {config.diary_entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between rounded-2xl bg-amber-50/70 p-4 border border-amber-200/80 text-xs shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{entry.mood || '❤️'}</span>
                            <span className="font-extrabold text-amber-950 font-serif">{entry.author}</span>
                            <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              {formatDiaryDate(entry.date)}
                            </span>
                          </div>
                          <p className="font-serif text-gray-800 leading-relaxed pl-1">"{entry.content}"</p>
                        </div>

                        <button
                          onClick={() => handleDeleteDiaryEntry(entry.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition shrink-0 ml-2"
                          title="Notu Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ZAMAN KAPSÜLÜ */}
          {activeTab === 'capsule' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Hourglass className="h-5 w-5 text-rose-500" /> Zaman Kapsülü Yönetimi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Geleceğe mühürlenmiş gizli aşk mektuplarını ve kilit açılış tarihlerini yönetin.
                  </p>
                </div>
              </div>

              {/* Add New Time Capsule Form */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Yeni Zaman Kapsülü Oluştur
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Kapsül Başlığı (Ör: 1. Yıl Mektubumuz ⏳)"
                    value={newCapsuleTitle}
                    onChange={(e) => setNewCapsuleTitle(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="datetime-local"
                    value={newCapsuleOpenDate}
                    onChange={(e) => setNewCapsuleOpenDate(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Gelecekte kilit açıldığında görünecek gizli mesaj..."
                  value={newCapsuleContent}
                  onChange={(e) => setNewCapsuleContent(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleAddCapsule}
                  disabled={!newCapsuleTitle.trim() || !newCapsuleContent.trim() || !newCapsuleOpenDate}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-102 transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Kapsülü Kilitle & Kaydet 🔒
                </button>
              </div>

              {/* Capsule List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Kayıtlı Zaman Kapsülleri ({config.time_capsules?.length || 0})
                </h4>

                {(!config.time_capsules || config.time_capsules.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-2xl">
                    Henüz oluşturulmuş bir zaman kapsülü bulunmuyor.
                  </p>
                ) : (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {config.time_capsules.map((capsule) => {
                      const isLocked = new Date(capsule.open_date).getTime() > new Date().getTime();
                      return (
                        <div
                          key={capsule.id}
                          className="flex items-start justify-between rounded-2xl bg-slate-900 text-white p-4 border border-slate-800 text-xs shadow-md"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-amber-300">{capsule.title}</span>
                              {isLocked ? (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                                  KİLİTLİ 🔒
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                  AÇILABİLİR 🔓
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 italic font-serif">"{capsule.content}"</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Açılış Tarihi: {formatDiaryDate(capsule.open_date)} | Yazar: {capsule.creator}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteCapsule(capsule.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-900/60 hover:text-rose-400 transition shrink-0 ml-2"
                            title="Kapsülü Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SİNEMA & FİLM */}
          {activeTab === 'cinema' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Film className="h-5 w-5 text-rose-500" /> Sinema & Film Yönetimi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Birlikte izlediğiniz ve izlemeyi planladığınız tüm film/dizileri yönetin.
                  </p>
                </div>
              </div>

              {/* Add New Movie Form */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Yeni Film / Dizi Kaydı Ekle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Film/Dizi Adı *"
                    value={newMovieTitle}
                    onChange={(e) => setNewMovieTitle(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="Tür (Ör: Romantik Komedi)"
                    value={newMovieGenre}
                    onChange={(e) => setNewMovieGenre(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    placeholder="Afiş Görsel URL (Poster)"
                    value={newMoviePosterUrl}
                    onChange={(e) => setNewMoviePosterUrl(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <input
                    type="url"
                    placeholder="İzleme / Fragman Linki (Watch URL)"
                    value={newMovieWatchUrl}
                    onChange={(e) => setNewMovieWatchUrl(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <select
                    value={newMovieStatus}
                    onChange={(e) => setNewMovieStatus(e.target.value as 'watched' | 'watchlist')}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2 text-xs text-white outline-none focus:border-rose-500"
                  >
                    <option value="watched">🍿 Birlikte İzledik</option>
                    <option value="watchlist">🎬 İzlenecekler Listesinde</option>
                  </select>

                  {newMovieStatus === 'watched' && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Puan:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewMovieRating(star)}
                          className={`text-sm ${star <= newMovieRating ? 'text-amber-400 font-bold' : 'text-gray-600'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddMovieDashboard}
                    disabled={!newMovieTitle.trim()}
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-102 transition disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Filmi Kaydet 🍿
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Çift Notu (Ör: İnanılmaz tatlı bir sonu vardı!)"
                  value={newMovieNote}
                  onChange={(e) => setNewMovieNote(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>

              {/* Movies List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Kayıtlı Filmler ({config.movies?.length || 0})
                </h4>

                {(!config.movies || config.movies.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-2xl">
                    Henüz eklenmiş bir film bulunmuyor.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {config.movies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-rose-100 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={movie.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop'}
                            alt={movie.title}
                            className="h-12 w-9 rounded-lg object-cover border shrink-0"
                          />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span>{movie.title}</span>
                              <span className="text-[10px] text-gray-500 font-normal">({movie.genre || 'Film'})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {movie.status === 'watched' ? (
                                <button
                                  onClick={() => handleToggleMovieStatus(movie.id)}
                                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase hover:bg-amber-100 hover:text-amber-800 transition"
                                  title="İzleneceklere Al"
                                >
                                  İzledik 🍿 ({movie.rating || 5}/5 ★)
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleMovieStatus(movie.id)}
                                  className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase hover:bg-emerald-100 hover:text-emerald-700 transition"
                                  title="İzlenenlere Aktar"
                                >
                                  İzlenecek 🎬 (İzledik Olarak İşaretle 🍿)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMovieDashboard(movie.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0 ml-2"
                          title="Filmi Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: AŞK ÇARKI */}
          {activeTab === 'wheel' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Disc className="h-5 w-5 text-rose-500" /> Aşk Çarkıfeleği Yönetimi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Çarkta yer alacak romantik görev ve sürpriz seçeneklerini düzenleyin.
                  </p>
                </div>
              </div>

              {/* Add New Wheel Task Form */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Yeni Çark Dilimi / Görevi Ekle
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ör: Romantik Masaj Yap 💆‍♂️ veya Akşam Yemeği Ismarla 🍕"
                    value={newWheelItem}
                    onChange={(e) => setNewWheelItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddWheelItemDashboard();
                    }}
                    className="flex-1 rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleAddWheelItemDashboard()}
                    disabled={!newWheelItem.trim()}
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-102 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Dilim Ekle
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Hızlı Hazır Görev Önerileri (Tıkla ve Ekle):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '10 Saniye Sımsıkı Sarıl 🫂',
                      'İstediğin Bir Şeyi Yaptır 👑',
                      'Akşam Yemeği Ismarla 🍕',
                      'Sinema Biletleri Benden 🍿',
                      'Masaj Yap 💆‍♂️',
                      'Romantik Bir Öpücük 💋',
                      'Kahve Demle & Yatakta Sun ☕',
                      'Soru Sormadan Affet 🕊️',
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddWheelItemDashboard(preset)}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-950 hover:text-white border border-slate-700 transition"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wheel Tasks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Çarktaki Aktif Görevler ({config.wheel_items?.length || 0})
                </h4>

                {(!config.wheel_items || config.wheel_items.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-2xl">
                    Henüz çark dilimi eklenmemiş. Yukarıdaki hazır önerilerden ekleyebilirsiniz!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {config.wheel_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl bg-white p-3 border border-rose-100 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 font-bold text-rose-600 text-[11px]">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-gray-800">{item}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteWheelItemDashboard(idx)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                          title="Dilimi Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: AŞK TESTİ */}
          {activeTab === 'quiz' && (
            <div className="rounded-3xl bg-white p-6 shadow-md border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-rose-500" /> Aşk Testi (Love Quiz) Yönetimi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Partneriniz için özel 4 şıklı sorular hazırlayın.
                  </p>
                </div>
              </div>

              {/* Quiz Partner Selector Tabs */}
              <div className="flex rounded-2xl bg-gray-100 p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuizPartnerTab('partner1')}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition ${
                    quizPartnerTab === 'partner1'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-rose-500'
                  }`}
                >
                  💖 {config.partner1_name} İçi Soru Paneli ({config.quiz_partner1?.length || 0} Soru)
                </button>
                <button
                  type="button"
                  onClick={() => setQuizPartnerTab('partner2')}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition ${
                    quizPartnerTab === 'partner2'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-rose-500'
                  }`}
                >
                  💙 {config.partner2_name} İçi Soru Paneli ({config.quiz_partner2?.length || 0} Soru)
                </button>
              </div>

              {/* Add New Question Form */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Yeni Soru Ekle ({quizPartnerTab === 'partner1' ? config.partner1_name : config.partner2_name})
                </h4>

                <input
                  type="text"
                  placeholder="Soru Cümlesi (Ör: Benim en sevdiğim tatlı nedir?)"
                  value={newQuizQuestion}
                  onChange={(e) => setNewQuizQuestion(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="A Şıkkı"
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="B Şıkkı"
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="C Şıkkı"
                    value={newOptionC}
                    onChange={(e) => setNewOptionC(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="D Şıkkı"
                    value={newOptionD}
                    onChange={(e) => setNewOptionD(e.target.value)}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-[11px] font-bold text-slate-300">Doğru Cevap:</label>
                    <select
                      value={newCorrectIndex}
                      onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
                      className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-amber-300 font-bold outline-none focus:border-rose-500"
                    >
                      <option value={0}>A Şıkkı</option>
                      <option value={1}>B Şıkkı</option>
                      <option value={2}>C Şıkkı</option>
                      <option value={3}>D Şıkkı</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddQuizQuestionDashboard}
                    disabled={!newQuizQuestion.trim() || !newOptionA.trim() || !newOptionB.trim() || !newOptionC.trim() || !newOptionD.trim()}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-102 transition disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Soruyu Kaydet 🧩
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Kayıtlı Sorular ({(quizPartnerTab === 'partner1' ? config.quiz_partner1 : config.quiz_partner2)?.length || 0})
                </h4>

                {(!((quizPartnerTab === 'partner1' ? config.quiz_partner1 : config.quiz_partner2)?.length)) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-2xl">
                    Henüz soru eklenmemiş. Yukarıdaki formdan yeni soru ekleyebilirsiniz!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {(quizPartnerTab === 'partner1' ? config.quiz_partner1 : config.quiz_partner2)?.map((q, idx) => (
                      <div
                        key={q.id}
                        className="flex items-start justify-between rounded-2xl bg-white p-3.5 border border-rose-100 text-xs shadow-2xs space-y-1"
                      >
                        <div className="space-y-1 pr-2">
                          <div className="font-extrabold text-gray-900 flex items-center gap-2">
                            <span className="text-rose-500">#{idx + 1}</span>
                            <span>{q.question}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600 pl-4">
                            {q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={oIdx === q.correct_index ? 'font-bold text-emerald-600 underline' : ''}
                              >
                                {String.fromCharCode(65 + oIdx)}: {opt} {oIdx === q.correct_index && '✓'}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteQuizQuestionDashboard(quizPartnerTab, q.id)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                          title="Soruyu Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: HARİTA NOKTALARI */}
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
                {markers.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3 text-center bg-gray-50 rounded-xl">
                    Henüz haritaya eklenmiş bir kalp noktası bulunmuyor.
                  </p>
                ) : (
                  markers.map((m, i) => (
                    <div key={m.id || i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">
                      <span>❤️ {m.title || 'Aşk Noktası'} ({m.lat.toFixed(2)}, {m.lng.toFixed(2)})</span>
                      <button
                        onClick={() => handleDeleteSingleMarker(m.id)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-rose-100 hover:text-rose-600 transition shrink-0 ml-2"
                        title="Kalbi Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
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

      {/* Account Profile & Password Settings Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 relative text-left">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-rose-500" /> Profil & Şifre Ayarları
              </h3>
              <button
                onClick={() => setAccountModalOpen(false)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccountProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  value={accountPhone}
                  onChange={(e) => setAccountPhone(e.target.value)}
                  placeholder="905520000000"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-purple-600" /> Şifre Değiştir (İsteğe Bağlı)
                </label>
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Yeni Şifre (En az 6 karakter)"
                    value={newAccountPassword}
                    onChange={(e) => setNewAccountPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500"
                  />
                  <input
                    type="password"
                    placeholder="Yeni Şifre Tekrar"
                    value={confirmAccountPassword}
                    onChange={(e) => setConfirmAccountPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Çift Eşleşme Kodu & QR Okut Modülü */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-rose-500" /> Çift Eşleşme Kodu (Davet Kodu)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-mono font-bold text-rose-600">
                    {config.pair_code || 'ASK-X79B2'}
                  </div>
                  <button
                    type="button"
                    onClick={copyPairCode}
                    className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition shrink-0"
                  >
                    {copiedPairCode ? 'Kopyalandı! ✓' : 'Kodu Kopyala'}
                  </button>
                </div>
              </div>

              {accountStatusMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold text-center border ${
                    accountStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}
                >
                  {accountStatusMsg.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={accountUpdating}
                  className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-5 py-2 text-xs font-extrabold text-white shadow-md hover:opacity-95 transition disabled:opacity-50"
                >
                  {accountUpdating ? 'Güncelleniyor...' : 'Hesabı Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Disable Confirmation Modal */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 text-left">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 text-xl font-bold">
              🚫
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">
                Sitenizi Pasife Almak Üzeresiniz 🚫
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Siteniz dışarıdan erişime kapatılacak ve ziyaretçilere <span className="font-bold text-rose-600 text-[11px]">&apos;Bu sayfa sahibi tarafından geçici olarak erişime kapatılmıştır&apos;</span> uyarısı gösterilecektir. Ancak hesap bilgileriniz ve tüm verileriniz güvenle saklanacaktır.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDisableModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleToggleSiteActive(false)}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-rose-700 transition"
              >
                Evet, Sitemi Kapat 🔒
              </button>
            </div>
          </div>
        </div>
      )}
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
