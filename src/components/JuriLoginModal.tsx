import React, { useState, useEffect } from 'react';
import { Check, Edit3, Eye, EyeOff, Gavel, KeyRound, Loader2, Lock, RotateCcw, Save, Server, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import {
  JURI_DEFAULT_PIN,
  findJuriAccountByPin,
  getActiveJuriAccounts,
  saveCustomJuriName,
  resetCustomJuriNames,
  addDynamicJuriAccount
} from '../utils/security';
import { getScriptUrl, verifikasiPinJuriKeServer } from '../utils/googleSheets';

interface JuriLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string, verifierName: string, juriId: string) => void;
}

export const JuriLoginModal: React.FC<JuriLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [juriAccounts, setJuriAccounts] = useState(() => getActiveJuriAccounts());
  const [selectedJuriId, setSelectedJuriId] = useState<string>('JURI-1');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('Dr. H. Mukotip, S.Ag., M.Pd.I');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSaveMsg, setSuccessSaveMsg] = useState<string | null>(null);
  const [isEditAllMode, setIsEditAllMode] = useState<boolean>(false);
  const [editNamesDraft, setEditNamesDraft] = useState<Record<string, string>>({});
  const [isValidatingServer, setIsValidatingServer] = useState<boolean>(false);

  // Reload accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      const active = getActiveJuriAccounts();
      setJuriAccounts(active);
      const currentAcc = active.find((a) => a.id === selectedJuriId) || active[0];
      if (currentAcc) {
        setNameInput(currentAcc.defaultName);
        setPinInput('');
      }
      setErrorMessage(null);
      setSuccessSaveMsg(null);
      setIsEditAllMode(false);
      setIsValidatingServer(false);
      setShowPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAccount = (account: typeof juriAccounts[0]) => {
    setSelectedJuriId(account.id);
    setPinInput('');
    setNameInput(account.defaultName);
    setErrorMessage(null);
    setSuccessSaveMsg(null);
  };

  const handlePinChange = (val: string) => {
    setPinInput(val);
    setErrorMessage(null);
    setSuccessSaveMsg(null);
    const matched = findJuriAccountByPin(val);
    if (matched) {
      setSelectedJuriId(matched.id);
      setNameInput(matched.defaultName);
    }
  };

  const handleSaveActiveNamePermanently = () => {
    if (!nameInput.trim()) {
      setErrorMessage('Nama verifikator tidak boleh kosong.');
      return;
    }
    saveCustomJuriName(selectedJuriId, nameInput.trim());
    const updated = getActiveJuriAccounts();
    setJuriAccounts(updated);
    setSuccessSaveMsg(`Nama ${selectedJuriId} berhasil disimpan permanen!`);
    setTimeout(() => setSuccessSaveMsg(null), 3000);
  };

  const handleOpenEditAll = () => {
    const draft: Record<string, string> = {};
    juriAccounts.forEach((acc) => {
      draft[acc.id] = acc.defaultName;
    });
    setEditNamesDraft(draft);
    setIsEditAllMode(true);
    setErrorMessage(null);
    setSuccessSaveMsg(null);
  };

  const handleSaveAllNames = () => {
    Object.entries(editNamesDraft).forEach(([id, name]) => {
      if (name.trim()) {
        saveCustomJuriName(id, name.trim());
      }
    });
    const updated = getActiveJuriAccounts();
    setJuriAccounts(updated);
    const activeOne = updated.find((a) => a.id === selectedJuriId) || updated[0];
    if (activeOne) {
      setNameInput(activeOne.defaultName);
    }
    setIsEditAllMode(false);
    setSuccessSaveMsg('Seluruh nama juri berhasil diperbarui dan tersimpan permanen!');
    setTimeout(() => setSuccessSaveMsg(null), 3500);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan seluruh nama juri ke nama default sistem?')) {
      resetCustomJuriNames();
      const updated = getActiveJuriAccounts();
      setJuriAccounts(updated);
      const activeOne = updated.find((a) => a.id === selectedJuriId) || updated[0];
      if (activeOne) {
        setNameInput(activeOne.defaultName);
      }
      setIsEditAllMode(false);
      setSuccessSaveMsg('Nama juri berhasil dikembalikan ke bawaan sistem.');
      setTimeout(() => setSuccessSaveMsg(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setErrorMessage('PIN Juri tidak boleh kosong.');
      return;
    }

    const scriptUrl = getScriptUrl();

    // 1. Jika terhubung ke server (SCRIPT_URL terisi), kirim request POST { action: "VERIFIKASI_PIN_JURI", pin: inputPin }
    if (scriptUrl && scriptUrl.trim() !== '') {
      setIsValidatingServer(true);
      setErrorMessage(null);

      try {
        const res = await verifikasiPinJuriKeServer(cleanPin);

        if (res.success && res.idJuri) {
          const finalId = res.idJuri;
          const finalName = res.labelJuri || nameInput.trim();

          // Simpan juri baru secara dinamis ke cache jika belum ada (misal JURI-6, JURI-7 dari server)
          addDynamicJuriAccount({
            id: finalId,
            pin: cleanPin,
            defaultName: finalName,
            roleTitle: `Verifikator ${finalId.replace(/\D/g, '')}`,
            isActive: true
          });
          saveCustomJuriName(finalId, finalName);
          localStorage.setItem('SIEPP_LAST_VERIFIER_NAME', finalName);
          localStorage.setItem('SIEPP_LAST_JURI_ID', finalId);

          setIsValidatingServer(false);
          onSuccess(cleanPin, finalName, finalId);
          return;
        }

        // Jika server menolak PIN dan bukan error jaringan
        if (!res.success && !res.isNetworkError) {
          // Cek fallback lokal apakah PIN ini dibuat di mode simulasi offline
          const localMatch = findJuriAccountByPin(cleanPin);
          if (localMatch) {
            saveCustomJuriName(localMatch.id, nameInput.trim());
            localStorage.setItem('SIEPP_LAST_VERIFIER_NAME', nameInput.trim());
            localStorage.setItem('SIEPP_LAST_JURI_ID', localMatch.id);
            setIsValidatingServer(false);
            onSuccess(cleanPin, nameInput.trim(), localMatch.id);
            return;
          }

          setErrorMessage(res.message || 'PIN Juri tidak valid di server Google Sheets.');
          setIsValidatingServer(false);
          return;
        }
      } catch (err: any) {
        console.warn('Verifikasi server gagal, beralih ke fallback offline:', err);
      } finally {
        setIsValidatingServer(false);
      }
    }

    // 2. Mode Simulasi Offline atau Fallback Offline: cari di dynamic juri accounts
    const matchedAccount = findJuriAccountByPin(cleanPin);
    if (matchedAccount) {
      setErrorMessage(null);
      const finalName = nameInput.trim() || matchedAccount.defaultName;
      saveCustomJuriName(matchedAccount.id, finalName);
      localStorage.setItem('SIEPP_LAST_VERIFIER_NAME', finalName);
      localStorage.setItem('SIEPP_LAST_JURI_ID', matchedAccount.id);
      onSuccess(matchedAccount.pin, finalName, matchedAccount.id);
    } else {
      setErrorMessage('PIN Juri tidak terdaftar! Gunakan PIN resmi sesuai akun yang aktif.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#021814] text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-700/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-emerald-950/90 px-2 py-0.5 rounded border border-amber-400/30">
                  Panel Keamanan
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">Autentikasi Tim Juri</h3>
              <p className="text-xs text-emerald-200/90">Panel Penilaian Verifikator Publik (Dinamis / Multi-Juri)</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          <div className="text-xs text-slate-600 bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200/80 flex items-start gap-3 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Sistem mendukung panel verifikator dinamis (tidak terbatas 5 juri). Setiap juri memiliki PIN khusus, penilaian disimpan mandiri per-juri dan otomatis dirata-ratakan secara presisi.
            </span>
          </div>

          {/* Quick Juri Account Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Pilih Akun Verifikator (Quick Select):
              </label>
              <button
                type="button"
                onClick={() => setIsEditAllMode(!isEditAllMode)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-200/70 border border-emerald-300/80 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Ubah nama-nama juri agar tersimpan permanen di aplikasi"
              >
                <Edit3 className="w-3 h-3 text-emerald-700" />
                <span>{isEditAllMode ? 'Tutup Form Edit' : 'Kelola / Ubah Nama Juri'}</span>
              </button>
            </div>

            {/* Panel Khusus: Kelola / Ubah Semua Nama Juri (Permanen) */}
            {isEditAllMode ? (
              <div className="bg-amber-50/80 border border-amber-300/90 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-in fade-in duration-150 mb-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200/90 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <Edit3 className="w-4 h-4 text-amber-700" />
                    <span>Ubah Nama Verifikator (Tersimpan Permanen)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[10px] font-bold text-slate-500 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Kembalikan ke nama default sistem"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset Default</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Ketik nama pejabat / verifikator baru di bawah ini. Perubahan akan tersimpan permanen di memori browser dan langsung tampil di form penilaian &amp; rapor.
                </p>

                <div className="space-y-2">
                  {juriAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-xl w-18 text-center shrink-0 shadow-2xs">
                        {acc.id}
                      </span>
                      <input
                        type="text"
                        value={editNamesDraft[acc.id] ?? acc.defaultName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditNamesDraft((prev) => ({ ...prev, [acc.id]: val }));
                        }}
                        placeholder={`Nama untuk ${acc.id}...`}
                        className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2.5 border-t border-amber-200/90">
                  <button
                    type="button"
                    onClick={() => setIsEditAllMode(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllNames}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Permanen Semua</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {juriAccounts.map((acc) => {
                  const isSelected = selectedJuriId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-emerald-800 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {acc.id}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{acc.roleTitle}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-1 font-medium">
                          {acc.defaultName}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Success Notification Alert */}
          {successSaveMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successSaveMsg}</span>
            </div>
          )}

          {/* Verifier Name Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Nama Verifikator Penilai ({selectedJuriId}):
              </label>
              <button
                type="button"
                onClick={handleSaveActiveNamePermanently}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                title="Simpan nama ini permanen untuk akun juri yang sedang dipilih"
              >
                <Save className="w-3 h-3" />
                <span>Simpan Permanen untuk {selectedJuriId}</span>
              </button>
            </div>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setErrorMessage(null);
                  setSuccessSaveMsg(null);
                }}
                placeholder="Nama lengkap verifikator..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all shadow-inner"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              *Nama yang Anda ketik akan otomatis disimpan permanen pada akun <strong>{selectedJuriId}</strong> saat Anda masuk.
            </p>
          </div>

          {/* PIN Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
              PIN Akses Juri:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pinInput}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="Masukkan PIN rahasia Juri..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 uppercase tracking-wider focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              *Masukkan PIN otentikasi verifikator yang telah diterbitkan secara resmi oleh Administrator.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isValidatingServer}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isValidatingServer}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl text-xs font-bold transition-all duration-200 shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isValidatingServer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi PIN ke Server...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Masuk sebagai {selectedJuriId}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
