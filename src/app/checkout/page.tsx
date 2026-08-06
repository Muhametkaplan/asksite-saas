'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, CreditCard, CheckCircle2, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const router = useRouter();
  const [packageType, setPackageType] = useState<'digital' | 'nfc'>('digital');
  const [loading, setLoading] = useState(false);

  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [startDate, setStartDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // NFC Shipping Address fields
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partner1 || !partner2) {
      alert('Lütfen eşlerin isimlerini giriniz.');
      return;
    }

    if (packageType === 'nfc' && (!address || !city)) {
      alert('Lütfen NFC Kart teslimat adresinizi eksiksiz doldurun.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner1_name: partner1,
          partner2_name: partner2,
          package_type: packageType,
          start_date: startDate,
          whatsapp_number: whatsapp,
          shipping_address: packageType === 'nfc' ? `${fullName} - ${address}, ${city}` : null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.redirect_url) {
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
        router.push(data.redirect_url);
      } else {
        alert(data.error || 'Ödeme tamamlanamadı.');
      }
    } catch (e) {
      alert('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-1 text-xs font-bold text-rose-600 mb-3">
            <Sparkles className="h-4 w-4" /> Güvenli Ödeme & Otomatik Kurulum
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Aşk Sitenizi Şimdi Oluşturun ❤️
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Paketinizi seçin, 1 dakikada kişisel sitenize kavuşun.
          </p>
        </div>

        {/* Package Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Dijital Paket */}
          <div
            onClick={() => setPackageType('digital')}
            className={`cursor-pointer rounded-3xl p-6 transition-all border-2 ${
              packageType === 'digital'
                ? 'border-rose-500 bg-white shadow-xl ring-2 ring-rose-500/20'
                : 'border-white/80 bg-white/60 hover:bg-white/90'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Popüler Dijital Paket
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">Dijital Aşk Sayfası</h3>
              </div>
              <CheckCircle2
                className={`h-6 w-6 ${
                  packageType === 'digital' ? 'text-rose-500' : 'text-gray-300'
                }`}
              />
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-4">
              ₺399 <span className="text-xs font-normal text-gray-500">/ 1 Yıllık Yayın</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Özel `asksite.com/c/...` Linki
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> İndirilebilir Yüksek Çözünürlüklü HD QR Kod
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Yapay Zeka (Gemini AI) Film Robotu
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sevgi Kavanozu & Harita Anı Noktaları
              </li>
            </ul>
          </div>

          {/* Fiziksel NFC Paketi */}
          <div
            onClick={() => setPackageType('nfc')}
            className={`cursor-pointer rounded-3xl p-6 transition-all border-2 relative overflow-hidden ${
              packageType === 'nfc'
                ? 'border-purple-600 bg-white shadow-xl ring-2 ring-purple-600/20'
                : 'border-white/80 bg-white/60 hover:bg-white/90'
            }`}
          >
            <div className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1 text-[10px] font-extrabold text-white shadow-sm">
              SÜPRİZ HEDİYE
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Fiziksel + Dijital V.I.P Paket
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">NFC Akıllı Kart & Anahtarlık</h3>
              </div>
              <CheckCircle2
                className={`h-6 w-6 ${
                  packageType === 'nfc' ? 'text-purple-600' : 'text-gray-300'
                }`}
              />
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-4">
              ₺699 <span className="text-xs font-normal text-gray-500">/ Kargo Dahil</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2 font-semibold text-purple-700">
                <Truck className="h-4 w-4 text-purple-600" /> Adrese Ücretsiz Kargo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" /> Telefonu Yaklaştırınca Açılan Akıllı NFC Çip
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" /> Dijital Paket İçeriğinin Tamamı
              </li>
            </ul>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" /> Çift Bilgileri
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sizin İsminiz (Partner 1) *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ahmet"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sevgilinizin İsmi (Partner 2) *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ayşe"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                İlişki Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                WhatsApp Numarası (Ülke kodu ile)
              </label>
              <input
                type="text"
                placeholder="905520000000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          {/* NFC Shipping Address Form */}
          {packageType === 'nfc' && (
            <div className="mb-6 rounded-2xl bg-purple-50 p-4 border border-purple-100 animate-in fade-in duration-300">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> NFC Kart Teslimat Adresi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    placeholder="İstanbul"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Açık Adres</label>
                <textarea
                  rows={2}
                  placeholder="Mahalle, Sokak, No, Daire..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* Payment Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 py-4 text-base font-bold text-white shadow-xl transition hover:opacity-95 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              'Ödeme İşleniyor...'
            ) : (
              <>
                <CreditCard className="h-5 w-5" /> Güvenli Öde ({packageType === 'digital' ? '₺399' : '₺699'}) ve Paneli Aç <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> 256-Bit SSL ile %100 Güvenli Ödeme & Anında Aktivasyon
          </div>
        </form>
      </div>
    </div>
  );
}
