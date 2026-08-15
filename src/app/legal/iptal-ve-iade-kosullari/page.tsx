import { Metadata } from 'next';
import { RefreshCw, HelpCircle, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İptal ve İade Koşulları | AskSite SaaS',
  description: 'AskSite SaaS platformu dijital hizmet alımlarına ilişkin iptal, iade ve cayma hakkı prosedürleri.',
};

export default function IptalVeIadeKosullariPage() {
  return (
    <div className="space-y-8 text-xs sm:text-sm text-gray-700">
      {/* Title */}
      <div className="space-y-2 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <RefreshCw className="h-4 w-4" /> Müşteri Güvencesi
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          İptal ve İade Koşulları
        </h1>
        <p className="text-xs text-gray-400">
          Son Güncelleme: 15 Ağustos 2026 | Dijital içerik ve yazılım hizmeti standartları
        </p>
      </div>

      {/* Giriş */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">1. Dijital Hizmetin Niteliği</h2>
        <p className="leading-relaxed">
          AskSite SaaS platformunda sunulan hizmetler; tamamen dijital ortamda barındırılan, kişiselleştirilmiş web uygulamaları, etkileşimli çift sayfaları ve veri depolama alanlarıdır. Ödeme işlemi tamamlandığı anda sunucu üzerinde ALICI adına özel bir alan adı/slug ayrılmakta ve veritabanı alanı anında kullanıma açılmaktadır.
        </p>
      </section>

      {/* Cayma Hakkı ve Dijital Ürün İstisnası */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">2. Cayma Hakkı ve Yasal İade Esasları</h2>
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950 space-y-2">
          <p className="font-bold text-xs">
            Mesafeli Sözleşmeler Yönetmeliği Madde 15/ğ Gereğince:
          </p>
          <p className="text-xs leading-relaxed">
            &quot;Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler&quot; kapsamında, siparişin verilip ödemenin onaylanmasıyla birlikte çift web sitesi anında oluşturulduğu için cayma hakkı ve standart ürün iadesi yasal olarak geçerli değildir.
          </p>
          <p className="text-xs leading-relaxed">
            Kullanıcı, ödeme adımında bu koşulu ve hizmetin anında ifa edileceğini peşinen onaylamaktadır.
          </p>
        </div>
      </section>

      {/* Teknik Hata ve Kusur Durumlarında Garanti */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">3. Teknik Aksaklık ve Telafi Garantisi</h2>
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-xs">%100 Memnuniyet ve Teknik Destek Güvencesi</h3>
            <p className="text-xs leading-relaxed">
              Sipariş sonrasında web sitesinin teknik nedenlerle oluşturulamaması, sunucu arızası nedeniyle kesinti yaşanması veya çift sayfasına 24 saatten uzun süre erişilememesi gibi SATICI kaynaklı kusurlu durumlarda:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-900 pt-1">
              <li>Öncelikle teknik ekip tarafından sorun en geç 12 saat içinde ücretsiz olarak giderilir.</li>
              <li>Sorunun teknik olarak çözülememesi durumunda ALICI&apos;nın ödediği tutar, ödeme yapılan kredi kartına veya banka hesabına 3-7 iş günü içinde <strong>kesintisiz tam iade</strong> edilir.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Fiziksel NFC Kart Siparişlerinin İptali */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">4. Fiziksel NFC Kart ve Hediye Ürünleri</h2>
        <p className="leading-relaxed">
          Eğer sipariş kapsamında adrese teslim edilecek fiziksel bir NFC akıllı kart veya hediye ürünü satın alınmışsa; ürün kargoya verilmeden önce ALICI sipariş iptali talebinde bulunabilir. Ürün kargoya teslim edildikten sonra ambalajı açılmamış ve kişiselleştirilmemiş ürünler 14 gün içinde iade edilebilir; ancak çift web sitesi yazılım lisans bedeli dijital olarak ifa edildiğinden fiziksel ürün harici yazılım bedeli iade kapsamı dışındadır.
        </p>
      </section>

      {/* İade ve İptal Süreci Başvurusu */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">5. Başvuru ve İletişim Kanalları</h2>
        <p className="leading-relaxed">
          Her türlü soru, teknik destek veya fatura inceleme talebiniz için destek ekibimize dilediğiniz zaman ulaşabilirsiniz:
        </p>
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Mail className="h-4 w-4 text-rose-500" />
            <span>Müşteri Hizmetleri E-Posta:</span>
            <a href="mailto:destek@asksite.com" className="text-rose-600 hover:underline">destek@asksite.com</a>
          </div>
          <p className="text-xs text-gray-500">
            E-posta ile iletilen tüm talepler en geç 24 saat içerisinde incelenerek geri dönüş sağlanır.
          </p>
        </div>
      </section>
    </div>
  );
}
