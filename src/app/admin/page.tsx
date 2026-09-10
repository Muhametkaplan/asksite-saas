'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  Heart,
  Package,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  Mail,
  Send,
  Trash2,
  Edit3,
  Power,
  Key,
  Copy,
  Download,
  Truck,
  Shield,
  Layers,
  Sparkles,
  Check,
  X,
  Radio,
  HelpCircle,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'couples' | 'users' | 'shipping' | 'tools'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [couples, setCouples] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Search & Filter States
  const [searchOrders, setSearchOrders] = useState('');
  const [searchCouples, setSearchCouples] = useState('');
  const [coupleStatusFilter, setCoupleStatusFilter] = useState('all');
  const [searchUsers, setSearchUsers] = useState('');

  // Modals & Action States
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [editingCouple, setEditingCouple] = useState<any | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // Tools form state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(null), 4000);
  };

  const adminFetch = (url: string, init?: RequestInit) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('asksite_admin_token') : null;
    const headers = new Headers(init?.headers);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { credentials: 'include', ...init, headers });
  };

  // Load All Dashboard Data
  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [mRes, oRes, cRes, uRes] = await Promise.all([
        adminFetch('/api/admin/metrics'),
        adminFetch('/api/admin/orders'),
        adminFetch('/api/admin/couples'),
        adminFetch('/api/admin/users'),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
        setHealth(mData.health);
      }
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData.orders || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCouples(cData.couples || []);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
      showError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Action: Manual Activate Couple from Order
  const handleManualActivate = async (order: any) => {
    if (!order.matchedCoupleSlug) {
      const targetSlug = prompt('Bu siparişi bağlamak istediğiniz çiftin slug kodunu giriniz:');
      if (!targetSlug) return;
      order.matchedCoupleSlug = targetSlug.trim();
    }

    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate_couple',
          slug: order.matchedCoupleSlug,
          orderId: order.id,
          plan: order.total >= 400 ? 'nfc' : order.total >= 300 ? 'lifetime' : 'yearly',
          email: order.buyerEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(data.message);
        fetchAllData();
      } else {
        showError(data.error || 'Aktivasyon yapılamadı.');
      }
    } catch (e) {
      showError('Bağlantı hatası.');
    }
  };

  // Action: Resend Activation Email
  const handleResendEmail = async (order: any) => {
    const slug = order.matchedCoupleSlug || prompt('E-postaya eklenecek çift sitesi linki (slug):');
    if (!slug) return;

    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_email',
          email: order.buyerEmail,
          slug,
          orderId: order.id,
          partner1: order.matchedCoupleNames ? order.matchedCoupleNames.split('&')[0].trim() : 'Partner 1',
          partner2: order.matchedCoupleNames ? order.matchedCoupleNames.split('&')[1]?.trim() : 'Partner 2',
          plan: order.total >= 400 ? 'nfc' : order.total >= 300 ? 'lifetime' : 'yearly',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(`Aktivasyon e-postası ${order.buyerEmail} adresine gönderildi! ✓`);
      } else {
        showError(data.error || 'E-posta gönderilemedi.');
      }
    } catch (e) {
      showError('E-posta gönderim hatası.');
    }
  };

  // Action: Toggle Couple is_active
  const handleToggleActive = async (couple: any) => {
    const nextStatus = !couple.is_active;
    try {
      const res = await adminFetch('/api/admin/couples', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: couple.slug,
          updates: { is_active: nextStatus },
        }),
      });
      if (res.ok) {
        showSuccess(`${couple.slug} sitesi ${nextStatus ? 'yayına alındı 🟢' : 'pasife alındı 🚫'}`);
        setCouples((prev) =>
          prev.map((c) => (c.slug === couple.slug ? { ...c, is_active: nextStatus } : c))
        );
      }
    } catch (e) {
      showError('Durum güncellenemedi.');
    }
  };

  // Action: Save Edit Couple Modal
  const handleSaveEditCouple = async () => {
    if (!editingCouple) return;
    try {
      const res = await adminFetch('/api/admin/couples', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingCouple.slug,
          updates: {
            partner1_name: editingCouple.partner1_name,
            partner2_name: editingCouple.partner2_name,
            partner1_email: editingCouple.partner1_email,
            partner2_email: editingCouple.partner2_email,
            isPaid: editingCouple.isPaid,
            package_type: editingCouple.package_type,
            partner1_pin: editingCouple.partner1_pin,
            partner2_pin: editingCouple.partner2_pin,
            whatsapp_number: editingCouple.whatsapp_number,
          },
        }),
      });
      if (res.ok) {
        showSuccess(`${editingCouple.slug} bilgileri güncellendi! ✓`);
        setEditingCouple(null);
        fetchAllData();
      }
    } catch (e) {
      showError('Güncelleme hatası.');
    }
  };

  // Action: Delete Couple
  const handleDeleteCouple = async (slug: string) => {
    const confirmation = prompt(`DİKKAT: ${slug} çiftinin tüm fotoğrafları, anıları ve ayarları kalıcı olarak silinecek. Onaylamak için 'SİL' yazın:`);
    if (confirmation !== 'SİL') return;

    try {
      const res = await adminFetch(`/api/admin/couples?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(data.message);
        setCouples((prev) => prev.filter((c) => c.slug !== slug));
        fetchAllData();
      } else {
        showError(data.error || 'Silme işlemi başarısız.');
      }
    } catch (e) {
      showError('Silme isteği başarısız.');
    }
  };

  // Action: Manual Verify User Email
  const handleVerifyUserEmail = async (uid: string) => {
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_email', uid }),
      });
      if (res.ok) {
        showSuccess('Kullanıcı e-postası onaylandı! ✓');
        setUsers((prev) =>
          prev.map((u) => (u.uid === uid ? { ...u, emailVerified: true } : u))
        );
      }
    } catch (e) {
      showError('Doğrulama başarısız.');
    }
  };

  // Action: Send Test Email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setSendingTestEmail(true);

    try {
      const res = await adminFetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailAddress }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(`Test e-postası başarıyla gönderildi: ${testEmailAddress}`);
        setTestEmailAddress('');
      } else {
        showError(data.error || 'Test e-postası gönderilemedi.');
      }
    } catch (e) {
      showError('E-posta gönderiminde hata oluştu.');
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Action: Download JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      metrics,
      couples,
      users,
      orders,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asksite-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Veritabanı yedeği JSON olarak indirildi! 📥');
  };

  // Filtered Lists
  const filteredOrders = orders.filter((o) => {
    if (!searchOrders) return true;
    const q = searchOrders.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.buyerEmail.toLowerCase().includes(q) ||
      (o.matchedCoupleSlug && o.matchedCoupleSlug.toLowerCase().includes(q))
    );
  });

  const filteredCouples = couples.filter((c) => {
    if (coupleStatusFilter === 'active' && !c.is_active) return false;
    if (coupleStatusFilter === 'passive' && c.is_active) return false;
    if (coupleStatusFilter === 'paid' && !c.isPaid) return false;
    if (coupleStatusFilter === 'unpaid' && c.isPaid) return false;

    if (!searchCouples) return true;
    const q = searchCouples.toLowerCase();
    return (
      c.slug.toLowerCase().includes(q) ||
      c.partner1_name.toLowerCase().includes(q) ||
      c.partner2_name.toLowerCase().includes(q) ||
      c.partner1_email.toLowerCase().includes(q) ||
      c.partner2_email.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!searchUsers) return true;
    const q = searchUsers.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (u.couple_slug && u.couple_slug.toLowerCase().includes(q))
    );
  });

  const shippingOrders = couples.filter((c) => c.shipping_address && c.shipping_address.trim() !== '');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-rose-500 font-bold gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        <span className="text-xs text-slate-400">Süper Admin Paneli Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Messages */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 text-white px-5 py-3 text-xs font-black shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4" /> {actionSuccessMsg}
        </div>
      )}
      {actionErrorMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-rose-600 text-white px-5 py-3 text-xs font-black shadow-2xl animate-in slide-in-from-bottom-5">
          <AlertCircle className="h-4 w-4" /> {actionErrorMsg}
        </div>
      )}

      {/* Top Banner & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              <Sparkles className="h-3 w-3" /> Canlı Kontrol Merkezi
            </span>
            <span className="text-xs text-slate-400">
              Son Senkronizasyon: <strong className="text-slate-200">{new Date().toLocaleTimeString('tr-TR')}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            AskSite SaaS Yönetim Masası 👑
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
            <span>{refreshing ? 'Yenileniyor...' : 'Verileri Yenile'}</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Yedek İndir (JSON)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        {[
          { id: 'overview', label: '📊 Genel Bakış', count: null },
          { id: 'orders', label: '🛍️ Shopier Siparişleri', count: orders.length },
          { id: 'couples', label: '💑 Çift Siteleri', count: couples.length },
          { id: 'users', label: '👥 Kayıtlı Üyeler', count: users.length },
          { id: 'shipping', label: '📦 NFC Kargo', count: shippingOrders.length },
          { id: 'tools', label: '🛠️ Sistem Araçları', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: GENEL BAKIŞ (OVERVIEW) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Toplam Ciro</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                ₺{metrics?.totalRevenue?.toLocaleString('tr-TR') || 0}
              </div>
              <p className="text-[11px] font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Shopier Net Tahsilat
              </p>
            </div>

            {/* Orders Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Toplam Sipariş</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShoppingBag className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {metrics?.totalOrders || 0}
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-2">
                Tamamlanan: <strong className="text-purple-400">{metrics?.completedOrders || 0}</strong>
              </p>
            </div>

            {/* Couples Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Toplam Çift Sitesi</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Heart className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {metrics?.totalCouples || 0}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold mt-2">
                <span className="text-emerald-400">🟢 {metrics?.activeCouples || 0} Aktif</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400">🚫 {metrics?.passiveCouples || 0} Pasif</span>
              </div>
            </div>

            {/* Users Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Kayıtlı Üyeler</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {metrics?.totalUsers || 0}
              </div>
              <p className="text-[11px] font-semibold text-blue-400 mt-2">
                Onaylı E-Posta: {metrics?.verifiedUsers || 0}
              </p>
            </div>
          </div>

          {/* Package Distribution & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Packages Distribution */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" /> Paket Tercih Dağılımı
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">1 Yıllık Dijital (₺199)</div>
                  <div className="text-xl font-black text-white">{metrics?.packageCounts?.yearly || 0} Adet</div>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Ömür Boyu VIP (₺349)</div>
                  <div className="text-xl font-black text-purple-400">{metrics?.packageCounts?.lifetime || 0} Adet</div>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">NFC Kartlı Kutu (₺499)</div>
                  <div className="text-xl font-black text-rose-400">{metrics?.packageCounts?.nfc || 0} Adet</div>
                </div>
              </div>
            </div>

            {/* Health & Status */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" /> Servis Bağlantı Durumu
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-semibold text-slate-300">Firebase Firestore</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Bağlı
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-semibold text-slate-300">Shopier REST API</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    health?.shopier === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {health?.shopier === 'connected' ? <Check className="h-3.5 w-3.5" /> : null}
                    {health?.shopier || 'Bilinmiyor'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-semibold text-slate-300">Gmail SMTP Servisi</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-400" /> Son Gelen Siparişler
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
              >
                Tümünü Gör ({orders.length}) ➔
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Sipariş No</th>
                    <th className="p-3">Müşteri</th>
                    <th className="p-3">Tutar</th>
                    <th className="p-3">Eşleşen Çift</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-mono font-bold text-white">{o.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{o.buyerName}</div>
                        <div className="text-[11px] text-slate-400">{o.buyerEmail}</div>
                      </td>
                      <td className="p-3 font-black text-emerald-400">₺{o.total} {o.currency}</td>
                      <td className="p-3">
                        {o.matchedCoupleSlug ? (
                          <Link
                            href={`/c/${o.matchedCoupleSlug}`}
                            target="_blank"
                            className="text-rose-400 font-bold hover:underline flex items-center gap-1"
                          >
                            {o.matchedCoupleSlug} <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-500 font-medium italic">Eşleşmedi</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleManualActivate(o)}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold hover:bg-purple-500/20 transition cursor-pointer"
                        >
                          Aktivasyon
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                        Henüz Shopier siparişi bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOPIER SİPARİŞLERİ (ORDERS) */}
      {activeTab === 'orders' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-purple-400" /> Shopier Canlı Sipariş Listesi
              </h2>
              <p className="text-xs text-slate-400">
                Shopier REST API üzerinden gelen tüm siparişler ve eşleşen çift siteleri.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Sipariş no, isim veya e-posta ara..."
                value={searchOrders}
                onChange={(e) => setSearchOrders(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Sipariş No</th>
                  <th className="p-3">Müşteri</th>
                  <th className="p-3">Tutar</th>
                  <th className="p-3">Bağlı Çift Sitesi</th>
                  <th className="p-3">Durum</th>
                  <th className="p-3">Tarih</th>
                  <th className="p-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-white">{o.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{o.buyerName}</div>
                      <div className="text-[11px] text-slate-400">{o.buyerEmail}</div>
                      {o.buyerPhone && <div className="text-[10px] text-slate-500">{o.buyerPhone}</div>}
                    </td>
                    <td className="p-3 font-black text-emerald-400">₺{o.total} {o.currency}</td>
                    <td className="p-3">
                      {o.matchedCoupleSlug ? (
                        <div>
                          <Link
                            href={`/c/${o.matchedCoupleSlug}`}
                            target="_blank"
                            className="font-bold text-rose-400 hover:underline flex items-center gap-1"
                          >
                            {o.matchedCoupleSlug} <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="text-[10px] text-slate-400 font-semibold">{o.matchedCoupleNames}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Eşleşmedi
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Ödendi
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString('tr-TR') : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleManualActivate(o)}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold hover:bg-purple-500/20 transition cursor-pointer"
                          title="VIP / Aktif Yap"
                        >
                          ⚡ Aktifleştir
                        </button>
                        <button
                          onClick={() => handleResendEmail(o)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold hover:bg-rose-500/20 transition cursor-pointer"
                          title="Aktivasyon E-postası Gönder"
                        >
                          ✉️ E-posta
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      Aramaya uygun Shopier siparişi bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ÇİFT SİTELERİ (COUPLES) */}
      {activeTab === 'couples' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" /> Tüm Çift Siteleri ({couples.length})
              </h2>
              <p className="text-xs text-slate-400">
                Sistemdeki tüm web siteleri, yayın durumları ve yönetim aksiyonları.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={coupleStatusFilter}
                onChange={(e) => setCoupleStatusFilter(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">Tümü ({couples.length})</option>
                <option value="active">🟢 Yayında</option>
                <option value="passive">🚫 Pasif</option>
                <option value="paid">💎 VIP / Ödenmiş</option>
                <option value="unpaid">⏳ Ücretsiz / Bekleyen</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Slug veya isim ara..."
                  value={searchCouples}
                  onChange={(e) => setSearchCouples(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Çift / İsimler</th>
                  <th className="p-3">Slug (Site Linki)</th>
                  <th className="p-3">Paket</th>
                  <th className="p-3">PIN Kodları</th>
                  <th className="p-3">Yayın Durumu</th>
                  <th className="p-3">Oluşturulma</th>
                  <th className="p-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCouples.map((c) => (
                  <tr key={c.slug} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-extrabold text-white text-sm">
                        {c.partner1_name} & {c.partner2_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.partner1_email || c.owner_email}</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/c/${c.slug}`}
                          target="_blank"
                          className="font-bold text-rose-400 hover:underline flex items-center gap-1"
                        >
                          /c/{c.slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          c.isPaid
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {c.package_type || 'Standard'}
                      </span>
                    </td>

                    <td className="p-3 font-mono font-bold text-xs text-slate-400">
                      <span className="text-rose-400">{c.partner1_pin}</span> /{' '}
                      <span className="text-purple-400">{c.partner2_pin}</span>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                          c.is_active
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        <Power className="h-3 w-3" />
                        {c.is_active ? 'Yayında' : 'Pasif'}
                      </button>
                    </td>

                    <td className="p-3 text-slate-400 text-[11px]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : '-'}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard?slug=${c.slug}`}
                          target="_blank"
                          className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:bg-slate-700 transition"
                          title="Müşteri Paneline Giriş Yap"
                        >
                          Panel ➔
                        </Link>

                        <button
                          onClick={() => setEditingCouple({ ...c })}
                          className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition cursor-pointer"
                          title="Hızlı Düzenle"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCouple(c.slug)}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Kalıcı Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: KAYITLI KULLANICILAR (USERS) */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" /> Kayıtlı Kullanıcılar ({users.length})
              </h2>
              <p className="text-xs text-slate-400">
                Firebase Firestore üzerinde kayıtlı tüm müşteri hesapları.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="İsim, e-posta veya telefon ara..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Ad Soyad</th>
                  <th className="p-3">E-Posta</th>
                  <th className="p-3">Telefon</th>
                  <th className="p-3">Bağlı Çift Slug</th>
                  <th className="p-3">E-Posta Doğrulama</th>
                  <th className="p-3">Kayıt Tarihi</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white">{u.displayName}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 font-mono text-slate-400">{u.phone || '-'}</td>
                    <td className="p-3">
                      {u.couple_slug ? (
                        <Link
                          href={`/c/${u.couple_slug}`}
                          target="_blank"
                          className="text-rose-400 font-bold hover:underline flex items-center gap-1"
                        >
                          {u.couple_slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic">Bağlı değil</span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Check className="h-3 w-3" /> Onaylı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="p-3 text-right">
                      {!u.emailVerified && (
                        <button
                          onClick={() => handleVerifyUserEmail(u.uid)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                        >
                          Onayla
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: NFC & KARGO (SHIPPING) */}
      {activeTab === 'shipping' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-400" /> NFC Kartlı Özel Kutu Siparişleri ({shippingOrders.length})
            </h2>
            <p className="text-xs text-slate-400">
              Fiziksel NFC akıllı kart kutusu satın alan çiftlerin kargo teslimat adresleri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shippingOrders.map((c) => (
              <div key={c.slug} className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="font-extrabold text-white text-sm">
                    {c.partner1_name} & {c.partner2_name}
                  </div>
                  <Link
                    href={`/c/${c.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1"
                  >
                    {c.slug} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">
                    İletişim: <strong className="text-slate-200">{c.partner1_email || c.owner_email}</strong> ({c.whatsapp_number})
                  </div>
                  <div className="text-slate-400 mt-2">Teslimat Adresi:</div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white leading-relaxed select-all">
                    {c.shipping_address}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${c.partner1_name} & ${c.partner2_name}\n${c.whatsapp_number}\n${c.shipping_address}`);
                      showSuccess('Kargo adresi panoya kopyalandı! 📋');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> Adresi Kopyala
                  </button>

                  <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                    NFC Kutusu Hazırlanacak 📦
                  </span>
                </div>
              </div>
            ))}

            {shippingOrders.length === 0 && (
              <div className="col-span-2 p-12 text-center text-slate-500 italic bg-slate-950 rounded-2xl border border-slate-800">
                Henüz kargo teslimat adresi içeren NFC kart siparişi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SİSTEM ARAÇLARI & SAĞLIK (TOOLS) */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 1: Test Email Sender */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4 text-rose-400" /> Aktivasyon E-postası Test Aracı
              </h3>
              <p className="text-xs text-slate-400">
                Shopier sipariş tamamlandığında müşteriye gönderilen otomatik teslimat e-postasını test edin.
              </p>

              <form onSubmit={handleSendTestEmail} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Hedef E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ornek@gmail.com"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingTestEmail}
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 px-4 text-xs font-black text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sendingTestEmail ? 'Gönderiliyor...' : 'Test E-postası Gönder'}</span>
                </button>
              </form>
            </div>

            {/* Tool 2: Subdomain DNS Info */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" /> Subdomain (admin.asksite.com.tr) Kurulumu
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                `admin.asksite.com.tr` adresinin doğrudan bu panele yönlenmesi için DNS panelinizde yapmanız gereken tek ayar:
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                <div><strong>Kayıt Türü:</strong> CNAME</div>
                <div><strong>Ad (Host):</strong> admin</div>
                <div><strong>Hedef (Value):</strong> cname.vercel-dns.com (veya asksite.com.tr)</div>
              </div>

              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Next.js Middleware otomatik subdomain rewrite mimarisi hazır!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HIZLI ÇİFT DÜZENLEME (EDIT COUPLE MODAL) */}
      {editingCouple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-rose-500" /> Çift Bilgilerini Düzenle ({editingCouple.slug})
              </h3>
              <button
                onClick={() => setEditingCouple(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Partner 1 İsmi</label>
                <input
                  type="text"
                  value={editingCouple.partner1_name}
                  onChange={(e) => setEditingCouple({ ...editingCouple, partner1_name: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Partner 2 İsmi</label>
                <input
                  type="text"
                  value={editingCouple.partner2_name}
                  onChange={(e) => setEditingCouple({ ...editingCouple, partner2_name: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Partner 1 E-Posta</label>
                <input
                  type="email"
                  value={editingCouple.partner1_email}
                  onChange={(e) => setEditingCouple({ ...editingCouple, partner1_email: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Partner 2 E-Posta</label>
                <input
                  type="email"
                  value={editingCouple.partner2_email}
                  onChange={(e) => setEditingCouple({ ...editingCouple, partner2_email: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Partner 1 PIN (4 Hane)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editingCouple.partner1_pin}
                  onChange={(e) => setEditingCouple({ ...editingCouple, partner1_pin: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Partner 2 PIN (4 Hane)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editingCouple.partner2_pin}
                  onChange={(e) => setEditingCouple({ ...editingCouple, partner2_pin: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Paket Türü</label>
                <select
                  value={editingCouple.package_type}
                  onChange={(e) => setEditingCouple({ ...editingCouple, package_type: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                >
                  <option value="yearly">1 Yıllık Dijital (₺199)</option>
                  <option value="lifetime">Ömür Boyu VIP (₺349)</option>
                  <option value="nfc">NFC Kartlı Kutu (₺499)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Ödeme Durumu</label>
                <select
                  value={editingCouple.isPaid ? 'true' : 'false'}
                  onChange={(e) => setEditingCouple({ ...editingCouple, isPaid: e.target.value === 'true' })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                >
                  <option value="true">💎 Ödendi / VIP Aktif</option>
                  <option value="false">⏳ Ödenmedi / Ücretsiz</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-400 mb-1">WhatsApp Numarası</label>
                <input
                  type="text"
                  value={editingCouple.whatsapp_number || ''}
                  onChange={(e) => setEditingCouple({ ...editingCouple, whatsapp_number: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingCouple(null)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveEditCouple}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:opacity-95 transition cursor-pointer"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
