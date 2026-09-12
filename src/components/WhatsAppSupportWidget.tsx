'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, CreditCard, KeyRound, Trash2, HelpCircle, Sparkles } from 'lucide-react';

const SUPPORT_PHONE = '905524185530';

const QUICK_TOPICS = [
  {
    id: 'payment',
    title: 'Ödeme Yaptım, Sitem Açılmadı',
    icon: CreditCard,
    preset: 'Merhaba AskSite Destek Ekibi, Shopier üzerinden ödememi gerçekleştirdim ancak çift sitem henüz aktif olmadı. Sipariş numaram ve e-posta adresimle yardımcı olabilir misiniz?',
  },
  {
    id: 'pin',
    title: 'Giriş PIN Kodumuzu Unuttuk',
    icon: KeyRound,
    preset: 'Merhaba, çift sitemizin giriş PIN kodunu unuttuk. E-posta adresimiz ve sitemizin linki üzerinden PIN kodumuzu öğrenmek veya sıfırlamak istiyoruz.',
  },
  {
    id: 'deletion',
    title: 'Siteyi ve Verilerimizi Silin',
    icon: Trash2,
    preset: 'Merhaba, ilişkimiz sonlandığı için çift sitemizin, fotoğraflarımızın ve tüm verilerimizin KVKK kapsamında sistemlerinizden kalıcı olarak silinmesini talep ediyoruz.',
  },
  {
    id: 'general',
    title: 'Genel Destek / Soru',
    icon: HelpCircle,
    preset: 'Merhaba AskSite Destek Ekibi, bir konuda danışmak ve yardım almak istiyorum.',
  },
];

export default function WhatsAppSupportWidget() {
  const pathname = usePathname() || '';
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('payment');
  const [customMessage, setCustomMessage] = useState<string>(QUICK_TOPICS[0].preset);

  // Do not show the corporate support widget on private romantic couple pages to preserve the intimacy of the experience
  if (pathname.startsWith('/c/') || pathname.startsWith('/demo/')) {
    return null;
  }

  const isDashboard = pathname.startsWith('/dashboard');

  const handleSelectTopic = (topic: (typeof QUICK_TOPICS)[0]) => {
    setSelectedTopic(topic.id);
    setCustomMessage(topic.preset);
  };

  const handleSendToWhatsApp = () => {
    const text = encodeURIComponent(customMessage.trim());
    const url = `https://wa.me/${SUPPORT_PHONE}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside aria-label="Canlı Destek" className="contents">
      {/* Popover Card */}
      {isOpen && (
        <div
          className={`fixed z-[80] w-[92vw] max-w-sm rounded-3xl bg-white shadow-2xl border border-emerald-100 p-5 animate-in fade-in zoom-in-95 duration-200 ${
            isDashboard
              ? 'bottom-20 left-4 sm:bottom-24 sm:left-6'
              : 'bottom-20 right-4 sm:bottom-24 sm:right-6'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20">
                <MessageCircle className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  AskSite Destek Hattı
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold">Genellikle birkaç dakikada yanıtlarız</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Problem Selector Buttons */}
          <div className="space-y-1.5 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Nasıl yardımcı olabiliriz?
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_TOPICS.map((topic) => {
                const IconComponent = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'bg-gray-50/70 border-gray-200/60 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent
                      className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}
                    />
                    <span className="truncate">{topic.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Text Area */}
          <div className="mb-3.5">
            <label className="block text-[10px] font-bold text-gray-500 mb-1">
              WhatsApp Mesajınız:
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs text-gray-800 outline-none focus:border-emerald-500 focus:bg-white transition resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleSendToWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 px-4 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/25 hover:brightness-105 active:scale-98 transition cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            <span>WhatsApp ile Mesaj Gönder</span>
            <Send className="h-3.5 w-3.5 ml-0.5" />
          </button>

          <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
            Hızlı Müşteri Hizmetleri • 7/24 Aktif Destek
          </p>
        </div>
      )}

      {/* Floating Trigger Button */}
      <div
        className={`fixed z-[75] ${
          isDashboard
            ? 'bottom-4 left-4 sm:bottom-6 sm:left-6'
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 p-3 sm:px-4 sm:py-3 text-white shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white/60"
          aria-label="WhatsApp Destek"
          title="WhatsApp Canlı Destek"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6 fill-current" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300 border-2 border-emerald-600"></span>
            </span>
          </div>
          <span className="hidden sm:inline text-xs font-black tracking-wide">
            {isOpen ? 'Destek Kapat' : 'WhatsApp Destek'}
          </span>
        </button>
      </div>
    </aside>
  );
}
