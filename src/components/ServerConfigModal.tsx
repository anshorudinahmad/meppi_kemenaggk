import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Check,
  CheckCircle2,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  Percent,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { ASPEK_LIST } from '../data/instruments';
import { KategoriUnit } from '../types';
import {
  DEFAULT_SCRIPT_URL,
  getScriptUrl,
  muatDataDariServer,
  setScriptUrl,
  simpanPengaturanAspekKeServer
} from '../utils/googleSheets';
import {
  ADMIN_PIN,
  JuriAccount,
  addDynamicJuriAccount,
  deleteDynamicJuriAccount,
  getStoredJuriAccounts,
  resetJuriAccountsToDefault,
  saveStoredJuriAccounts,
  toggleDynamicJuriActive,
  updateDynamicJuriAccount
} from '../utils/security';
import {
  CategoryAspekConfig,
  KATEGORI_SATKER_LIST,
  DEFAULT_ASPEK_CONFIG,
  getStoredCategoryAspekConfig,
  saveStoredCategoryAspekConfig,
  resetCategoryAspekConfigToDefault,
  getTotalBobotAktif
} from '../utils/aspekConfig';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: () => void;
  initialTab?: 'server' | 'juri' | 'aspek';
  onRecalculateMultiJuri?: () => void;
  onJuriAccountsUpdated?: () => void;
  onAspekConfigUpdated?: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  isOpen,
  onClose,
  onUrlUpdated,
  initialTab = 'server',
  onRecalculateMultiJuri,
  onJuriAccountsUpdated,
  onAspekConfigUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'server' | 'juri' | 'aspek'>(initialTab);
  const [urlInput, setUrlInput] = useState<string>(getScriptUrl());
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Juri Management States
  const [juriList, setJuriList] = useState<JuriAccount[]>(() => getStoredJuriAccounts());
  const [isAddingJuri, setIsAddingJuri] = useState<boolean>(false);
  const [newJuriId, setNewJuriId] = useState<string>('');
  const [newJuriName, setNewJuriName] = useState<string>('');
  const [newJuriPin, setNewJuriPin] = useState<string>('');
  const [newJuriRole, setNewJuriRole] = useState<string>('');
  const [editingJuriId, setEditingJuriId] = useState<string | null>(null);
  const [revealedPinId, setRevealedPinId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; pin: string; role: string }>({
    name: '',
    pin: '',
    role: ''
  });
  const [juriActionToast, setJuriActionToast] = useState<string | null>(null);

  // Aspect Management States (Spesifik per Kategori: KUA, MIN, MTsN & MAN)
  const [categoryAspekConfig, setCategoryAspekConfig] = useState<CategoryAspekConfig>(() => getStoredCategoryAspekConfig());
  const [selectedAspekCategory, setSelectedAspekCategory] = useState<KategoriUnit>('KUA');
  const [isSavingAspek, setIsSavingAspek] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setUrlInput(getScriptUrl());
      const loaded = getStoredJuriAccounts();
      setJuriList(loaded);
      setIsAddingJuri(false);
      setEditingJuriId(null);
      setRevealedPinId(null);
      setTestResult({ status: 'idle', message: '' });
      setCategoryAspekConfig(getStoredCategoryAspekConfig());

      // Suggest next juri ID
      const nextNum = loaded.length + 1;
      setNewJuriId(`JURI-${nextNum}`);
      setNewJuriPin('');
      setNewJuriRole(`Verifikator ${nextNum}`);
      setNewJuriName('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setJuriActionToast(msg);
    setTimeout(() => setJuriActionToast(null), 3500);
  };

  // Aspect Config Handlers for currently selected category
  const currentCatConfig = categoryAspekConfig[selectedAspekCategory] || DEFAULT_ASPEK_CONFIG;
  const activeAspekCount = Object.values(currentCatConfig).filter(Boolean).length;
  const currentTotalBobot = getTotalBobotAktif(currentCatConfig);

  const handleToggleAspek = (aspekId: number) => {
    const isCurrentlyActive = currentCatConfig[aspekId] !== false;
    // Minimal 1 aspek harus tetap aktif per kategori
    if (isCurrentlyActive && activeAspekCount <= 1) {
      showToast(`Peringatan: Minimal 1 aspek penilaian harus tetap aktif untuk kategori ${selectedAspekCategory}!`);
      return;
    }

    const updatedCat = {
      ...currentCatConfig,
      [aspekId]: !isCurrentlyActive
    };

    const updatedAll: CategoryAspekConfig = {
      ...categoryAspekConfig,
      [selectedAspekCategory]: updatedCat
    };

    setCategoryAspekConfig(updatedAll);
    saveStoredCategoryAspekConfig(updatedAll);
    onAspekConfigUpdated?.();
    onRecalculateMultiJuri?.();
    const asp = ASPEK_LIST.find((a) => a.id === aspekId);
    showToast(
      `[${selectedAspekCategory}] Aspek ${aspekId} (${asp?.nama || ''}) berhasil ${!isCurrentlyActive ? 'Diaktifkan' : 'Dinonaktifkan'}!`
    );
  };

  const handleActivateAllForCurrentCategory = () => {
    const fresh = { ...DEFAULT_ASPEK_CONFIG };
    const updatedAll: CategoryAspekConfig = {
      ...categoryAspekConfig,
      [selectedAspekCategory]: fresh
    };
    setCategoryAspekConfig(updatedAll);
    saveStoredCategoryAspekConfig(updatedAll);
    onAspekConfigUpdated?.();
    onRecalculateMultiJuri?.();
    showToast(`Seluruh 8 aspek untuk kategori ${selectedAspekCategory} diaktifkan kembali (100%).`);
  };

  const handleDeactivateVideoForCurrentCategory = () => {
    const updatedCat = {
      ...currentCatConfig,
      8: false
    };
    const updatedAll: CategoryAspekConfig = {
      ...categoryAspekConfig,
      [selectedAspekCategory]: updatedCat
    };
    setCategoryAspekConfig(updatedAll);
    saveStoredCategoryAspekConfig(updatedAll);
    onAspekConfigUpdated?.();
    onRecalculateMultiJuri?.();
    showToast(`[${selectedAspekCategory}] Aspek 8 (Video Praktik) dinonaktifkan (Total Bobot Aktif: 80%).`);
  };

  const handleActivateAllCategories = () => {
    const fresh = resetCategoryAspekConfigToDefault();
    setCategoryAspekConfig(fresh);
    onAspekConfigUpdated?.();
    onRecalculateMultiJuri?.();
    showToast('Seluruh aspek pada semua kategori (KUA, MIN, MTsN & MAN) berhasil diaktifkan kembali (100%).');
  };

  const handleSaveAspekToServer = async () => {
    setIsSavingAspek(true);
    showToast('Menyimpan & menyinkronkan pengaturan aspek per kategori ke Google Sheets...');
    try {
      // 1. Simpan ke localStorage terlebih dahulu untuk update real-time lokal
      saveStoredCategoryAspekConfig(categoryAspekConfig);

      // 2. Kirim payload POST nested ke server Google Apps Script:
      // action: "SIMPAN_PENGATURAN_ASPEK", pinAdmin: "ADMIN-GK26", dataAspek: { "KUA": { ... }, "MIN": { ... }, "MTsN & MAN": { ... } }
      const res = await simpanPengaturanAspekKeServer(categoryAspekConfig, ADMIN_PIN);

      if (res.success) {
        showToast('Pengaturan aspek per kategori berhasil disimpan & disinkronkan ke server Google Sheets!');
      } else {
        showToast(`Pengaturan disimpan secara lokal. (${res.message || 'Server Google Sheets belum merespon'})`);
      }

      onAspekConfigUpdated?.();
      onRecalculateMultiJuri?.();
    } catch (err: any) {
      showToast(`Pengaturan aspek disimpan di basis data lokal. (${err?.message || 'Offline'})`);
      onAspekConfigUpdated?.();
      onRecalculateMultiJuri?.();
    } finally {
      setIsSavingAspek(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Menghubungi endpoint Web App...' });

    const previous = getScriptUrl();
    setScriptUrl(urlInput);

    const res = await muatDataDariServer();
    if (res.success) {
      const satkerCount = res.data ? Object.keys(res.data).length : 0;
      setTestResult({
        status: 'success',
        message: `Koneksi Berhasil! Diterima ${satkerCount} data satuan kerja dari server Google Sheets.`
      });
      // Refresh juri list in case server sent daftarJuriAktif
      setJuriList(getStoredJuriAccounts());
    } else {
      setTestResult({
        status: 'error',
        message: res.message || 'Gagal terhubung ke endpoint.'
      });
      setScriptUrl(previous);
    }
    setIsTesting(false);
  };

  const handleSaveUrl = () => {
    setScriptUrl(urlInput);
    onUrlUpdated();
    onClose();
  };

  const handleResetDefaultUrl = () => {
    setUrlInput(DEFAULT_SCRIPT_URL);
    setScriptUrl(DEFAULT_SCRIPT_URL);
    setTestResult({
      status: 'idle',
      message: 'URL telah diatur ulang ke endpoint resmi default.'
    });
  };

  // Add Juri
  const handleAddNewJuri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJuriId.trim() || !newJuriName.trim() || !newJuriPin.trim()) {
      showToast('Peringatan: Mohon lengkapi ID, Nama, dan PIN Juri!');
      return;
    }

    const cleanId = newJuriId.trim().toUpperCase();
    const account: JuriAccount = {
      id: cleanId,
      defaultName: newJuriName.trim(),
      pin: newJuriPin.trim().toUpperCase(),
      roleTitle: newJuriRole.trim() || `Verifikator ${cleanId.replace(/\D/g, '')}`,
      isActive: true
    };

    const updated = addDynamicJuriAccount(account);
    setJuriList(updated);
    setIsAddingJuri(false);
    showToast(`Akun [${account.id}] ${account.defaultName} berhasil ditambahkan!`);

    // Prepare for next
    const nextNum = updated.length + 1;
    setNewJuriId(`JURI-${nextNum}`);
    setNewJuriPin(`JURI${nextNum}-GK26`);
    setNewJuriRole(`Verifikator ${nextNum}`);
    setNewJuriName('');

    onJuriAccountsUpdated?.();
  };

  // Toggle Active
  const handleToggleActive = (id: string) => {
    const updated = toggleDynamicJuriActive(id);
    setJuriList(updated);
    const target = updated.find((a) => a.id === id);
    showToast(`Status ${id} diubah menjadi: ${target?.isActive ? 'Aktif' : 'Nonaktif'}.`);
    onJuriAccountsUpdated?.();
  };

  // Start Edit
  const handleStartEdit = (account: JuriAccount) => {
    setEditingJuriId(account.id);
    setEditForm({
      name: account.defaultName,
      pin: account.pin,
      role: account.roleTitle
    });
  };

  // Save Edit
  const handleSaveEdit = (id: string) => {
    if (!editForm.name.trim() || !editForm.pin.trim()) {
      showToast('Peringatan: Nama dan PIN tidak boleh kosong!');
      return;
    }
    const updated = updateDynamicJuriAccount({
      id,
      defaultName: editForm.name.trim(),
      pin: editForm.pin.trim().toUpperCase(),
      roleTitle: editForm.role.trim() || `Verifikator ${id.replace(/\D/g, '')}`,
      isActive: true
    });
    setJuriList(updated);
    setEditingJuriId(null);
    showToast(`Data akun ${id} berhasil diperbarui!`);
    onJuriAccountsUpdated?.();
  };

  // Delete Juri
  const handleDeleteJuri = (id: string) => {
    if (confirm(`Hapus akun verifikator ${id} dari sistem? Nilai juri yang tersimpan di satker akan otomatis dihitung ulang.`)) {
      const updated = deleteDynamicJuriAccount(id);
      setJuriList(updated);
      showToast(`Akun ${id} telah dihapus dari sistem.`);
      onJuriAccountsUpdated?.();
    }
  };

  // Reset to default 5 juries
  const handleResetJuriDefault = () => {
    if (confirm('Kembalikan daftar tim juri ke susunan 5 Juri default Kemenag?')) {
      const updated = resetJuriAccountsToDefault();
      setJuriList(updated);
      showToast('Susunan akun juri dikembalikan ke 5 Juri default.');
      onJuriAccountsUpdated?.();
    }
  };

  // Recalculate Multi Juri
  const handleTriggerRecalculate = () => {
    if (onRecalculateMultiJuri) {
      onRecalculateMultiJuri();
      showToast('Seluruh rata-rata nilai juri berhasil dihitung ulang secara dinamis!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#021814] text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300">
              {activeTab === 'server' ? (
                <Database className="w-5 h-5" />
              ) : activeTab === 'juri' ? (
                <Users className="w-5 h-5" />
              ) : (
                <Sliders className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-emerald-950/90 px-2 py-0.5 rounded border border-amber-400/30">
                  Panel Administrator
                </span>
                <span className="text-[10px] font-semibold text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                  Sesi Terverifikasi
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {activeTab === 'aspek'
                  ? 'Pengaturan Aspek Penilaian Aktif'
                  : 'Pengaturan Sistem & Tim Juri Dinamis'}
              </h3>
              <p className="text-xs text-emerald-200/90">
                {activeTab === 'server'
                  ? 'Konfigurasi Endpoint API Web App Google Apps Script'
                  : activeTab === 'juri'
                  ? 'Kelola Tim Juri Verifikator (Dinamis / Tak Terbatas)'
                  : 'Konfigurasi Aktif/Nonaktif 8 Aspek dengan Redistribusi Bobot Proporsional'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 px-6 pt-3 border-b border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('server')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-t border-x transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'server'
                ? 'bg-white text-emerald-900 border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Endpoint Server API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('juri')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-t border-x transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap ${
              activeTab === 'juri'
                ? 'bg-white text-emerald-900 border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kelola Tim Juri Dinamis</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-emerald-100 text-emerald-800 rounded-full font-bold">
              {juriList.length} Juri
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aspek')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-t border-x transition-all flex items-center gap-2 cursor-pointer relative whitespace-nowrap ${
              activeTab === 'aspek'
                ? 'bg-white text-emerald-900 border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pengaturan Aspek Aktif</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full font-bold ${
                activeAspekCount === 8
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {activeAspekCount}/8 Aktif ({currentTotalBobot}%)
            </span>
          </button>
        </div>

        {/* Action Toast Alert */}
        {juriActionToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-bold text-emerald-900 flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{juriActionToast}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
          {activeTab === 'server' ? (
            /* TAB 1: SERVER CONFIG */
            <>
              <div>
                <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                  URL Endpoint Web App Google Apps Script:
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setTestResult({ status: 'idle', message: '' });
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  *Pastikan Web App di-deploy dengan akses: <em>&quot;Execute as: Me&quot;</em> dan <em>&quot;Who has access: Anyone&quot;</em>.
                </p>
              </div>

              {testResult.message && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                    testResult.status === 'success'
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-2xs'
                      : testResult.status === 'error'
                      ? 'bg-rose-50 text-rose-950 border-rose-300 shadow-2xs'
                      : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                  }`}
                >
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : testResult.status === 'error' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed font-medium">{testResult.message}</span>
                </div>
              )}

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-700" />
                  <span>Dukungan Juri Dinamis dari Server:</span>
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    Saat <strong>GET</strong> data dipanggil, properti <code>result.daftarJuriAktif</code> yang dikirim oleh Google Sheets otomatis disinkronkan ke aplikasi tanpa perlu edit kode HTML.
                  </li>
                  <li>
                    Saat login verifikator, aplikasi mengirim request POST <code>&#123; action: &quot;VERIFIKASI_PIN_JURI&quot;, pin: ... &#125;</code> untuk memvalidasi identitas JURI-6, JURI-7, dst. secara live.
                  </li>
                  <li>
                    Saat nama profil juri diubah, aplikasi mengirim request POST <code>&#123; action: &quot;UPDATE_NAMA_JURI&quot;, pin: ..., namaBaru: ... &#125;</code> untuk menimpa sel nama juri di Google Sheets secara permanen.
                  </li>
                </ul>
              </div>
            </>
          ) : activeTab === 'juri' ? (
            /* TAB 2: JURI MANAGEMENT (DINAMIS / SIMULASI OFFLINE) */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Daftar Tim Juri Verifikator (Dinamis)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Anda dapat menambah (misal JURI-6, JURI-7), mengubah, atau menghapus juri. Rata-rata nilai pada satker akan otomatis dihitung ulang secara dinamis.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTriggerRecalculate}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Hitung ulang rata-rata nilai dari seluruh entri juri yang ada"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Hitung Ulang Nilai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingJuri(!isAddingJuri)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingJuri ? 'Tutup Form' : 'Tambah Juri'}</span>
                  </button>
                </div>
              </div>

              {/* Form Tambah Juri Baru */}
              {isAddingJuri && (
                <form onSubmit={handleAddNewJuri} className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-amber-950 flex items-center gap-2 text-xs">
                      <Plus className="w-4 h-4 text-amber-700" />
                      <span>Form Tambah Verifikator Baru</span>
                    </h5>
                    <span className="text-[10px] text-amber-800 font-mono">Dukungan Tak Terbatas</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">ID Akun Juri:</label>
                      <input
                        type="text"
                        required
                        value={newJuriId}
                        onChange={(e) => setNewJuriId(e.target.value.toUpperCase())}
                        placeholder="Contoh: JURI-6"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">PIN Unik Login:</label>
                      <input
                        type="text"
                        required
                        value={newJuriPin}
                        onChange={(e) => setNewJuriPin(e.target.value.toUpperCase())}
                        placeholder="Masukkan PIN baru..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap &amp; Gelar:</label>
                      <input
                        type="text"
                        required
                        value={newJuriName}
                        onChange={(e) => setNewJuriName(e.target.value)}
                        placeholder="Contoh: Drs. H. Nama Juri, M.Pd"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Jabatan / Role Label:</label>
                      <input
                        type="text"
                        value={newJuriRole}
                        onChange={(e) => setNewJuriRole(e.target.value)}
                        placeholder="Contoh: Verifikator 6"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingJuri(false)}
                      className="px-3.5 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan &amp; Tambahkan Juri</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Daftar Juri Cards */}
              <div className="space-y-2.5">
                {juriList.map((acc, index) => {
                  const isEditing = editingJuriId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                        acc.isActive === false
                          ? 'bg-slate-100/80 border-slate-300 opacity-60'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      {isEditing ? (
                        /* Edit Row Mode */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                            <span className="font-bold text-xs font-mono text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Edit {acc.id}
                            </span>
                            <span className="text-[10px] text-slate-500">Edit Nama, PIN, &amp; Role</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Nama Juri:</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-0.5">PIN Akses:</label>
                              <input
                                type="text"
                                value={editForm.pin}
                                onChange={(e) => setEditForm({ ...editForm, pin: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Role / Label:</label>
                              <input
                                type="text"
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingJuriId(null)}
                              className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(acc.id)}
                              className="px-4 py-1 bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Simpan Perubahan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal View Mode */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-amber-300/40">
                              {acc.id.replace('JURI-', 'J')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{acc.defaultName}</span>
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                  {acc.id}
                                </span>
                                {acc.isActive === false && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                    Nonaktif
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span>{acc.roleTitle}</span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <span>PIN: {revealedPinId === acc.id ? acc.pin : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedPinId(revealedPinId === acc.id ? null : acc.id)}
                                    className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer ml-0.5"
                                    title={revealedPinId === acc.id ? "Sembunyikan PIN" : "Lihat PIN"}
                                  >
                                    {revealedPinId === acc.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(acc.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                                acc.isActive !== false
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                              title={acc.isActive !== false ? 'Nonaktifkan juri ini' : 'Aktifkan juri ini'}
                            >
                              {acc.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEdit(acc)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Edit nama atau PIN juri"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteJuri(acc.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Hapus juri dari sistem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* TAB 3: PENGATURAN ASPEK AKTIF (SPESIFIK PER KATEGORI) */
            <div className="space-y-5">
              {/* Category Selector Tabs */}
              <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Pilih Kategori Satker:
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Atur aspek penilaian mandiri &amp; juri khusus per kategori
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {KATEGORI_SATKER_LIST.map((kat) => {
                    const isSelected = selectedAspekCategory === kat;
                    const catCfg = categoryAspekConfig[kat] || DEFAULT_ASPEK_CONFIG;
                    const countActive = Object.values(catCfg).filter(Boolean).length;
                    const bobot = getTotalBobotAktif(catCfg);

                    return (
                      <button
                        key={kat}
                        type="button"
                        onClick={() => setSelectedAspekCategory(kat)}
                        className={`p-2.5 rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-md shadow-emerald-950/20'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black tracking-wide">{kat}</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                              isSelected
                                ? 'bg-emerald-950/80 text-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {countActive}/8 Aspek
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              isSelected ? 'text-emerald-100' : 'text-emerald-700'
                            }`}
                          >
                            {bobot}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metric Overview Cards for Selected Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Aspek Aktif ({selectedAspekCategory})
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {selectedAspekCategory}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-800">
                      {activeAspekCount}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ 8 Aspek</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {activeAspekCount === 8 ? 'Semua aspek aktif untuk kategori ini' : `${8 - activeAspekCount} aspek dinonaktifkan untuk ${selectedAspekCategory}`}
                  </span>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Total Bobot Aktif
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-900">
                      {currentTotalBobot}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">dari 100%</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 mt-1">
                    Basis pembagi nilai khusus {selectedAspekCategory}
                  </span>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    Rumus Nilai Akhir ({selectedAspekCategory})
                  </span>
                  <div className="font-mono text-xs font-bold text-amber-950 mt-1 bg-white/80 p-1.5 rounded-lg border border-amber-200">
                    (Skor / {currentTotalBobot}) × 100
                  </div>
                  <span className="text-[10px] text-amber-800 mt-1">
                    Normalisasi nilai mandiri &amp; juri
                  </span>
                </div>
              </div>

              {/* Informative Guidance */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Pengaturan aspek kini <strong>Spesifik per Kategori Satker</strong>. Misalnya Aspek 8 (Video Praktik) dapat dinonaktifkan khusus untuk <strong>KUA</strong> atau <strong>MIN</strong>, namun tetap aktif untuk <strong>MTsN &amp; MAN</strong>. Nilai akhir satker dan lembar juri akan otomatis beradaptasi saat memilih satker.
                  </p>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar 8 Aspek untuk [{selectedAspekCategory}]:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleActivateAllForCurrentCategory}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Aktifkan Semua [{selectedAspekCategory}]
                  </button>
                  <button
                    type="button"
                    onClick={handleDeactivateVideoForCurrentCategory}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                  >
                    Nonaktifkan Aspek 8 Video [{selectedAspekCategory}]
                  </button>
                </div>
              </div>

              {/* List of Aspects */}
              <div className="space-y-2.5">
                {ASPEK_LIST.map((aspek) => {
                  const isActive = currentCatConfig[aspek.id] !== false;

                  return (
                    <div
                      key={aspek.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                          : 'bg-slate-100/80 border-slate-300 opacity-70'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${
                            isActive
                              ? 'bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 border-amber-300/40'
                              : 'bg-slate-300 text-slate-600 border-slate-400'
                          }`}
                        >
                          {aspek.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-bold text-xs ${
                                isActive ? 'text-slate-900' : 'text-slate-500 line-through'
                              }`}
                            >
                              Aspek {aspek.id}: {aspek.nama}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-md border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-200 text-slate-500 border-slate-300'
                              }`}
                            >
                              Bobot: {aspek.bobot}%
                            </span>
                            {aspek.id === 8 && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-bold">
                                Video Praktik
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {aspek.keterangan}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAspek(aspek.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                            isActive
                              ? 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-emerald-950/20'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                          }`}
                        >
                          <Power className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                          <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          {activeTab === 'server' ? (
            <>
              <button
                type="button"
                onClick={handleResetDefaultUrl}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembalikan URL Default</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Uji Koneksi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveUrl}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl text-xs font-bold transition-all duration-200 shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
                >
                  Simpan &amp; Terapkan
                </button>
              </div>
            </>
          ) : activeTab === 'juri' ? (
            <>
              <button
                type="button"
                onClick={handleResetJuriDefault}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke 5 Juri Default</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl text-xs font-bold transition-all duration-200 shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
              >
                Selesai Kelola Juri
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleActivateAllCategories}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Kategori ke 100% Aktif</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  disabled={isSavingAspek}
                  onClick={handleSaveAspekToServer}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl text-xs font-bold transition-all duration-200 shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
                >
                  {isSavingAspek ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Menyimpan ke Server...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-amber-300" />
                      <span>Simpan Pengaturan Aspek</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

