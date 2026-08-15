import { Metadata } from 'next';
import { Truck, ShieldCheck, Zap, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Teslimat ve Ödeme Şartları | AskSite SaaS',
  description: 'AskSite SaaS platformu anında dijital teslimat ve 256-bit SSL güvenli ödeme koşulları.',
};

export default function TeslimatVeOdemePage() {
  return (
    <div className="space-y-8 text-xs sm:text-sm text-gray-700">
      {/* Title */}
      <div className="space-y-2 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <Truck className="h-4 w-4" /> Hizmet & Ödeme Standartları
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Teslimat ve Ödeme Şartları
        </h1>
        <p className="text-xs text-gray-400">
          Son Güncelleme: 15 Ağustos 2026 | E-Ticaret ve dijital hizmet teslimat protokolü
        </p>
      </div>

      {/* 1. Dijital Teslimat */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span>1. Dijital Hizmet Teslimat Süreci (Anında Aktivasyon)</span>
        </h2>
        <p className="leading-relaxed">
          AskSite SaaS, bir dijital mikro-hizmet platformudur. Satın alınan paketler fiziksel bekleme süresi olmaksızın anında teslim edilir:
        </p>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>1 Saniyede Otomatik Yayın:</span>
          </div>
          <p className="text-xs leading-relaxed">
            Ödeme onaylandığı an sistemimiz sizin ve partnerinizin ismine özel çift web sitesini (<code>asksite.com/c/isminiz</code>) otomatik olarak derler ve yayına alır. Ekranda beliren özel <strong>Davet Kodu (Pair Code)</strong> ve <strong>Yönetim Paneli Girişi</strong> anında teslim edilir.
          </p>
        </div>
      </section>

      {/* 2. Ödeme Güvenliği */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-500" />
          <span>2. 256-Bit SSL ve 3D Secure Ödeme Güvenliği</span>
        </h2>
        <p className="leading-relaxed">
          Platformumuz üzerinden gerçekleştirilen tüm ödeme işlemleri uluslararası güvenlik standartlarına tam uyumludur:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
          <li><strong>256-Bit SSL Şifreleme:</strong> Kredi kartı ve ödeme bilgileriniz tarayıcınızdan bankaya doğrudan şifreli kanalla iletilir; sunucularımızda kart bilgisi asla kaydedilmez veya saklanmaz.</li>
          <li><strong>3D Secure Zorunluluğu:</strong> Bankanız tarafından telefonunuza gönderilen tek kullanımlık SMS onay kodu ile ödeme güvenliği en üst düzeyde sağlanır.</li>
          <li><strong>Lisanslı Ödeme Altyapısı:</strong> Ödemeler BDDK lisanslı güvenli ödeme kuruluşları (PayTR, iyzico, Shopier) aracılığıyla işlenir.</li>
        </ul>
      </section>

      {/* 3. Desteklenen Ödeme Yöntemleri */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          <span>3. Desteklenen Ödeme Yöntemleri</span>
        </h2>
        <p className="leading-relaxed">
          Siparişlerinizi aşağıdaki yöntemlerle güvenle tamamlayabilirsiniz:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-center">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">
            Visa Kredi / Banka Kartı
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">
            Mastercard Kartlar
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">
            TROY Kartlar
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800">
            Havale / EFT
          </div>
        </div>
      </section>

      {/* 4. Fiziksel NFC Ürünleri Kargo Teslimatı */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Truck className="h-5 w-5 text-purple-500" />
          <span>4. Fiziksel NFC Akıllı Kart Kargo Teslimatı</span>
        </h2>
        <p className="leading-relaxed">
          Fiziksel NFC Akıllı Kart veya hediye ürünü içeren paketler satın alındığında:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
          <li><strong>Ücretsiz Kargo:</strong> Fiziksel ürünlerde Türkiye&apos;nin 81 iline kargo ücretsizdir.</li>
          <li><strong>Kargoya Veriliş Süresi:</strong> Kişiye özel NFC çip kodlamasının ardından ürünler 1-2 iş günü içinde anlaşmalı kargo firmasına teslim edilir.</li>
          <li><strong>Kargo Takip Bilgisi:</strong> Kargo takip numarası sipariş sırasında beyan edilen e-posta adresinize veya WhatsApp numaranıza iletilir.</li>
        </ul>
      </section>

      {/* 5. Fatura ve Bilgilendirme */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">5. E-Fatura ve Sipariş Bildirimi</h2>
        <p className="leading-relaxed">
          Ödeme onayının ardından e-faturanız ve sipariş detayınız kayıtlı e-posta adresinize dijital ortamda iletilir. Satın aldığınız paket kapsamındaki hizmet süresi (1 Yıllık veya Ömür Boyu) ödeme anından itibaren başlar.
        </p>
      </section>
    </div>
  );
}
