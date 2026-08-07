import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate Limiter Memory Store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 15;
const ONE_HOUR_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + ONE_HOUR_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - userLimit.count };
}

const FALLBACK_MOVIES = [
  {
    title: 'La La Land (Aşıklar Şehri) (2016)',
    genre: 'Romantik / Müzikal',
    reason: 'Mia ve Sebastian’ın tutku dolu aşkı ve harika müzikleriyle çiftlerin baş başa izleyebileceği en büyüleyici filmlerden biri.',
    poster_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
    watch_url: 'https://www.primevideo.com',
  },
  {
    title: 'About Time (Zamanda Aşk) (2013)',
    genre: 'Romantik / Fantastik',
    reason: 'Zamanın ve sevginin değerini sıcacık bir hikayeyle hissettiren, birlikte izlerken gözlerinizi dolduracak muazzam bir yapım.',
    poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
    watch_url: 'https://www.netflix.com',
  },
  {
    title: 'Before Sunrise (Gün Doğmadan) (1995)',
    genre: 'Romantik / Drama',
    reason: 'Viyana sokaklarında gece boyunca süren derin sohbetler ve aşka dönüşen tesadüflerle dolu saf bir romantik klasik.',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    watch_url: 'https://www.netflix.com',
  },
  {
    title: 'Palm Springs (2020)',
    genre: 'Romantik Komedi',
    reason: 'Bir düğün gününde zaman döngüsüne hapsolan iki neşeli insanın eğlence ve kahkaha dolu modern aşk macerası.',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
    watch_url: 'https://www.primevideo.com',
  },
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Saatlik AskSite-AI öneri limitine ulaştınız. Lütfen biraz sonra tekrar deneyin! 💖',
        movies: FALLBACK_MOVIES,
      },
      { status: 429 }
    );
  }

  try {
    const { genre, mood, partnerName } = await req.json();

    if (!genre) {
      return NextResponse.json({ error: 'Lütfen bir film türü seçin.', movies: FALLBACK_MOVIES }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({
        movies: FALLBACK_MOVIES,
        remaining,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Sevgililer ${partnerName || 'İrem ve Muhammet'} için romantik sinema gecesine özel EN AZ 3, EN FAZLA 4 adet kaliteli film veya dizi öner. 
Tür: ${genre}. 
Ruh Hali/Mod: ${mood || 'Romantik, samimi ve eğlenceli'}.

Yalnızca aşağıdaki JSON array formatında yanıt ver, başka hiçbir açıklama veya markdown ekleme:
[
  {
    "title": "Film Adı (Yapım Yılı)",
    "genre": "Tür",
    "reason": "Neden izlemelisiniz? Çiftlere özel 2-3 cümlelik samimi öneri açıklaması."
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      // Clean JSON string if wrapped in markdown code blocks
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMovies = JSON.parse(cleanJson);

      if (Array.isArray(parsedMovies) && parsedMovies.length > 0) {
        const moviesWithFallbackPosters = parsedMovies.map((m: any, idx: number) => ({
          title: m.title || `Önerilen Film ${idx + 1}`,
          genre: m.genre || genre,
          reason: m.reason || 'Çiftinizle keyifle izleyeceğiniz harika bir yapım.',
          poster_url: FALLBACK_MOVIES[idx % FALLBACK_MOVIES.length].poster_url,
          watch_url: FALLBACK_MOVIES[idx % FALLBACK_MOVIES.length].watch_url,
        }));

        return NextResponse.json({
          movies: moviesWithFallbackPosters,
          remaining,
        });
      }
    } catch (parseErr) {
      console.warn('AskSite-AI Gemini JSON parse failed, returning fallback:', parseErr);
    }

    return NextResponse.json({
      movies: FALLBACK_MOVIES,
      remaining,
    });
  } catch (err: any) {
    console.error('AskSite-AI Gemini API Error:', err);
    return NextResponse.json({
      movies: FALLBACK_MOVIES,
      error: 'Canlı yapay zeka servisine erişilemedi, sizin için özenle seçilmiş hazır öneriler sunuluyor! 🍿',
    });
  }
}
