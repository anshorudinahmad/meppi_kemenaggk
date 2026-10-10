import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Building2,
  ChevronDown,
  Database,
  Gavel,
  LayoutDashboard,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Globe
} from 'lucide-react';

export type UserRole = 'PUBLIC' | 'UNIT' | 'JURI' | 'DASHBOARD';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onResetData: () => void;
  onOpenServerConfig: () => void;
  onOpenJuriManager?: () => void;
  onOpenAspekConfig?: () => void;
  onSyncData: () => void;
  isSyncing?: boolean;
  isJuriAuthenticated?: boolean;
  isAdminAuthenticated?: boolean;
  onRequireAdminAuth: (action: 'OPTIONS' | 'SERVER_CONFIG' | 'JURI_MANAGER' | 'ASPEK_CONFIG') => void;
  onLogoutAdmin: () => void;
  forceOpenOptionsNonce?: number;
  totalSatker?: number;
  submittedCount?: number;
  verifiedCount?: number;
  onOpenPanduanModal?: () => void;
  onOpenEmployeeLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onResetData,
  onOpenServerConfig,
  onOpenJuriManager,
  onOpenAspekConfig,
  onSyncData,
  isSyncing = false,
  isJuriAuthenticated = false,
  isAdminAuthenticated = false,
  onRequireAdminAuth,
  onLogoutAdmin,
  forceOpenOptionsNonce = 0,
  onOpenPanduanModal,
  onOpenEmployeeLogin
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Automatically open options dropdown if admin just authenticated
  useEffect(() => {
    if (forceOpenOptionsNonce > 0 && isAdminAuthenticated) {
      setIsOptionsOpen(true);
    }
  }, [forceOpenOptionsNonce, isAdminAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionsClick = () => {
    if (!isAdminAuthenticated) {
      onRequireAdminAuth('OPTIONS');
      return;
    }
    setIsOptionsOpen(!isOptionsOpen);
  };

  return (
    <header className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#022c22] text-white shadow-2xl shadow-emerald-950/30 border-b border-emerald-600/25 no-print sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-2.5 sm:py-3.5 gap-3">
          {/* Brand Identity: Official MONEV Logo exactly matching uploaded asset */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="relative group cursor-pointer flex items-center py-0.5">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/30 via-emerald-400/20 to-amber-300/30 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src="/logo.svg"
                alt="Logo Resmi MONEV Pelayanan Publik Kankemenag Gunungkidul"
                className="relative h-12 sm:h-13.5 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-300 tracking-wider uppercase bg-emerald-950/90 px-2 py-0.5 rounded-md border border-amber-400/40 shadow-xs">
                  Portal Resmi
                </span>
                <span className="text-xs text-emerald-100 font-bold" style={{ fontSize: '15px' }}>Monitoring dan Evaluasi Pelayanan Publik TerIntegrasi</span>
              </div>
              <p className="text-[11px] text-emerald-300/90 font-medium leading-none mt-1" style={{ fontSize: '13px' }}>
                KUA &amp; Madrasah Negeri Kabupaten Gunungkidul
              </p>
            </div>
          </div>

          {/* Right Navigation & Utility Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentRole === 'PUBLIC' ? (
              /* Tampilan Mode Publik: Hanya Tombol Login Unit Kerja/Evaluator & Quick Panduan */
              <div className="flex items-center gap-2.5">
                {onOpenPanduanModal && (
                  <button
                    type="button"
                    onClick={onOpenPanduanModal}
                    title="Buka & Unduh Buku Panduan Satker Format PDF"
                    className="px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-slate-950 hover:bg-amber-400 bg-emerald-950/70 border border-amber-400/40 transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline" style={{ fontSize: '13px' }}>Panduan PDF</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenEmployeeLogin}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                  <span>Login Unit Kerja/Evaluator</span>
                </button>
              </div>
            ) : (
              /* Tampilan Mode Internal (Unit Kerja, Juri, Dashboard) */
              <>
                {/* Tombol Kembali ke Portal Transparansi Publik */}
                <button
                  type="button"
                  onClick={() => onRoleChange('PUBLIC')}
                  title="Kembali ke Portal Transparansi Publik"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-200/90 hover:text-white hover:bg-emerald-800/60 bg-emerald-950/70 border border-emerald-700/50 transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden lg:inline">Portal Publik</span>
                </button>

                {/* 3 Role Tabs (Smooth Segmented Control with graceful active state) */}
                <nav className="bg-emerald-950/90 p-1 rounded-2xl border border-emerald-700/50 shadow-inner flex items-center gap-1 shrink-0 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => onRoleChange('UNIT')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      currentRole === 'UNIT'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold scale-[1.02]'
                        : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/60 active:scale-98'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Unit Kerja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRoleChange('JURI')}
                    title={isJuriAuthenticated ? 'Akses Juri Terbuka (Terautentikasi)' : 'Klik untuk masuk Mode Juri'}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      currentRole === 'JURI'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold scale-[1.02]'
                        : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/60 active:scale-98'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5 shrink-0" />
                    <span>Tim Juri</span>
                    {isJuriAuthenticated ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-emerald-400/80" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRoleChange('DASHBOARD')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      currentRole === 'DASHBOARD'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold scale-[1.02]'
                        : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/60 active:scale-98'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                    <span>Dashboard</span>
                  </button>
                </nav>

                {/* Quick Access: Buku Panduan PDF */}
                {onOpenPanduanModal && (
                  <button
                    type="button"
                    onClick={onOpenPanduanModal}
                    title="Buka & Unduh Buku Panduan Satker Format PDF"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-slate-950 hover:bg-amber-400 bg-emerald-950/70 border border-amber-400/40 transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline" style={{ fontSize: '13px' }}>Panduan PDF</span>
                  </button>
                )}

                {/* Sync / Refresh Button */}
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={onSyncData}
                  title="Sinkronkan data dengan Google Sheets"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-emerald-100 hover:text-white hover:bg-emerald-800/80 bg-emerald-950/70 border border-emerald-700/50 transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:border-emerald-600 active:scale-95"
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-300 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                  )}
                  <span className="hidden md:inline">{isSyncing ? 'Sinkron...' : 'Sinkron'}</span>
                </button>

                {/* Compact Options Dropdown (Disembunyikan jika currentRole === 'UNIT') */}
                {currentRole !== 'UNIT' && (
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={handleOptionsClick}
                      title={isAdminAuthenticated ? "Menu Pengaturan & Opsi (Admin Terverifikasi)" : "Menu Opsi (Khusus Administrator)"}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md active:scale-95 ${
                        isAdminAuthenticated
                          ? 'text-amber-200 bg-emerald-950/90 border border-amber-400/50 hover:bg-emerald-800/80 hover:border-amber-300'
                          : 'text-emerald-100 hover:text-white hover:bg-emerald-800/80 bg-emerald-950/70 border border-emerald-700/50'
                      }`}
                    >
                      <Settings className={`w-3.5 h-3.5 ${isAdminAuthenticated ? 'text-amber-300' : 'text-slate-300'}`} />
                      <span className="hidden sm:inline">Opsi</span>
                      {isAdminAuthenticated ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                        </span>
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
                      )}
                      <ChevronDown className={`w-3 h-3 text-emerald-400 shrink-0 transition-transform duration-300 ${isOptionsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOptionsOpen && (
                      <div className="absolute right-0 mt-2.5 w-72 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-2.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Pengaturan Sistem
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1.5 mt-0.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Administrator Terverifikasi</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsOptionsOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="py-1.5 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOptionsOpen(false);
                              onOpenServerConfig();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Database className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span>Pengaturan Server &amp; API</span>
                              <span className="block text-[10px] text-slate-400 font-normal">Koneksi Google Apps Script</span>
                            </div>
                          </button>

                          {onOpenJuriManager && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsOptionsOpen(false);
                                onOpenJuriManager();
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Users className="w-4 h-4 text-emerald-600" />
                              <div>
                                <span>Kelola Tim Juri Penilai</span>
                                <span className="block text-[10px] text-slate-400 font-normal">Nama, PIN &amp; Verifikator Aktif</span>
                              </div>
                            </button>
                          )}

                          {onOpenAspekConfig && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsOptionsOpen(false);
                                onOpenAspekConfig();
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                              <div>
                                <span>Pengaturan Aspek Penilaian</span>
                                <span className="block text-[10px] text-slate-400 font-normal">Aktif/Nonaktifkan Aspek &amp; Bobot</span>
                              </div>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsOptionsOpen(false);
                              onResetData();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 text-rose-600" />
                            <div>
                              <span>Reset ke Data Awal</span>
                              <span className="block text-[10px] text-rose-400 font-normal">Simulasi 6 satker terverifikasi</span>
                            </div>
                          </button>
                        </div>

                        <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between px-3 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOptionsOpen(false);
                              onLogoutAdmin();
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            Kunci Sesi Admin
                          </button>
                          <span className="text-[10px] text-slate-400">SI-EPP v2.6</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


