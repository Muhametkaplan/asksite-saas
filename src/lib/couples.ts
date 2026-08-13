import { CoupleConfig, MapMarker, CouponItem, DiaryEntry, CapsuleItem, MovieItem, QuizQuestion, CanvasDrawing } from '@/types/couple';
import { db, isFirebaseConfigured } from './firebase';
import { validateGameScore, validateSlug } from './validation';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

export const DEMO_COUPLE: CoupleConfig = {
  id: 'demo',
  slug: 'demo',
  pair_code: 'ASK-DEMO1',
  inviteCode: 'ASK-DEMO1',
  partner1_name: 'Partner 1',
  partner2_name: 'Partner 2',
  partner1_score: 0,
  partner2_score: 0,
  subtitle: 'Bizim Dünyamız ❤️',
  start_date: '2023-01-01T00:00:00.000Z',
  theme_color_primary: '#ff4d6d',
  theme_color_tech: '#6c5ce7',
  bg_music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  custom_audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  spotify_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZQD1rStM4VL',
  spotify_lyrics: [
    'Sen benim kalbimin en tatlı melodisisin... 🎶',
    'Gözlerine baktığım an zaman duruyor...',
    'Birlikte yazacağımız nice masallara ❤️',
    'Sensiz geçen her saniye eksik bir parça...',
  ],
  whatsapp_number: '905520000000',
  whatsapp_message: 'Acil sarılmana ihtiyacım var 🥺',
  love_reasons: [
    'Gülüşünle en karanlık günlerimi bile aydınlatıyorsun.',
    'Bana her durumda güç veriyorsun ve hep arkamda duruyorsun.',
    'Seninleyken zamanın nasıl aktığını unutuyorum.',
    'Gözlerinin içi parlayarak güldüğün an dünyadaki her şey güzelleşiyor.',
    'Senin sesin, duyduğum en huzurlu ve en tatlı melodi.',
    'Beni tüm çocuksu hallerimle ve kusurlarımla kusursuz seviyorsun.',
    'Birlikte saçmalayabiliyor, en anlamsız şeylere dakikalarca gülebiliyoruz.',
    'Benim hayattaki en yakın arkadaşım, en sırdaşım ve tek aşkımsın.',
    'Varlığın ve kokun bana evdeymişim hissi veriyor, huzur buluyorum.',
    'Kötü bir gün geçirsem bile sana sarıldığım an her şeyi arkamda bırakabiliyorum.',
    'Geleceğe dair kurduğum her hayalin başrolünde sen varsın.',
    'Küçük sürprizlerinle, bana kendimi dünyanın en şanslı insanı hissettiriyorsun.',
    'Ellerim ellerindeyken kendimi hiç olmadığım kadar güçlü ve cesur hissediyorum.',
    'Sadece sevgilim değil, ruh eşim olduğunu her gün bana hissettiriyorsun.',
    'Dünyadaki en güzel, en yumuşak ve en huzurlu sarılmalara sahipsin.',
  ],
  memories: [],
  bucket_list: [
    { id: 'b1', title: 'Roma & Venedik Gezisi 🇮🇹', category: 'city', completed: false },
    { id: 'b2', title: 'Kapadokya Balon Turu 🎈', category: 'activity', completed: true },
    { id: 'b3', title: 'Interstellar Sinema Gecesi 🍿', category: 'movie', completed: true },
    { id: 'b4', title: 'Paris’te Eyfel Altında Kahve ☕', category: 'city', completed: false },
    { id: 'b5', title: 'Kuzey Işıkları (Aurora) Kampı 🌌', category: 'activity', completed: false },
  ],
  coupons: [
    {
      id: 'c1',
      title: '1 Saat Kesintisiz Sırt & Omuz Masajı 💆‍♂️',
      description: 'Yorgunluğunu unutturacak yumuşacık ve son derece rahatlatıcı masaj hakkı.',
      category: 'massage',
      icon: '💆‍♂️',
      is_used: false,
    },
    {
      id: 'c2',
      title: 'Soru Sormadan Affedilme & Barışma Kartı 🕊️',
      description: 'Ufak anlaşmazlıklarda koşulsuz şartsız barışma ve sarılma jokeri.',
      category: 'forgive',
      icon: '🕊️',
      is_used: false,
    },
    {
      id: 'c3',
      title: 'İstediğin Filmi & Diziyi Seçme Hakkı 🍿',
      description: 'Bu gece kumanda tamamen sende! Dilediğin yapımı mısır eşliğinde izliyoruz.',
      category: 'movie',
      icon: '🍿',
      is_used: false,
    },
    {
      id: 'c4',
      title: 'En Sevdiğin Restoranda Akşam Yemeği 🍕',
      description: 'Senin seçtiğin mekanda baş başa lezzetli akşam yemeği kaçamağı.',
      category: 'food',
      icon: '🍕',
      is_used: false,
    },
    {
      id: 'c5',
      title: 'Gece Yarısı Dondurma & Tatlı Kaçamağı 🍦',
      description: 'Saat kaç olursa olsun en yakın tatlıcıya gitme sözü.',
      category: 'custom',
      icon: '🍦',
      is_used: true,
      used_at: '2026-02-14T21:30:00.000Z',
    },
  ],
  diary_entries: [],
  time_capsules: [
    {
      id: 'tc1',
      title: '1. Yıl Dönümü Gelecek Mektubumuz ⏳',
      content: 'Gelecekteki bize not: Umarım yine böyle sarılarak, gülerek ve aşkla birbirimizin gözlerine bakıyoruzdur. Seni çok seviyorum!',
      open_date: '2026-12-31T00:00:00.000Z',
      created_at: '2023-01-01T00:00:00.000Z',
      creator: 'Partner 2',
      is_opened: false,
    },
    {
      id: 'tc2',
      title: 'İlk Tatil Sürpriz Notu 🏖️',
      content: 'Deniz kenarında tuttuğumuz o ilk dilek gerçekleşti! Birlikte nice tatillere ve güzel anılara.',
      open_date: '2024-01-01T00:00:00.000Z',
      created_at: '2023-07-15T00:00:00.000Z',
      creator: 'Partner 1',
      is_opened: true,
    },
  ],
  movies: [
    {
      id: 'm1',
      title: 'Interstellar (Yıldızlararası) 🚀',
      genre: 'Bilim Kurgu / Drama',
      poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
      watch_url: 'https://www.netflix.com',
      rating: 5,
      note: 'Birlikte izlediğimiz en büyüleyici ve duygusal filmlerden biriydi!',
      status: 'watched',
      added_by: 'Partner 2',
      created_at: '2023-02-14T00:00:00.000Z',
    },
    {
      id: 'm2',
      title: 'La La Land (Aşıklar Şehri) 💃',
      genre: 'Romantik / Müzikal',
      poster_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
      watch_url: 'https://www.primevideo.com',
      rating: 5,
      note: 'Müzikleri ve atmosferi harikaydı, son sahnesinde sarıldık.',
      status: 'watched',
      added_by: 'Partner 1',
      created_at: '2023-05-20T00:00:00.000Z',
    },
    {
      id: 'm3',
      title: 'About Time (Zamanda Aşk) ⏳',
      genre: 'Romantik Komedi',
      poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
      watch_url: 'https://www.netflix.com',
      rating: 0,
      note: 'Yağmurlu bir pazar gecesi patlamış mısır eşliğinde izleyeceğiz!',
      status: 'watchlist',
      added_by: 'Partner 1',
      created_at: '2024-01-10T00:00:00.000Z',
    },
  ],
  wheel_items: [
    '10 Saniye Sımsıkı Sarıl 🫂',
    'İstediğin Bir Şeyi Yaptır 👑',
    'Akşam Yemeği Ismarla 🍕',
    'Sinema Biletleri Benden 🍿',
    'Masaj Yap 💆‍♂️',
    'Romantik Bir Öpücük 💋',
    'Kahve Demle & Yatakta Sun ☕',
    'Soru Sormadan Affet 🕊️',
  ],
  quiz_partner1: [
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
  ],
  quiz_partner2: [
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
  ],
  upcoming_event: {
    title: 'Kapadokya Yıl Dönümü Kaçamağı 🎈',
    date: '2026-09-15T00:00:00.000Z',
    location: 'Kapadokya',
  },
  allowed_users: {
    partner1_email: 'partner1@asksite.com',
    partner2_email: 'partner2@asksite.com',
    partner1_pin: '1234',
    partner2_pin: '5678',
  },
  feature_toggles: {
    spotify: true,
    memory: true,
    bucket_list: true,
    day_night: true,
    countdown: true,
    custom_audio: true,
    canvas: true,
    coupons: true,
  },
};

const localCouplesMemoryStore = new Map<string, CoupleConfig>();
localCouplesMemoryStore.set('demo', DEMO_COUPLE);

export async function getCoupleBySlug(slug: string): Promise<CoupleConfig | null> {
  // If Firestore is available, fetch from 'couples' collection
  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', slug);
      const snap = await getDoc(coupleRef);

      if (snap.exists()) {
        const data = snap.data();

        // Also fetch sub-collections if present
        const memoriesSnap = await getDocs(collection(db, `couples/${slug}/modules_memories`));
        const memories = memoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

        const bucketSnap = await getDocs(collection(db, `couples/${slug}/modules_bucket`));
        const bucketList = bucketSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

        return {
          id: snap.id,
          slug: data.slug || slug,
          partner1_name: data.names?.partner1 || data.partner1_name || 'Partner 1',
          partner2_name: data.names?.partner2 || data.partner2_name || 'Partner 2',
          subtitle: data.subtitle || 'Bizim Dünyamız ❤️',
          start_date: data.startDate || data.start_date || '2023-01-01T00:00:00.000Z',
          theme_color_primary: data.theme?.primaryColor || data.theme_color_primary || '#ff4d6d',
          theme_color_tech: data.theme?.techColor || data.theme_color_tech || '#6c5ce7',
          bg_music_url: data.bgMusicUrl || data.bg_music_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          custom_audio_url: data.customAudioUrl || data.custom_audio_url || data.bg_music_url,
          spotify_url: data.spotify?.spotifyUrl || data.spotify_url || DEMO_COUPLE.spotify_url,
          spotify_lyrics: data.spotify?.lyrics || data.spotify_lyrics || DEMO_COUPLE.spotify_lyrics,
          whatsapp_number: data.whatsapp?.number || data.whatsapp_number || '905520000000',
          whatsapp_message: data.whatsapp?.message || data.whatsapp_message || 'Acil sarılmana ihtiyacım var 🥺',
          love_reasons: data.love_reasons || DEMO_COUPLE.love_reasons,
          memories: memories.length > 0 ? memories : data.memories || DEMO_COUPLE.memories,
          bucket_list: bucketList.length > 0 ? bucketList : data.bucket_list || DEMO_COUPLE.bucket_list,
          coupons: data.coupons || DEMO_COUPLE.coupons,
          diary_entries: data.diary_entries || DEMO_COUPLE.diary_entries,
          time_capsules: data.time_capsules || DEMO_COUPLE.time_capsules,
          movies: data.movies || DEMO_COUPLE.movies,
          wheel_items: data.wheel_items || DEMO_COUPLE.wheel_items,
          quiz_partner1: data.quiz_partner1 || DEMO_COUPLE.quiz_partner1,
          quiz_partner2: data.quiz_partner2 || DEMO_COUPLE.quiz_partner2,
          partner1_score: data.partner1_score !== undefined ? data.partner1_score : 120,
          partner2_score: data.partner2_score !== undefined ? data.partner2_score : 150,
          quiz_partner1_created_at: data.quiz_partner1_created_at || null,
          quiz_partner2_created_at: data.quiz_partner2_created_at || null,
          quiz_partner1_expires_at: data.quiz_partner1_expires_at || null,
          quiz_partner2_expires_at: data.quiz_partner2_expires_at || null,
          upcoming_event: data.upcoming_event || DEMO_COUPLE.upcoming_event,
          allowed_users: data.allowed_users || DEMO_COUPLE.allowed_users,
          feature_toggles: data.feature_toggles || DEMO_COUPLE.feature_toggles,
          is_active: data.isActive !== undefined ? data.isActive : true,
        };
      } else if (slug === 'demo') {
        // Auto-seed demo couple on first request
        await seedDemoCoupleToFirebase();
        return DEMO_COUPLE;
      }
    } catch (e) {
      console.error('Error fetching couple from Firestore:', e);
    }
  }

  // Fallback to local memory store or demo slug
  if (slug === 'demo') {
    return DEMO_COUPLE;
  }

  if (localCouplesMemoryStore.has(slug)) {
    return localCouplesMemoryStore.get(slug)!;
  }

  return null;
}

export async function saveCoupleConfig(config: CoupleConfig): Promise<CoupleConfig | null> {
  localCouplesMemoryStore.set(config.slug, config);

  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', config.slug);

      const payload = {
        slug: config.slug,
        partner1_name: config.partner1_name,
        partner2_name: config.partner2_name,
        names: {
          partner1: config.partner1_name,
          partner2: config.partner2_name,
        },
        subtitle: config.subtitle,
        startDate: config.start_date,
        start_date: config.start_date,
        theme: {
          primaryColor: config.theme_color_primary,
          techColor: config.theme_color_tech,
          isDarkMode: false,
          customCss: '',
        },
        theme_color_primary: config.theme_color_primary,
        theme_color_tech: config.theme_color_tech,
        bgMusicUrl: config.bg_music_url,
        bg_music_url: config.bg_music_url,
        customAudioUrl: config.custom_audio_url,
        custom_audio_url: config.custom_audio_url,
        spotify: {
          spotifyUrl: config.spotify_url,
          lyrics: config.spotify_lyrics || [],
        },
        spotify_url: config.spotify_url,
        spotify_lyrics: config.spotify_lyrics || [],
        whatsapp: {
          number: config.whatsapp_number,
          message: config.whatsapp_message,
        },
        whatsapp_number: config.whatsapp_number,
        whatsapp_message: config.whatsapp_message,
        love_reasons: config.love_reasons || [],
        memories: config.memories || [],
        bucket_list: config.bucket_list || [],
        coupons: config.coupons || [],
        diary_entries: config.diary_entries || [],
        time_capsules: config.time_capsules || [],
        movies: config.movies || [],
        wheel_items: config.wheel_items || [],
        quiz_partner1: config.quiz_partner1 || [],
        quiz_partner2: config.quiz_partner2 || [],
        partner1_score: config.partner1_score !== undefined ? config.partner1_score : 120,
        partner2_score: config.partner2_score !== undefined ? config.partner2_score : 150,
        quiz_partner1_created_at: config.quiz_partner1_created_at || null,
        quiz_partner2_created_at: config.quiz_partner2_created_at || null,
        quiz_partner1_expires_at: config.quiz_partner1_expires_at || null,
        quiz_partner2_expires_at: config.quiz_partner2_expires_at || null,
        upcoming_event: config.upcoming_event || null,
        allowed_users: config.allowed_users || {
          partner1_email: config.partner1_email || '',
          partner2_email: config.partner2_email || '',
          partner1_pin: config.partner1_pin || '1234',
          partner2_pin: config.partner2_pin || '5678',
        },
        partner1_email: config.partner1_email || config.allowed_users?.partner1_email || '',
        partner2_email: config.partner2_email || config.allowed_users?.partner2_email || '',
        partner1_pin: config.partner1_pin || config.allowed_users?.partner1_pin || '1234',
        partner2_pin: config.partner2_pin || config.allowed_users?.partner2_pin || '5678',
        authorized_emails: Array.from(new Set([
          ...(config.authorized_emails || []),
          (config.partner1_email || config.allowed_users?.partner1_email || '').toLowerCase().trim(),
          (config.partner2_email || config.allowed_users?.partner2_email || '').toLowerCase().trim(),
        ].filter(Boolean))),
        co_owners: config.co_owners || [],
        feature_toggles: config.feature_toggles || {},
        packageType: 'digital',
        isActive: true,
        isPaid: config.isPaid !== undefined ? config.isPaid : true,
        inviteCode: config.inviteCode || config.pair_code || null,
        owner_uid: config.owner_uid || (config.co_owners && config.co_owners[0]) || null,
        owner_email: config.owner_email || config.partner1_email || null,
        partner1_uid: config.partner1_uid || config.owner_uid || (config.co_owners && config.co_owners[0]) || null,
        partner2_uid: config.partner2_uid || (config.co_owners && config.co_owners[1]) || null,
        updatedAt: serverTimestamp(),
      };

      await setDoc(coupleRef, payload, { merge: true });

      // Update user doc in users/{uid}
      const primaryUid = config.owner_uid || config.partner1_uid || (config.co_owners && config.co_owners[0]);
      if (primaryUid) {
        const userRef = doc(db, 'users', primaryUid);
        await setDoc(
          userRef,
          {
            hasPurchasedSite: true,
            hasActiveSubscription: true,
            isPaid: true,
            coupleSlug: config.slug,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      return config;
    } catch (e) {
      console.error('Error saving couple to Firestore:', e);
    }
  }

  return config;
}

// Auto-Claim Engine: Automatically link user account if their email matches authorized_emails
export async function autoClaimCoupleByEmail(user: { uid: string; email?: string | null }): Promise<string | null> {
  if (!user || !user.email || !isFirebaseConfigured || !db) return null;
  const normalizedEmail = user.email.toLowerCase().trim();

  try {
    const couplesRef = collection(db, 'couples');
    
    // First try array-contains on authorized_emails
    const q = query(couplesRef, where('authorized_emails', 'array-contains', normalizedEmail));
    const snap = await getDocs(q);

    let matchedSlug: string | null = null;
    let matchedDocRef: any = null;

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      matchedSlug = docSnap.id || docSnap.data().slug;
      matchedDocRef = docSnap.ref;
    } else {
      // Fallback: search all couples for partner1_email or partner2_email
      const snapAll = await getDocs(couplesRef);
      for (const d of snapAll.docs) {
        const cData = d.data();
        const p1 = (cData.allowed_users?.partner1_email || cData.partner1_email || '').toLowerCase().trim();
        const p2 = (cData.allowed_users?.partner2_email || cData.partner2_email || '').toLowerCase().trim();
        const authEmails = (cData.authorized_emails || []).map((e: string) => e.toLowerCase().trim());

        if (p1 === normalizedEmail || p2 === normalizedEmail || authEmails.includes(normalizedEmail)) {
          matchedSlug = d.id || cData.slug;
          matchedDocRef = d.ref;
          break;
        }
      }
    }

    if (matchedSlug && matchedDocRef) {
      const snapDoc = await getDoc(matchedDocRef);
      if (snapDoc.exists()) {
        const cData = snapDoc.data() as Record<string, any>;
        const coOwners: string[] = cData.co_owners || [];
        const authEmails: string[] = cData.authorized_emails || [];

        if (!coOwners.includes(user.uid)) {
          coOwners.push(user.uid);
        }
        if (!authEmails.includes(normalizedEmail)) {
          authEmails.push(normalizedEmail);
        }

        await setDoc(matchedDocRef, { co_owners: coOwners, authorized_emails: authEmails }, { merge: true });

        // Update user record in users/{uid}
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            hasPurchasedSite: true,
            hasActiveSubscription: true,
            coupleSlug: matchedSlug,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return matchedSlug;
      }
    }
  } catch (e) {
    console.error('Error in autoClaimCoupleByEmail:', e);
  }
  return null;
}

export async function getMapMarkers(coupleId: string): Promise<MapMarker[]> {
  if (isFirebaseConfigured && db) {
    try {
      const markersRef = collection(db, `couples/${coupleId}/modules_map_markers`);
      const snap = await getDocs(markersRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, couple_id: coupleId, ...d.data() } as MapMarker));
      }
    } catch (e) {
      console.error('Error fetching map markers from Firestore:', e);
    }
  }
  return [];
}

export async function addMapMarker(marker: Omit<MapMarker, 'id' | 'created_at'>): Promise<MapMarker | null> {
  const coupleSlug = marker.couple_id || 'demo';

  if (isFirebaseConfigured && db) {
    try {
      const markersRef = collection(db, `couples/${coupleSlug}/modules_map_markers`);
      const docRef = await addDoc(markersRef, {
        lat: marker.lat,
        lng: marker.lng,
        title: marker.title || 'Bizim Aşk Noktamız ❤️',
        createdAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        couple_id: coupleSlug,
        lat: marker.lat,
        lng: marker.lng,
        title: marker.title,
        created_at: new Date().toISOString(),
      };
    } catch (e) {
      console.error('Error adding map marker to Firestore:', e);
    }
  }

  return {
    id: `local-${Date.now()}`,
    ...marker,
    created_at: new Date().toISOString(),
  };
}

export async function clearMapMarkers(coupleId: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const markersRef = collection(db, `couples/${coupleId}/modules_map_markers`);
      const snap = await getDocs(markersRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      return true;
    } catch (e) {
      console.error('Error clearing map markers in Firestore:', e);
      return false;
    }
  }
  return true;
}

export async function deleteMapMarker(coupleId: string, markerId: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const markerRef = doc(db, `couples/${coupleId}/modules_map_markers`, markerId);
      await deleteDoc(markerRef);
      return true;
    } catch (e) {
      console.error('Error deleting map marker in Firestore:', e);
      return false;
    }
  }
  return true;
}

// Seed Demo Couple function
export async function seedDemoCoupleToFirebase(): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', 'demo');
      const snap = await getDoc(coupleRef);
      if (!snap.exists()) {
        await saveCoupleConfig(DEMO_COUPLE);
        console.log('Seeded demo couple into Firestore!');
        return true;
      }
    } catch (e) {
      console.error('Failed to seed demo couple to Firestore:', e);
    }
  }
  return false;
}

// ================= PRESENCE STATUS SERVICES =================
export async function updatePartnerPresence(
  slug: string,
  role: 'partner1' | 'partner2',
  isOnline: boolean
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const presenceRef = doc(db, `couples/${slug}/presence/status`);
      await setDoc(
        presenceRef,
        {
          [role]: {
            isOnline,
            lastSeen: new Date().toISOString(),
            activeRole: role,
          },
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Error updating presence:', e);
    }
  }
}

export function subscribeToPartnerPresence(
  slug: string,
  callback: (presence: { partner1?: any; partner2?: any }) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const presenceRef = doc(db, `couples/${slug}/presence/status`);
    return onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        } else {
          callback({});
        }
      },
      (error) => console.error('Presence snapshot error:', error)
    );
  }
  return () => {};
}

// ================= REAL-TIME LIVE CANVAS SERVICES =================
export interface CanvasStrokeData {
  id?: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  role: 'partner1' | 'partner2' | 'guest';
  timestamp?: number;
}

export async function sendCanvasStroke(slug: string, stroke: CanvasStrokeData): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const canvasRef = collection(db, `couples/${slug}/modules_canvas`);
      await addDoc(canvasRef, {
        ...stroke,
        createdAt: serverTimestamp(),
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Error sending canvas stroke to Firestore:', e);
    }
  }
}

export function subscribeToLiveCanvas(
  slug: string,
  callback: (strokes: CanvasStrokeData[]) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const canvasRef = collection(db, `couples/${slug}/modules_canvas`);
    const q = query(canvasRef, orderBy('createdAt', 'asc'), limit(300));
    return onSnapshot(
      q,
      (snapshot) => {
        const strokes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CanvasStrokeData));
        callback(strokes);
      },
      (error) => console.error('Canvas snapshot error:', error)
    );
  }
  return () => {};
}

export async function clearLiveCanvas(slug: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const canvasRef = collection(db, `couples/${slug}/modules_canvas`);
      const snap = await getDocs(canvasRef);
      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (e) {
      console.error('Error clearing live canvas in Firestore:', e);
    }
  }
}

// ================= COUPON SERVICES =================
export async function useCoupon(slug: string, couponId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedCoupons = (couple.coupons || []).map((c) =>
    c.id === couponId ? { ...c, is_used: true, used_at: new Date().toISOString() } : c
  );

  const updated = await saveCoupleConfig({
    ...couple,
    coupons: updatedCoupons,
  });

  return !!updated;
}

export async function resetAllCoupons(slug: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const resetCoupons = (couple.coupons || []).map((c) => ({
    ...c,
    is_used: false,
    used_at: undefined,
  }));

  const updated = await saveCoupleConfig({
    ...couple,
    coupons: resetCoupons,
  });

  return !!updated;
}

// ================= DIARY SERVICES =================
export async function addDiaryEntry(slug: string, entry: Omit<DiaryEntry, 'id'>): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const newEntry: DiaryEntry = {
    ...entry,
    id: `d-${Date.now()}`,
  };

  const updatedEntries = [newEntry, ...(couple.diary_entries || [])];

  const updated = await saveCoupleConfig({
    ...couple,
    diary_entries: updatedEntries,
  });

  return !!updated;
}

export async function deleteDiaryEntry(slug: string, entryId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedEntries = (couple.diary_entries || []).filter((e) => e.id !== entryId);

  const updated = await saveCoupleConfig({
    ...couple,
    diary_entries: updatedEntries,
  });

  return !!updated;
}

// ================= TIME CAPSULE SERVICES =================
export async function addTimeCapsule(slug: string, capsule: Omit<CapsuleItem, 'id' | 'created_at'>): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const newCapsule: CapsuleItem = {
    ...capsule,
    id: `tc-${Date.now()}`,
    created_at: new Date().toISOString(),
    is_opened: false,
  };

  const updatedCapsules = [newCapsule, ...(couple.time_capsules || [])];

  const updated = await saveCoupleConfig({
    ...couple,
    time_capsules: updatedCapsules,
  });

  return !!updated;
}

export async function deleteTimeCapsule(slug: string, capsuleId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedCapsules = (couple.time_capsules || []).filter((c) => c.id !== capsuleId);

  const updated = await saveCoupleConfig({
    ...couple,
    time_capsules: updatedCapsules,
  });

  return !!updated;
}

// ================= CINEMA SERVICES =================
export async function addMovie(slug: string, movie: Omit<MovieItem, 'id' | 'created_at'>): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const newMovie: MovieItem = {
    ...movie,
    id: `m-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const updatedMovies = [newMovie, ...(couple.movies || [])];

  const updated = await saveCoupleConfig({
    ...couple,
    movies: updatedMovies,
  });

  return !!updated;
}

export async function updateMovie(slug: string, updatedMovie: MovieItem): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedMovies = (couple.movies || []).map((m) => (m.id === updatedMovie.id ? updatedMovie : m));

  const updated = await saveCoupleConfig({
    ...couple,
    movies: updatedMovies,
  });

  return !!updated;
}

export async function deleteMovie(slug: string, movieId: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedMovies = (couple.movies || []).filter((m) => m.id !== movieId);

  const updated = await saveCoupleConfig({
    ...couple,
    movies: updatedMovies,
  });

  return !!updated;
}

// ================= WHEEL OF LOVE SERVICES =================
export async function addWheelItem(slug: string, item: string): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedItems = [...(couple.wheel_items || []), item];

  const updated = await saveCoupleConfig({
    ...couple,
    wheel_items: updatedItems,
  });

  return !!updated;
}

export async function deleteWheelItem(slug: string, itemIndex: number): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const updatedItems = (couple.wheel_items || []).filter((_, idx) => idx !== itemIndex);

  const updated = await saveCoupleConfig({
    ...couple,
    wheel_items: updatedItems,
  });

  return !!updated;
}

// ================= QUIZ SERVICES =================
export async function addQuizQuestion(
  slug: string,
  questionData: Omit<QuizQuestion, 'id'>,
  targetPartner: 'partner1' | 'partner2'
): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newQuestion: QuizQuestion = {
    ...questionData,
    id: `q-${Date.now()}`,
    created_by: targetPartner,
    points: 10,
    created_at: nowIso,
    expires_at: expiresIso,
  };

  const key = targetPartner === 'partner1' ? 'quiz_partner1' : 'quiz_partner2';
  const updatedQuestions = [...(couple[key] || []), newQuestion];

  const timeKeyCreated = targetPartner === 'partner1' ? 'quiz_partner1_created_at' : 'quiz_partner2_created_at';
  const timeKeyExpires = targetPartner === 'partner1' ? 'quiz_partner1_expires_at' : 'quiz_partner2_expires_at';

  const updated = await saveCoupleConfig({
    ...couple,
    [key]: updatedQuestions,
    [timeKeyCreated]: nowIso,
    [timeKeyExpires]: expiresIso,
  });

  return !!updated;
}

export async function saveQuizScore(
  slug: string,
  solverPartner: 'partner1' | 'partner2',
  pointsEarned: number
): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const scoreKey = solverPartner === 'partner1' ? 'partner1_score' : 'partner2_score';
  const currentScore = couple[scoreKey] !== undefined ? couple[scoreKey]! : (solverPartner === 'partner1' ? 120 : 150);
  const newScore = currentScore + pointsEarned;

  const updated = await saveCoupleConfig({
    ...couple,
    [scoreKey]: newScore,
  });

  return !!updated;
}

export async function deleteQuizQuestion(
  slug: string,
  targetPartner: 'partner1' | 'partner2',
  questionId: string
): Promise<boolean> {
  const couple = await getCoupleBySlug(slug);
  if (!couple) return false;

  const key = targetPartner === 'partner1' ? 'quiz_partner1' : 'quiz_partner2';
  const updatedQuestions = (couple[key] || []).filter((q) => q.id !== questionId);

  const updated = await saveCoupleConfig({
    ...couple,
    [key]: updatedQuestions,
  });

  return !!updated;
}

export function formatDiaryDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} - ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
}

export async function getCoupleByPairCode(pairCode: string): Promise<CoupleConfig | null> {
  const cleanCode = pairCode.trim().toUpperCase();
  if (cleanCode === 'ASK-DEMO1') {
    return DEMO_COUPLE;
  }

  if (isFirebaseConfigured && db) {
    try {
      const q1 = query(collection(db, 'couples'), where('pair_code', '==', cleanCode));
      const snap1 = await getDocs(q1);
      let docSnap = !snap1.empty ? snap1.docs[0] : null;

      if (!docSnap) {
        const q2 = query(collection(db, 'couples'), where('inviteCode', '==', cleanCode));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          docSnap = snap2.docs[0];
        }
      }

      if (docSnap) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          slug: data.slug || docSnap.id,
          partner1_name: data.partner1_name || 'Partner 1',
          partner2_name: data.partner2_name || 'Partner 2',
          subtitle: data.subtitle || 'Bizim Dünyamız ❤️',
          start_date: data.start_date || '2023-01-01T00:00:00.000Z',
          theme_color_primary: data.theme_color_primary || '#ff4d6d',
          theme_color_tech: data.theme_color_tech || '#6c5ce7',
          bg_music_url: data.bg_music_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          whatsapp_number: data.whatsapp_number || '905520000000',
          whatsapp_message: data.whatsapp_message || 'Seni çok seviyorum 💖',
          love_reasons: data.love_reasons || DEMO_COUPLE.love_reasons,
          pair_code: data.pair_code || data.inviteCode || cleanCode,
          inviteCode: data.inviteCode || data.pair_code || cleanCode,
          pair_code_used: data.pair_code_used || data.isUsed || false,
          isUsed: data.isUsed || data.pair_code_used || false,
          owner_uid: data.owner_uid || null,
          owner_email: data.owner_email || null,
          partner1_uid: data.partner1_uid || data.owner_uid || (data.co_owners && data.co_owners[0]) || null,
          partner2_uid: data.partner2_uid || (data.co_owners && data.co_owners[1]) || null,
          partner1_email: data.partner1_email || data.owner_email || null,
          partner2_email: data.partner2_email || null,
          co_owners: data.co_owners || [],
          authorized_emails: data.authorized_emails || [],
          allowed_users: data.allowed_users || DEMO_COUPLE.allowed_users,
        };
      }
    } catch (e) {
      console.error('Error fetching couple by pair code:', e);
    }
  }
  return null;
}

export async function connectPartnerWithPairCode(
  userUid: string,
  userEmail: string,
  pairCode: string
): Promise<{ success: boolean; slug?: string; message?: string }> {
  const couple = await getCoupleByPairCode(pairCode);
  const normalizedEmail = (userEmail || '').toLowerCase().trim();

  if (!couple || (couple.isPaid !== true && couple.slug !== 'demo')) {
    return {
      success: false,
      message: 'Geçersiz veya ödemesi bulunmayan davet kodu!',
    };
  }

  // Max 2 Accounts Limit & isUsed Lock Check
  const currentCoOwners = Array.from(new Set(couple.co_owners || []));
  const isAlreadyPartner =
    currentCoOwners.includes(userUid) ||
    couple.partner1_uid === userUid ||
    couple.partner2_uid === userUid;

  const isCodeUsedOrFull =
    (couple.isUsed === true || couple.pair_code_used === true) && !isAlreadyPartner;

  if (isCodeUsedOrFull || (currentCoOwners.length >= 2 && !isAlreadyPartner)) {
    return {
      success: false,
      message: 'Geçersiz veya kullanılmış davet kodu! Bir davet kodu maksimum 2 partner tarafından kullanılabilir.',
    };
  }

  if (isFirebaseConfigured && db) {
    try {
      const coupleRef = doc(db, 'couples', couple.slug);
      
      if (!currentCoOwners.includes(userUid)) {
        currentCoOwners.push(userUid);
      }

      const p1Uid = couple.partner1_uid || currentCoOwners[0] || userUid;
      const p2Uid = p1Uid === userUid ? (couple.partner2_uid || currentCoOwners[1] || userUid) : userUid;

      const authEmails = Array.from(
        new Set([
          ...(couple.authorized_emails || []),
          (couple.partner1_email || '').toLowerCase().trim(),
          normalizedEmail,
        ].filter(Boolean))
      );

      await setDoc(
        coupleRef,
        {
          partner1_uid: p1Uid,
          partner2_uid: p2Uid,
          partner2_email: normalizedEmail,
          co_owners: currentCoOwners,
          isUsed: true,
          pair_code_used: true,
          authorized_emails: authEmails,
          allowed_users: {
            ...(couple.allowed_users || {}),
            partner2_email: normalizedEmail,
          },
        },
        { merge: true }
      );

      const userRef = doc(db, 'users', userUid);
      await setDoc(
        userRef,
        {
          coupleSlug: couple.slug,
          hasPurchasedSite: true,
          hasActiveSubscription: true,
          isPaid: true,
          isPartner: true,
          pairedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return { success: true, slug: couple.slug, message: 'Partneriniz ile başarıyla eşleştiniz! 🎉' };
    } catch (e: any) {
      console.error('Error connecting partner:', e);
      return { success: false, message: e.message || 'Eşleşme kurulurken hata oluştu.' };
    }
  }

  return { success: true, slug: couple.slug, message: 'Demo eşleşmesi sağlandı! 🎉' };
}

export async function saveGameScore(
  slug: string,
  gameName: string,
  score: number,
  playerName?: string
): Promise<boolean> {
  const cleanSlug = validateSlug(slug);
  const validatedScore = validateGameScore(score);
  if (isFirebaseConfigured && db) {
    try {
      const gamesRef = collection(db, `couples/${cleanSlug}/games_data`);
      await addDoc(gamesRef, {
        gameName: (gameName || 'Oyun').slice(0, 50),
        score: validatedScore,
        playerName: (playerName || 'Partner').slice(0, 50),
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (e) {
      console.error('Error saving game score to Firestore:', e);
    }
  }
  return false;
}

export async function getXoxScore(slug: string): Promise<{ p1Wins: number; p2Wins: number }> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/games_data`, 'xox');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          p1Wins: data.p1Wins || 0,
          p2Wins: data.p2Wins || 0,
        };
      }
    } catch (e) {
      console.error('Error fetching XOX score:', e);
    }
  }
  return { p1Wins: 0, p2Wins: 0 };
}

export async function saveXoxScore(slug: string, p1Wins: number, p2Wins: number): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/games_data`, 'xox');
      await setDoc(
        docRef,
        {
          p1Wins,
          p2Wins,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error('Error saving XOX score:', e);
    }
  }
  return false;
}

export async function getDinoHighScores(slug: string): Promise<{ p1Score: number; p2Score: number }> {
  return getArcadeHighScores(slug, 'dino_runner');
}

export async function saveDinoHighScore(slug: string, p1Score: number, p2Score: number): Promise<boolean> {
  return saveArcadeHighScore(slug, 'dino_runner', p1Score, p2Score);
}

export async function getArcadeHighScores(
  slug: string,
  gameKey: 'flappy' | '2048' | 'tower' | 'dino_runner'
): Promise<{ p1Score: number; p2Score: number }> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/games_data`, gameKey);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          p1Score: data.p1Score || 0,
          p2Score: data.p2Score || 0,
        };
      }
    } catch (e) {
      console.error(`Error fetching ${gameKey} scores:`, e);
    }
  }
  return { p1Score: 0, p2Score: 0 };
}

export async function saveArcadeHighScore(
  slug: string,
  gameKey: 'flappy' | '2048' | 'tower' | 'dino_runner',
  p1Score: number,
  p2Score: number
): Promise<boolean> {
  const cleanSlug = validateSlug(slug);
  const v1 = validateGameScore(p1Score);
  const v2 = validateGameScore(p2Score);
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${cleanSlug}/games_data`, gameKey);
      await setDoc(
        docRef,
        {
          p1Score: v1,
          p2Score: v2,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error(`Error saving ${gameKey} score:`, e);
    }
  }
  return false;
}

export async function resetDatabaseAndCollections(): Promise<{ success: boolean; deletedCouples: number; deletedUsers: number }> {
  if (!isFirebaseConfigured || !db) {
    return { success: false, deletedCouples: 0, deletedUsers: 0 };
  }

  let deletedCouples = 0;
  let deletedUsers = 0;

  try {
    const couplesSnap = await getDocs(collection(db, 'couples'));
    for (const d of couplesSnap.docs) {
      const slug = d.id;
      const subCols = [
        'modules_memories',
        'modules_bucket',
        'modules_map_markers',
        'modules_canvas',
        'games_data',
        'presence',
        'memories',
        'bucket_list',
        'coupons',
        'diary_entries',
        'time_capsules',
        'movies',
        'quiz_questions',
        'canvas_drawings',
      ];
      for (const sub of subCols) {
        try {
          const subSnap = await getDocs(collection(db, `couples/${slug}/${sub}`));
          for (const subDoc of subSnap.docs) {
            await deleteDoc(subDoc.ref);
          }
        } catch (e) {}
      }

      await deleteDoc(d.ref);
      deletedCouples++;
    }

    const usersSnap = await getDocs(collection(db, 'users'));
    for (const uDoc of usersSnap.docs) {
      await deleteDoc(uDoc.ref);
      deletedUsers++;
    }

    localCouplesMemoryStore.clear();
    localCouplesMemoryStore.set('demo', DEMO_COUPLE);

    console.log(`Database Reset Complete: ${deletedCouples} couples, ${deletedUsers} users deleted.`);
    return { success: true, deletedCouples, deletedUsers };
  } catch (e) {
    console.error('Error in resetDatabaseAndCollections:', e);
    return { success: false, deletedCouples, deletedUsers };
  }
}

/* ================= CANVAS DRAWINGS ENGINE ================= */
export async function addCanvasDrawing(
  slug: string,
  drawing: { imageUrl: string; drawnBy: string }
): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const formattedDate = `${day}.${month}.${year} - ${hours}:${minutes}`;

      const colRef = collection(db, `couples/${slug}/canvas_drawings`);
      await addDoc(colRef, {
        imageUrl: drawing.imageUrl,
        createdAt: formattedDate,
        drawnBy: drawing.drawnBy,
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (e) {
      console.error('Error adding canvas drawing:', e);
    }
  }
  return false;
}

export async function getCanvasDrawings(slug: string): Promise<CanvasDrawing[]> {
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, `couples/${slug}/canvas_drawings`);
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        imageUrl: docSnap.data().imageUrl || '',
        createdAt: docSnap.data().createdAt || '',
        drawnBy: docSnap.data().drawnBy || 'Partner',
      }));
    } catch (e) {
      console.error('Error fetching canvas drawings:', e);
    }
  }
  return [];
}

export async function deleteCanvasDrawing(slug: string, drawingId: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/canvas_drawings`, drawingId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error('Error deleting canvas drawing:', e);
    }
  }
  return false;
}

/* ================= ACTIVE PAINTING PROGRESS REAL-TIME SYNC ================= */
export async function saveActivePaintingProgress(
  slug: string,
  progress: { templateKey: string; regionFills: Record<string, string>; updatedBy: string }
): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/active_painting`, 'current');
      await setDoc(
        docRef,
        {
          ...progress,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error('Error saving active painting progress:', e);
    }
  }
  return false;
}

export function subscribeToActivePaintingProgress(
  slug: string,
  callback: (data: { templateKey?: string; regionFills?: Record<string, string>; updatedBy?: string } | null) => void
) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/active_painting`, 'current');
      return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          callback(snap.data() as any);
        } else {
          callback(null);
        }
      });
    } catch (e) {
      console.error('Error subscribing to active painting progress:', e);
    }
  }
  callback(null);
  return () => {};
}

/* ================= 2048 GAME ENGINE (SEPARATE BOARDS & LEADERBOARD) ================= */
export interface Game2048StateData {
  board: number[][];
  currentScore: number;
  highScore: number;
  gameOver: boolean;
  updatedBy?: string;
}

export async function save2048State(
  slug: string,
  userKey: 'partner1' | 'partner2',
  data: Game2048StateData
): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const bestScore = Math.max(data.highScore || 0, data.currentScore || 0);

      // 1. Save state to games_2048/{userKey}
      const docRef = doc(db, `couples/${slug}/games_2048`, userKey);
      await setDoc(
        docRef,
        {
          ...data,
          highScore: bestScore,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Sync score to games_data/2048 for getArcadeHighScores
      const arcadeRef = doc(db, `couples/${slug}/games_data`, '2048');
      const scoreKey = userKey === 'partner1' ? 'p1Score' : 'p2Score';
      await setDoc(arcadeRef, { [scoreKey]: bestScore, updatedAt: serverTimestamp() }, { merge: true });

      return true;
    } catch (e) {
      console.error('Error saving 2048 state:', e);
    }
  }
  return false;
}

export function subscribeTo2048Games(
  slug: string,
  callback: (data: { partner1?: Game2048StateData; partner2?: Game2048StateData }) => void
) {
  if (!isFirebaseConfigured || !db) {
    callback({});
    return () => {};
  }

  let games2048Data: { partner1?: Game2048StateData; partner2?: Game2048StateData } = {};
  let gamesData2048: { p1Score?: number; p2Score?: number } = {};
  let gamesDataCollectionScores: { p1Score?: number; p2Score?: number } = {};

  const emitCombinedData = () => {
    const p1BestScore = Math.max(
      games2048Data.partner1?.highScore || 0,
      games2048Data.partner1?.currentScore || 0,
      gamesData2048.p1Score || 0,
      gamesDataCollectionScores.p1Score || 0
    );

    const p2BestScore = Math.max(
      games2048Data.partner2?.highScore || 0,
      games2048Data.partner2?.currentScore || 0,
      gamesData2048.p2Score || 0,
      gamesDataCollectionScores.p2Score || 0
    );

    const combined: { partner1?: Game2048StateData; partner2?: Game2048StateData } = {
      partner1: games2048Data.partner1
        ? {
            ...games2048Data.partner1,
            highScore: Math.max(games2048Data.partner1.highScore || 0, p1BestScore),
          }
        : p1BestScore > 0
        ? { board: [], currentScore: p1BestScore, highScore: p1BestScore, gameOver: false }
        : undefined,

      partner2: games2048Data.partner2
        ? {
            ...games2048Data.partner2,
            highScore: Math.max(games2048Data.partner2.highScore || 0, p2BestScore),
          }
        : p2BestScore > 0
        ? { board: [], currentScore: p2BestScore, highScore: p2BestScore, gameOver: false }
        : undefined,
    };

    callback(combined);
  };

  // Listener 1: couples/{slug}/games_2048 collection with name-based dynamic matchers
  const colRef = collection(db, `couples/${slug}/games_2048`);
  const unsub1 = onSnapshot(
    colRef,
    (snap) => {
      const res: { partner1?: Game2048StateData; partner2?: Game2048StateData } = {};
      snap.docs.forEach((docSnap) => {
        const id = docSnap.id.toLowerCase();
        const d = docSnap.data() as Game2048StateData & {
          updatedBy?: string;
          playerName?: string;
          partnerName?: string;
          userKey?: string;
        };

        const nameInDoc = (d.updatedBy || d.playerName || d.partnerName || '').trim().toLocaleLowerCase('tr');
        const userKeyInDoc = (d.userKey || '').toLowerCase();

        // Partner 1 matchers
        if (
          id === 'partner1' ||
          id.includes('partner1') ||
          userKeyInDoc === 'partner1'
        ) {
          if (!res.partner1 || (d.highScore || d.currentScore || 0) >= (res.partner1.highScore || res.partner1.currentScore || 0)) {
            res.partner1 = d;
          }
        }

        // Partner 2 matchers
        if (
          id === 'partner2' ||
          id.includes('partner2') ||
          userKeyInDoc === 'partner2'
        ) {
          if (!res.partner2 || (d.highScore || d.currentScore || 0) >= (res.partner2.highScore || res.partner2.currentScore || 0)) {
            res.partner2 = d;
          }
        }
      });

      games2048Data = res;
      emitCombinedData();
    },
    (err) => console.error('Error in 2048 collection snapshot:', err)
  );

  // Listener 2: couples/{slug}/games_data/2048 document
  const docRef = doc(db, `couples/${slug}/games_data`, '2048');
  const unsub2 = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        gamesData2048 = {
          p1Score: data.p1Score || 0,
          p2Score: data.p2Score || 0,
        };
        emitCombinedData();
      }
    },
    (err) => console.error('Error in 2048 games_data snapshot:', err)
  );

  // Listener 3: couples/{slug}/games_data collection for general 2048 game scores
  const gamesDataColRef = collection(db, `couples/${slug}/games_data`);
  const unsub3 = onSnapshot(
    gamesDataColRef,
    (snap) => {
      let p1Max = 0;
      let p2Max = 0;
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const gName = (data.gameName || '').toString().toLowerCase();
        if (gName.includes('2048')) {
          const pName = (data.playerName || '').toString().trim().toLocaleLowerCase('tr');
          const s = typeof data.score === 'number' ? data.score : 0;
          if (pName.includes('partner1')) {
            if (s > p1Max) p1Max = s;
          } else if (pName.includes('partner2')) {
            if (s > p2Max) p2Max = s;
          }
        }
      });
      gamesDataCollectionScores = { p1Score: p1Max, p2Score: p2Max };
      emitCombinedData();
    },
    (err) => console.error('Error in games_data collection snapshot:', err)
  );

  return () => {
    unsub1();
    unsub2();
    unsub3();
  };
}

export async function get2048State(
  slug: string,
  userKey: 'partner1' | 'partner2'
): Promise<Game2048StateData | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, `couples/${slug}/games_2048`, userKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Game2048StateData;
      }

      // Fallback check to games_data/2048
      const arcadeRef = doc(db, `couples/${slug}/games_data`, '2048');
      const arcadeSnap = await getDoc(arcadeRef);
      if (arcadeSnap.exists()) {
        const data = arcadeSnap.data();
        const scoreVal = userKey === 'partner1' ? (data.p1Score || 0) : (data.p2Score || 0);
        if (scoreVal > 0) {
          return {
            board: [],
            currentScore: scoreVal,
            highScore: scoreVal,
            gameOver: false,
          };
        }
      }
    } catch (e) {
      console.error('Error fetching 2048 state:', e);
    }
  }
  return null;
}



