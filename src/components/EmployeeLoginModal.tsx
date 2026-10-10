import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Gavel,
  KeyRound,
  LayoutDashboard,
  Lock,
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import {
  findJuriAccountByPin,
  getExpectedSatkerPin,
  validateAdminPassword,
  validateSatkerPin
} from '../utils/security';

type LoginTab = 'SATKER' | 'JURI' | 'ADMIN';

interface EmployeeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSatker: (unitId: string, pin: string) => void;
  onLoginJuri: (pin: string, verifierName: string, juriId?: string) => void;
  onLoginAdmin: () => void;
}

export const EmployeeLoginModal: React.FC<EmployeeLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSatker,
  onLoginJuri,
  onLoginAdmin
}) => {
  const [activeTab, setActiveTab] = useState<LoginTab>('SATKER');

  // Satker State
  const [selectedUnitId, setSelectedUnitId] = useState<string>(DAFTAR_UNIT_KERJA[0].id);
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');
  const [satkerPin, setSatkerPin] = useState<string>('');
  const [satkerError, setSatkerError] = useState<string | null>(null);

  // Filter Satker berdasarkan pencarian nama
  const filteredUnits = useMemo(() => {
    const q = unitSearchQuery.trim().toLowerCase();
    if (!q) return DAFTAR_UNIT_KERJA;
    return DAFTAR_UNIT_KERJA.filter(
      (u) =>
        u.nama.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.kategori.toLowerCase().includes(q)
    );
  }, [unitSearchQuery]);

  const filteredKua = useMemo(() => filteredUnits.filter((u) => u.kategori === 'KUA'), [filteredUnits]);
  const filteredMin = useMemo(() => filteredUnits.filter((u) => u.kategori === 'MIN'), [filteredUnits]);
  const filteredMtsnMan = useMemo(() => filteredUnits.filter((u) => u.kategori === 'MTsN & MAN'), [filteredUnits]);

  // Juri State
  const [juriPin, setJuriPin] = useState<string>('');
  const [showJuriPin, setShowJuriPin] = useState<boolean>(false);
  const [juriError, setJuriError] = useState<string | null>(null);

  // Admin State
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUnit = DAFTAR_UNIT_KERJA.find((u) => u.id === selectedUnitId) || DAFTAR_UNIT_KERJA[0];
  const expectedPin = getExpectedSatkerPin(selectedUnitId);

  // Handlers
  const handleSatkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSatkerError(null);

    if (!satkerPin.trim()) {
      setSatkerError('Silakan masukkan PIN Satuan Kerja.');
      return;
    }

    if (!validateSatkerPin(selectedUnitId, satkerPin)) {
      setSatkerError(`PIN tidak sesuai! Format PIN untuk ${currentUnit.nama} adalah ${expectedPin}.`);
      return;
    }

    onLoginSatker(selectedUnitId, satkerPin.trim().toUpperCase());
    onClose();
  };

  const handleJuriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJuriError(null);

    if (!juriPin.trim()) {
      setJuriError('Silakan masukkan PIN Tim Juri.');
      return;
    }

    const matched = findJuriAccountByPin(juriPin);
    if (!matched) {
      setJuriError('PIN Juri tidak terdaftar atau tidak valid. Silakan periksa kembali.');
      return;
    }

    onLoginJuri(juriPin.trim().toUpperCase(), matched.defaultName, matched.id);
    onClose();
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminPassword.trim()) {
      setAdminError('Silakan masukkan password Administrator.');
      return;
    }

    if (!validateAdminPassword(adminPassword)) {
      setAdminError('Password Administrator salah. Silakan coba kembali.');
      return;
    }

    onLoginAdmin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#022c22] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Lock className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                Portal Internal Aparatur
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                Login Unit Kerja/Evaluator
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-200/90 mt-2">
            Pilih peran Anda dan masukkan PIN/kredensial resmi untuk mengakses sistem evaluasi internal.
          </p>

          {/* 3 Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-emerald-950/80 rounded-2xl mt-5 border border-emerald-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('SATKER');
                setSatkerError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'SATKER'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Unit Kerja</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('JURI');
                setJuriError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'JURI'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Gavel className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tim Juri</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setAdminError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Admin</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* TAB 1: SATKER LOGIN */}
          {activeTab === 'SATKER' && (
            <form onSubmit={handleSatkerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Pilih Satuan Kerja (KUA / Madrasah)
                </label>

                {/* Fitur Pencarian Nama Satuan Kerja */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={unitSearchQuery}
                    onChange={(e) => {
                      const q = e.target.value;
                      setUnitSearchQuery(q);
                      setSatkerError(null);
                      if (q.trim()) {
                        const match = DAFTAR_UNIT_KERJA.find(
                          (u) =>
                            u.nama.toLowerCase().includes(q.toLowerCase()) ||
                            u.id.toLowerCase().includes(q.toLowerCase())
                        );
                        if (match) {
                          setSelectedUnitId(match.id);
                        }
                      }
                    }}
                    placeholder="Cari nama KUA atau Madrasah (cth: Playen, MIN, Patuk)..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all shadow-inner"
                  />
                  {unitSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setUnitSearchQuery('');
                        setSatkerError(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Pilihan Satker (Tanpa Nama Kecamatan) */}
                <select
                  value={selectedUnitId}
                  onChange={(e) => {
                    setSelectedUnitId(e.target.value);
                    setSatkerError(null);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs cursor-pointer"
                >
                  {filteredKua.length > 0 && (
                    <optgroup label="KUA (Kantor Urusan Agama)">
                      {filteredKua.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {filteredMin.length > 0 && (
                    <optgroup label="MIN (Madrasah Ibtidaiyah Negeri)">
                      {filteredMin.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {filteredMtsnMan.length > 0 && (
                    <optgroup label="MTsN & MAN (Madrasah Menengah Negeri)">
                      {filteredMtsnMan.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {filteredUnits.length === 0 && (
                    <option value="" disabled>
                      -- Satuan kerja &quot;{unitSearchQuery}&quot; tidak ditemukan --
                    </option>
                  )}
                </select>

                {unitSearchQuery.trim() && (
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    {filteredUnits.length > 0 ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Ditemukan {filteredUnits.length} satuan kerja cocok
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        ✕ Tidak ditemukan satuan kerja dengan kata kunci &quot;{unitSearchQuery}&quot;
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    PIN Keamanan Satker
                  </label>
                  <button
                    type="button"
                    onClick={() => setSatkerPin(expectedPin)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer hover:underline"
                  >
                    Gunakan Default ({expectedPin})
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={satkerPin}
                    onChange={(e) => {
                      setSatkerPin(e.target.value.toUpperCase());
                      setSatkerError(null);
                    }}
                    placeholder={`Masukkan PIN (Format: ${expectedPin})`}
                    className="w-full p-3 pl-10 rounded-xl border border-slate-300 text-sm font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Format standar: <span className="font-mono font-bold text-emerald-800">[ID]-GK</span> (Contoh: {expectedPin})
                </p>
              </div>

              {satkerError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{satkerError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>Masuk ke Formulir Evaluasi Satker</span>
              </button>
            </form>
          )}

          {/* TAB 2: JURI LOGIN */}
          {activeTab === 'JURI' && (
            <form onSubmit={handleJuriSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  PIN Tim Verifikator Juri
                </label>
                <div className="relative">
                  <input
                    type={showJuriPin ? 'text' : 'password'}
                    value={juriPin}
                    onChange={(e) => {
                      setJuriPin(e.target.value.toUpperCase());
                      setJuriError(null);
                    }}
                    placeholder="Masukkan PIN Tim Juri..."
                    className="w-full p-3 pl-10 pr-10 rounded-xl border border-slate-300 text-sm font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowJuriPin(!showJuriPin)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showJuriPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  >
                    {showJuriPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Masukkan PIN rahasia tim verifikator yang telah ditentukan oleh Administrator.
                </p>
              </div>

              {juriError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{juriError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <Gavel className="w-4 h-4 text-amber-300" />
                <span>Masuk ke Mode Penilaian Juri</span>
              </button>
            </form>
          )}

          {/* TAB 3: ADMIN LOGIN */}
          {activeTab === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password Administrator Sistem
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError(null);
                    }}
                    placeholder="Masukkan password administrator..."
                    className="w-full p-3 pl-10 pr-10 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Akses khusus Administrator SI-EPP Kantor Kemenag Kabupaten Gunungkidul.
                </p>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-300" />
                <span>Masuk ke Dashboard Eksekutif &amp; Admin</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistem Proteksi Otentikasi Terenkripsi</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-800 hover:underline cursor-pointer"
          >
            Kembali ke Portal Publik
          </button>
        </div>
      </div>
    </div>
  );
};
