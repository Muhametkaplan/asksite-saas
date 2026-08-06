import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate Limiter Memory Store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 10;
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Saatlik film önerisi limitine ulaştınız. Lütfen daha sonra tekrar deneyin! 💖' },
      { status: 429 }
    );
  }

  try {
    const { genre, mood, partnerName } = await req.json();

    if (!genre) {
      return NextResponse.json({ error: 'Lütfen bir film türü seçin.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY || '';

    if (!apiKey) {
      // Return a pleasant fallback movie recommendation if API key is not yet set up
      return NextResponse.json({
        title: 'La La Land (Aşıklar Şehri)',
        plot: 'Mia ve Sebastian hayallerinin peşinden koşarken birbirlerine aşık olurlar.',
        reason: 'Romantizm, canlı müzikler ve duygusal anlarla dolu unutulmaz bir aşk hikayesi.',
        rawText: 'La La Land|Mia ve Sebastian hayallerinin peşinden koşarken birbirlerine aşık olurlar.|Romantizm, canlı müzikler ve duygusal anlarla dolu unutulmaz bir aşk hikayesi.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Sevgilim ${partnerName || 'İrem'} için film önerisi yap. Tür: ${genre}. His/Mod: ${mood || 'Mutlu ve romantik'}. Sadece bir adet film öner. Konuşma yapma, doğrudan şu formatta cevap ver: [FILM_ADI]|[FILM_KONUSU]|[NEDEN_IZLEMELISINIZ]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parts = text.split('|');

    if (parts.length >= 3) {
      return NextResponse.json({
        title: parts[0].trim(),
        plot: parts[1].trim(),
        reason: parts[2].trim(),
        remaining
      });
    }

    return NextResponse.json({
      title: 'Romantik Sinema Seçimi',
      plot: text,
      reason: 'Birlikte patlamış mısır eşliğinde keyifle izleyebilirsiniz! 🍿',
      remaining
    });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return NextResponse.json(
      { error: 'Film önerisi oluşturulurken bir hata oluştu, lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
