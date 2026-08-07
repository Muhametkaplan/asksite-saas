import { NextRequest, NextResponse } from 'next/server';

// Rate Limiter Memory Store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 20;
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

const DEFAULT_POSTERS = [
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
];

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Saatlik AskSite-AI öneri limitine ulaştınız. Lütfen daha sonra tekrar deneyin! 💖' },
      { status: 429 }
    );
  }

  try {
    const { genre, mood, partnerName } = await req.json();

    if (!genre) {
      return NextResponse.json({ error: 'Lütfen bir film türü seçin.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      console.error('[AskSite-AI Error] GEMINI_API_KEY is missing in process.env');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY sunucu ortam değişkeni bulunamadı. Lütfen Vercel veya .env.local ayarlarınızı kontrol edin.' },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

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

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!apiRes.ok) {
      const errorDetail = await apiRes.text();
      console.error('Gemini API Error Detail:', errorDetail);
      return NextResponse.json({ error: `Gemini API Hatası (${apiRes.status}): ${errorDetail}` }, { status: 500 });
    }

    const data = await apiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return NextResponse.json({ error: 'Gemini API yanıt üretmedi.' }, { status: 500 });
    }

    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMovies = JSON.parse(cleanJson);

      if (Array.isArray(parsedMovies) && parsedMovies.length > 0) {
        const moviesWithPosters = parsedMovies.map((m: any, idx: number) => ({
          title: m.title || `Önerilen Film ${idx + 1}`,
          genre: m.genre || genre,
          reason: m.reason || 'Çiftinizle keyifle izleyeceğiniz harika bir yapım.',
          poster_url: m.poster_url || DEFAULT_POSTERS[idx % DEFAULT_POSTERS.length],
          watch_url: m.watch_url || '',
        }));

        return NextResponse.json({
          movies: moviesWithPosters,
          remaining,
        });
      }
    } catch (parseErr: any) {
      console.error('[AskSite-AI Error] Gemini JSON parse failed:', parseErr, text);
      return NextResponse.json({ error: `Gemini yanıtı JSON formatında parse edilemedi: ${text}` }, { status: 500 });
    }

    return NextResponse.json({ error: 'Gelen veride uygun film önerisi bulunamadı.' }, { status: 500 });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return NextResponse.json({ error: err.message || 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
