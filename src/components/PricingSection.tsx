'use client';

import Link from 'next/link';
import { Check, Sparkles, Heart, ShieldCheck, Zap, Lock, CreditCard, Gift, Star } from 'lucide-react';

export default function PricingSection() {
  return (
    <section id="fiyatlandirma" className="relative py-20 px-6 sm:px-8 bg-gradient-to-b from-transparent via-rose-50/50 to-purple-50/50">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-pink-300/20 via-purple-300/20 to-rose-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-rose-600 border border-rose-200 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" /> Şeffaf & Uygun Fiyatlandırma
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Aşkınıza En Uygun Paketi Seçin 💖
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Gizli ücret veya otomatik yenileme tuzağı yok. Tek tıkla ödeyin, siteniz ve davet kodunuz 1 saniyede otomatik aktif olsun.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Card 1: Standart Yıllık Çift Paketi */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-white/90 backdrop-blur-md p-8 sm:p-10 border border-gray-200/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  1 Yıllık Abonelik
                </span>
                <h3 className="text-2xl font-black text-gray-900">Standart Yıllık Paket</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  İlişkinizin 1 yılını ölümsüzleştirmek, müzik ve temel çift aktiviteleriyle keyifli vakit geçirmek için ideal paket.
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100">
                <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">250 ₺</span>
                <span className="text-xs font-bold text-gray-500">/ 1 Yıl (365 Gün)</span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-gray-700 font-medium pt-2">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>Size Özel Çift Linki:</strong> <code>asksite.com/c/isminiz</code></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>İlişki & Zaman Sayacı:</strong> Gün, saat ve saniye sayımı</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>Spotify Müzik Çalar:</strong> Ortak şarkınız ve arka plan müziği</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>Sevgi Kavanozu & Acil Sarıl:</strong> Romantik mesajlar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>5 Eğlenceli Mini Oyun:</strong> Düello, Neon XOX, Hafıza, TKM, D/C</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>Canlı Sanat Tuvali & Aşk Kuponları</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>Aşk Çarkı, Test & Sinemamız Arşivi</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>365 Gün Kesintisiz & Reklamsız Yayın</strong></span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-8 space-y-3">
              <Link
                href="/checkout?plan=yearly_standard"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gray-900 hover:bg-black text-white py-4 px-6 text-sm font-black shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98"
              >
                <span>Standart Yıllık Paketi Başlat 🚀</span>
              </Link>
              <p className="text-center text-[11px] text-gray-400 font-semibold flex items-center justify-center gap-1">
                <Lock className="h-3 w-3 text-emerald-500" /> 256-Bit SSL ile Anında Aktivasyon
              </p>
            </div>
          </div>

          {/* Card 2: Premium VIP Yıllık Paket (Featured) */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-gradient-to-b from-white via-rose-50/70 to-purple-50/70 p-8 sm:p-10 border-2 border-rose-500 shadow-2xl hover:shadow-rose-500/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* Top Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-purple-600 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-4 rounded-bl-2xl shadow-md flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> EN POPÜLER V.I.P
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200 inline-block">
                  1 Yıllık Tam Erişim (Tüm Özellikler Açık)
                </span>
                <h3 className="text-2xl font-black text-gray-900">Premium VIP Yıllık Paket</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Harita, anı defteri, zaman kapsülü ve tüm büyük arcade oyunların açık olduğu eksiksiz aşk paketi.
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 pt-2 border-t border-rose-100">
                <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  400 ₺
                </span>
                <span className="text-xs font-bold text-gray-600">/ 1 Yıl (365 Gün)</span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-gray-800 font-medium pt-2">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>Standart Paketteki TÜM Özellikler</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>📌 Aşk Haritası (Bizim Haritamız):</strong> Gezdiğiniz yerleri kalplerle işaretleyin</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>📖 Özel Anı Defteri:</strong> Sevgilinize özel günlükler ve unutulmaz anılar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>📸 Günün Anısı Sürpriz Kartı:</strong> Her gün sevgilinize nostaljik sürpriz</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>⏳ Zaman Kapsülü:</strong> Geleceğe mühürlü mektuplar ve anılar bırakın</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>🎮 4 Büyük Arcade Çift Oyunu:</strong> Dino Runner, Flappy Bird, 2048, Tower Stacker (Tüm 9 Oyun Açık!)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>📱 HD Yazdırılabilir QR Kod Kartı</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-xs">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span><strong>💎 VIP Öncelikli WhatsApp Destek</strong></span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-8 space-y-3">
              <Link
                href="/checkout?plan=yearly_premium"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white py-4 px-6 text-sm font-black shadow-xl shadow-rose-500/25 transition-all duration-200 active:scale-98"
              >
                <Heart className="h-4 w-4 fill-white" />
                <span>Premium VIP Paketi Başlat 💖</span>
              </Link>
              <p className="text-center text-[11px] text-gray-500 font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-500" /> Güvenli Ödeme (256-Bit SSL & 3D Secure)
              </p>
            </div>
          </div>
        </div>

        {/* Security & Payment Guarantees Bar */}
        <div className="mt-14 rounded-2xl bg-white/70 backdrop-blur-md border border-white p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <Zap className="h-5 w-5 text-amber-500 mx-auto" />
              <h4 className="text-xs font-bold text-gray-900">Anında Aktivasyon</h4>
              <p className="text-[10px] text-gray-500">Ödeme sonrası 1 saniyede siteniz hazır</p>
            </div>
            <div className="space-y-1">
              <Lock className="h-5 w-5 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-gray-900">256-Bit SSL Koruması</h4>
              <p className="text-[10px] text-gray-500">Banka düzeyinde veri güvenliği</p>
            </div>
            <div className="space-y-1">
              <CreditCard className="h-5 w-5 text-blue-500 mx-auto" />
              <h4 className="text-xs font-bold text-gray-900">3D Secure Güvenliği</h4>
              <p className="text-[10px] text-gray-500">SMS onaylı güvenli kart işlemi</p>
            </div>
            <div className="space-y-1">
              <Gift className="h-5 w-5 text-rose-500 mx-auto" />
              <h4 className="text-xs font-bold text-gray-900">Mükemmel Hediye</h4>
              <p className="text-[10px] text-gray-500">Yıl dönümü & doğum günü sürprizi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
