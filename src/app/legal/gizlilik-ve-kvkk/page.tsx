import { Metadata } from 'next';
import { Lock, Shield, Database, FileCheck, Building, Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni | AskSite SaaS',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca Muhammet Kaplan (AskSite) gizlilik ve çerez politikası.',
};

export default function GizlilikVeKvkkPage() {
  return (
    <div className="space-y-8 text-xs sm:text-sm text-gray-700">
      {/* Title */}
      <div className="space-y-2 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <Lock className="h-4 w-4" /> Veri Güvenliği & KVKK
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </h1>
        <p className="text-xs text-gray-400">
          Son Güncelleme: 22 Ağustos 2026 | 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Uyarınca Hazırlanmıştır.
        </p>
      </div>

      {/* 1. Veri Sorumlusu */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">1. Veri Sorumlusunun Kimliği</h2>
        <p className="leading-relaxed">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, <strong>Muhammet Kaplan (AskSite SaaS)</strong> (&quot;Veri Sorumlusu&quot;) olarak, kişisel verilerinizi aşağıda açıklanan amaçlar, yöntemler ve yasal sınırlar çerçevesinde işlemekte, saklamakta ve korumaktayız.
        </p>
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Building className="h-4 w-4 text-rose-500 shrink-0" />
            <span>Veri Sorumlusu:</span>
            <span className="text-gray-700 font-normal">Muhammet Kaplan (AskSite SaaS)</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
            <span>Adres:</span>
            <span className="text-gray-700 font-normal">Şahinbey / Gaziantep, Türkiye</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Mail className="h-4 w-4 text-rose-500 shrink-0" />
            <span>E-Posta:</span>
            <a href="mailto:muhammet.2713ka@gmail.com" className="text-rose-600 hover:underline">muhammet.2713ka@gmail.com</a>
          </div>
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Telefon / WhatsApp:</span>
            <a href="https://wa.me/905524185530" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">+90 552 418 55 30</a>
          </div>
        </div>
      </section>

      {/* 2. İşlenen Kişisel Veriler */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">2. İşlenen Kişisel Verileriniz</h2>
        <p className="leading-relaxed">
          AskSite SaaS platformu (https://www.asksite.com.tr) üzerinden çift sitesi oluştururken ve etkileşimli modülleri kullanırken aşağıdaki veriler işlenmektedir:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
            <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-rose-500" /> Kimlik & İletişim Verileri
            </h3>
            <p className="text-xs text-gray-600">
              Partner 1 ve Partner 2 isimleri, e-posta adresleri, WhatsApp iletişim numarası.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
            <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <Database className="h-4 w-4 text-purple-500" /> Çift İçerik Verileri
            </h3>
            <p className="text-xs text-gray-600">
              Yüklenen anı fotoğrafları, aşk sözleri, ilişki başlangıç tarihi, özel harita koordinatları ve mini oyun skorları.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Veri İşleme Amaçları */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">3. Kişisel Verilerin İşlenme Amaçları</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
          <li>Kişiye özel çift web sitesinin (URL/slug) oluşturulması ve bulutta yayına alınması,</li>
          <li>Kullanıcılar arasında davet kodu ve PIN ile çift yetkilendirmesinin sağlanması,</li>
          <li>Ödeme ve e-fatura süreçlerinin BDDK lisanslı aracı kurumlar üzerinden yürütülmesi,</li>
          <li>Gerçek zamanlı mini oyunlar, çizim tuvali ve Spotify bileşenlerinin senkronize çalışması,</li>
          <li>Talep halinde teknik destek ve müşteri hizmetlerinin sunulması.</li>
        </ul>
      </section>

      {/* 4. Veri Güvenliği Tedbirleri */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">4. Veri Güvenliği ve Gizlilik Taahhüdü</h2>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Kişisel Verileriniz Kesinlikle 3. Taraflarla Paylaşılmaz veya Satılmaz</span>
          </div>
          <p className="text-xs leading-relaxed">
            Platformumuzdaki tüm veri iletişimi <strong>256-Bit SSL / TLS</strong> protokolleri ile şifrelenir. Yüklediğiniz fotoğraflar ve özel mesajlar sadece sizin çift sayfanız ve yetkilendirdiğiniz partneriniz tarafından görüntülenebilir; reklam veya pazarlama amacıyla harici kişi ve kurumlarla asla paylaşılmaz.
          </p>
        </div>
      </section>

      {/* 5. Çerez (Cookie) Politikası */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">5. Çerez (Cookie) Politikası</h2>
        <p className="leading-relaxed">
          Platformumuz, oturumunuzu güvenle açık tutmak, eşleşme durumunuzu hatırlamak ve sayfa tercihlerini kaydetmek amacıyla temel ve zorunlu çerezleri (<code>couple_slug</code>, oturum jetonları) kullanmaktadır. Bu çerezler web sitesinin temel işlevlerini yerine getirebilmesi için teknik olarak zorunludur.
        </p>
      </section>

      {/* 6. KVKK Madde 11 Haklarınız */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">6. İlgili Kişi (Veri Sahibi) Olarak Haklarınız</h2>
        <p className="leading-relaxed">
          KVKK&apos;nın 11. maddesi uyarınca her zaman aşağıdaki haklara sahipsiniz:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
          <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
          <li>Kişisel verilerinizin silinmesini, yok edilmesini veya düzeltilmesini talep etme,</li>
          <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme.</li>
        </ul>
        <p className="text-xs text-gray-600 pt-2">
          Haklarınızı kullanmak veya verilerinizin silinmesini talep etmek için <a href="mailto:muhammet.2713ka@gmail.com" className="text-rose-600 font-bold hover:underline">muhammet.2713ka@gmail.com</a> e-posta adresimiz üzerinden veya <a href="https://wa.me/905524185530" className="text-emerald-600 font-bold hover:underline">+90 552 418 55 30</a> WhatsApp hattımızdan bize dilediğiniz zaman ulaşabilirsiniz.
        </p>
      </section>
    </div>
  );
}
