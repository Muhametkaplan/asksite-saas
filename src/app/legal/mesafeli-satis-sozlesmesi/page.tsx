import { Metadata } from 'next';
import { FileText, ShieldAlert, CheckCircle2, Building, Mail, Phone, MapPin, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi | AskSite SaaS',
  description: 'Muhammet Kaplan (AskSite) dijital hizmet alımına ilişkin Mesafeli Satış Sözleşmesi.',
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="space-y-8 text-xs sm:text-sm text-gray-700">
      {/* Title */}
      <div className="space-y-2 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <FileText className="h-4 w-4" /> Yasal Sözleşme
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Mesafeli Satış Sözleşmesi
        </h1>
        <p className="text-xs text-gray-400">
          Son Güncelleme: 22 Ağustos 2026 | 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca düzenlenmiştir.
        </p>
      </div>

      {/* Madde 1: Taraflar */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 1 – Taraflar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200/80">
          <div className="space-y-2 text-xs">
            <h3 className="text-xs font-black text-gray-900 uppercase flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <Building className="h-4 w-4 text-rose-500" /> 1.1. SATICI (Hizmet Sağlayıcı)
            </h3>
            <p><strong>Ad Soyad / Unvan:</strong> Muhammet Kaplan (AskSite)</p>
            <p className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span><strong>Adres:</strong> Şahinbey / Gaziantep, Türkiye</span>
            </p>
            <p className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span><strong>Web Sitesi:</strong> <a href="https://www.asksite.com.tr" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline font-semibold">https://www.asksite.com.tr</a></span>
            </p>
            <p className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span><strong>E-Posta:</strong> <a href="mailto:muhammet.2713ka@gmail.com" className="text-rose-600 hover:underline">muhammet.2713ka@gmail.com</a></span>
            </p>
            <p className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span><strong>Müşteri Hizmetleri / WhatsApp:</strong> +90 552 418 55 30</span>
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <h3 className="text-xs font-black text-gray-900 uppercase pb-1 border-b border-gray-200">
              1.2. ALICI (Müşteri / Kullanıcı)
            </h3>
            <p className="leading-relaxed">
              AskSite SaaS platformu (https://www.asksite.com.tr) üzerinden dijital çift sitesi hizmeti, yıllık/ömür boyu erişim paketi veya NFC kart siparişi veren, ödeme aşamasında ad, soyad ve iletişim bilgilerini elektronik ortamda beyan eden gerçek veya tüzel kişi.
            </p>
          </div>
        </div>
      </section>

      {/* Madde 2: Sözleşmenin Konusu */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 2 – Sözleşmenin Konusu</h2>
        <p className="leading-relaxed">
          İşbu Sözleşme, ALICI&apos;nın SATICI&apos;ya ait <strong>https://www.asksite.com.tr</strong> internet sitesi üzerinden elektronik ortamda siparişini verdiği aşağıda nitelikleri ve satış fiyatı belirtilen <strong>dijital çift web sitesi SaaS (Software as a Service) yazılım/bulut hizmeti</strong> ve isteğe bağlı NFC akıllı hediye kartı ürünlerinin satışı, anında ifası ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini kapsamaktadır.
        </p>
      </section>

      {/* Madde 3: Hizmetin Niteliği ve Fiyatlandırma */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 3 – Hizmetin Niteliği, Paketler ve Ödeme Koşulları</h2>
        <p className="leading-relaxed">
          Sözleşmeye konu hizmet; ALICI&apos;ya özel bir alt alan adı veya dinamik slug (örn. <code>/c/partner1-partner2</code>) üzerinde barındırılan, etkileşimli mini oyunlar (2048, Dinozor, Flappy Bird, Tower Stacker), anı defteri, sevgi kavanozu, ilişki sayacı, canlı çizim tuvali, Spotify müzik çalar ve Gemini AI film öneri robotu içeren kişiselleştirilmiş dijital web uygulaması erişimidir.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
          <li><strong>1 Yıllık Çift Paketi:</strong> 199 ₺ (Tüm vergiler ve yasal KDV dahildir). 1 yıl süreyle kesintisiz bulut barındırma ve yayın.</li>
          <li><strong>Ömür Boyu Aşk Paketi:</strong> 349 ₺ (Tüm vergiler ve yasal KDV dahildir). Sınırsız & ömür boyu kalıcı yayın ve ek depolama.</li>
          <li>Ödemeler; BDDK lisanslı güvenli ödeme aracıları (PayTR / iyzico) üzerinden 256-Bit SSL şifreleme ve 3D Secure güvencesiyle kredi kartı, banka kartı veya havale/EFT ile tahsil edilir.</li>
        </ul>
      </section>

      {/* Madde 4: İfa ve Dijital Teslimat */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 4 – İfa ve Teslimat Şekli</h2>
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-xs">Anında Dijital İfa ve Erişim:</h3>
            <p className="text-xs leading-relaxed">
              Ödeme işleminin başarıyla tamamlanmasının ardından ALICI&apos;ya ait çift web sayfası saniyeler içinde sistem tarafından otomatik olarak derlenir, sunucu üzerinde yayına alınır ve ALICI&apos;ya özel yönetim paneli erişimi ile eşleşme kodu (invite code) anında teslim edilir.
            </p>
          </div>
        </div>
      </section>

      {/* Madde 5: Cayma Hakkı ve Yasal İstisnalar */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 5 – Cayma Hakkı ve Cayma Hakkının İstisnaları</h2>
        <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 text-rose-950">
          <div className="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
            <span>Mesafeli Sözleşmeler Yönetmeliği Madde 15/ğ Kapsamında Cayma Hakkı İstisnası:</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-semibold bg-white/80 p-3 rounded-xl border border-rose-200">
            &quot;Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.&quot; (Mesafeli Sözleşmeler Yönetmeliği Md. 15/1-ğ)
          </p>
          <p className="text-xs leading-relaxed">
            AskSite SaaS (Muhammet Kaplan) tarafından sunulan dijital çift web sitesi hizmeti; sipariş ve ödeme tamamlandığı anda kullanıcı adına özel olarak üretilip saniyeler içinde sunucu üzerinde yayına alındığı ve anında ifa edildiği için, mevzuat gereği ifasına başlanan bu dijital gayrimaddi hizmetlerde <strong>cayma hakkı bulunmamaktadır</strong>. ALICI, siparişi tamamlayarak ve ödemeyi gerçekleştirerek bu yasal koşulu peşinen kabul ve beyan etmiştir.
          </p>
        </div>
      </section>

      {/* Madde 6: Genel Hükümler ve Garanti */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 6 – Hizmet Sürekliliği ve Teknik Destek</h2>
        <p className="leading-relaxed">
          SATICI, satın alınan paketin süresi boyunca hizmetin %99.9 erişilebilirlikle (uptime) kesintisiz sunulması için gerekli tüm teknik altyapı, sunucu ve veritabanı bakımını sağlamakla yükümlüdür. Olası teknik arızalarda SATICI, kesintinin yaşandığı süreyi ALICI&apos;nın abonelik süresine ilave etmekle veya teknik telafiyi sağlamakla yükümlüdür.
        </p>
      </section>

      {/* Madde 7: Uyuşmazlıkların Çözümü */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Madde 7 – Uyuşmazlıkların Çözümü ve Yetkili Mahkeme</h2>
        <p className="leading-relaxed">
          İşbu Sözleşme&apos;nin uygulanmasından doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca her yıl ilan edilen parasal sınırlar dahilinde ALICI&apos;nın mal veya hizmeti satın aldığı veya ikametgahının bulunduğu yerdeki Tüketici Hakem Heyetleri ile Gaziantep Tüketici Mahkemeleri yetkilidir.
        </p>
      </section>

      {/* Madde 8: Yürürlük */}
      <section className="space-y-2 pt-4 border-t border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Madde 8 – Yürürlük</h2>
        <p className="leading-relaxed">
          ALICI, internet sitesi üzerinden siparişi tamamladığında işbu Sözleşme&apos;nin tüm koşullarını okuduğunu, anladığını ve elektronik ortamda onaylayarak kabul ettiğini beyan eder.
        </p>
      </section>
    </div>
  );
}
