import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, Cloud, Database, Loader2, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { Header, UserRole } from './components/Header';
import { UnitAssessmentView } from './components/UnitAssessmentView';
import { JuriVerificationView } from './components/JuriVerificationView';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { RaporModal } from './components/RaporModal';
import { ServerConfigModal } from './components/ServerConfigModal';
import { JuriLoginModal } from './components/JuriLoginModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PanduanModal } from './components/PanduanModal';
import { PublicPortalView } from './components/PublicPortalView';
import { EmployeeLoginModal } from './components/EmployeeLoginModal';
import { DAFTAR_UNIT_KERJA } from './data/units';
import { SatkerEvaluation } from './types';
import {
  calculateBaseScore,
  calculateEvaluationScore,
  generateSeedData,
  getMultiJuriSummary,
  loadStoredEvaluations,
  recalculateAllEvaluationsMultiJuri,
  saveStoredEvaluations
} from './utils/scoring';
import {
  DEFAULT_SCRIPT_URL,
  getScriptUrl,
  muatDataDariServer,
  simpanDataKeServer
} from './utils/googleSheets';
import {
  JURI_DEFAULT_PIN,
  findJuriAccountByPin,
  isAdminAuthenticated,
  setAdminAuthenticated
} from './utils/security';

// Konstanta URL Default sesuai instruksi teknis
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz4Rn-f1A5lFu0Pl_BW_FubB_glYRCoZy2-b0v8PwqbfImD_utru6up13U53Oh0oXQa/exec";

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('PUBLIC');
  const [evaluations, setEvaluations] = useState<Record<string, SatkerEvaluation>>({});
  const [raporUnitId, setRaporUnitId] = useState<string | null>(null);
  const [activeUnitForAssessment, setActiveUnitForAssessment] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState<boolean>(false);
  const [isEmployeeLoginModalOpen, setIsEmployeeLoginModalOpen] = useState<boolean>(false);

  // Juri Security / Authentication State
  const [isJuriLoginModalOpen, setIsJuriLoginModalOpen] = useState<boolean>(false);
  const [juriAuth, setJuriAuth] = useState<{
    isAuthenticated: boolean;
    pin: string;
    verifierName: string;
    juriId: string;
  }>(() => {
    try {
      const stored = sessionStorage.getItem('SIEPP_JURI_AUTH');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isAuthenticated && parsed.pin) {
          return {
            ...parsed,
            juriId: parsed.juriId || 'JURI-1'
          };
        }
      }
    } catch {}
    return {
      isAuthenticated: false,
      pin: '',
      verifierName: 'Dr. H. Mukotip, S.Ag., M.Pd.I',
      juriId: 'JURI-1'
    };
  });

  // Admin Security / Authentication State for Options Menu
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(() => isAdminAuthenticated());
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [adminPendingAction, setAdminPendingAction] = useState<'OPTIONS' | 'SERVER_CONFIG' | 'JURI_MANAGER' | 'ASPEK_CONFIG' | null>(null);
  const [forceOpenOptionsNonce, setForceOpenOptionsNonce] = useState<number>(0);
  const [serverConfigInitialTab, setServerConfigInitialTab] = useState<'server' | 'juri' | 'aspek'>('server');
  const [isPanduanModalOpen, setIsPanduanModalOpen] = useState<boolean>(false);

  // Synchronization states
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoadingInitialServer, setIsLoadingInitialServer] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Admin Authorization Handlers
  const handleRequireAdminAuth = (action: 'OPTIONS' | 'SERVER_CONFIG' | 'JURI_MANAGER' | 'ASPEK_CONFIG') => {
    setAdminPendingAction(action);
    setIsAdminLoginModalOpen(true);
  };

  const handleAdminLoginSuccess = () => {
    setAdminAuthenticated(true);
    setIsAdminAuth(true);
    setIsAdminLoginModalOpen(false);
    showToast('Autentikasi Administrator berhasil! Akses menu Opsi terbuka.', 'success');

    if (adminPendingAction === 'SERVER_CONFIG') {
      setServerConfigInitialTab('server');
      setIsServerConfigOpen(true);
    } else if (adminPendingAction === 'JURI_MANAGER') {
      setServerConfigInitialTab('juri');
      setIsServerConfigOpen(true);
    } else if (adminPendingAction === 'ASPEK_CONFIG') {
      setServerConfigInitialTab('aspek');
      setIsServerConfigOpen(true);
    } else if (adminPendingAction === 'OPTIONS') {
      setForceOpenOptionsNonce((prev) => prev + 1);
    }
    setAdminPendingAction(null);
  };

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setIsAdminAuth(false);
    showToast('Sesi Administrator telah dikunci kembali.', 'info');
  };

  const handleOpenServerConfigProtected = () => {
    if (!isAdminAuth) {
      handleRequireAdminAuth('SERVER_CONFIG');
      return;
    }
    setServerConfigInitialTab('server');
    setIsServerConfigOpen(true);
  };

  const handleOpenJuriManagerProtected = () => {
    if (!isAdminAuth) {
      handleRequireAdminAuth('JURI_MANAGER');
      return;
    }
    setServerConfigInitialTab('juri');
    setIsServerConfigOpen(true);
  };

  const handleOpenAspekConfigProtected = () => {
    if (!isAdminAuth) {
      handleRequireAdminAuth('ASPEK_CONFIG');
      return;
    }
    setServerConfigInitialTab('aspek');
    setIsServerConfigOpen(true);
  };

  // Sync data from Google Sheets server (GET)
  const syncFromServer = useCallback(async (isManual: boolean = false) => {
    setIsSyncing(true);
    if (!isManual) setIsLoadingInitialServer(true);

    try {
      const res = await muatDataDariServer();
      if (res.success && res.data && Object.keys(res.data).length > 0) {
        setEvaluations((prev) => {
          const merged = { ...prev, ...res.data };
          saveStoredEvaluations(merged);
          return merged;
        });
        showToast('Data berhasil dimuat dan disinkronkan dari server Google Sheets!', 'success');
      } else {
        if (isManual) {
          showToast(res.message || 'Gagal menyinkronkan data dari Google Sheets. Menggunakan basis data lokal.', 'info');
        }
      }
    } catch {
      if (isManual) {
        showToast('Koneksi ke Google Sheets terganggu. Menggunakan data lokal (offline mode).', 'info');
      }
    } finally {
      setIsSyncing(false);
      setIsLoadingInitialServer(false);
    }
  }, [showToast]);

  // Initialize data on mount: load local storage first, then fetch from Google Sheets
  useEffect(() => {
    const localData = loadStoredEvaluations();
    setEvaluations(localData);
    setIsInitialized(true);

    // Call muatDataDariServer() automatically on initial launch
    syncFromServer(false);
  }, [syncFromServer]);

  // Sync to localStorage whenever evaluations state changes
  useEffect(() => {
    if (isInitialized) {
      saveStoredEvaluations(evaluations);
    }
  }, [evaluations, isInitialized]);

  // Overall statistics for header
  const headerStats = useMemo(() => {
    const totalSatker = DAFTAR_UNIT_KERJA.length;
    let submittedCount = 0;
    let verifiedCount = 0;

    Object.values(evaluations).forEach((ev) => {
      if (ev.status === 'SUBMITTED') submittedCount++;
      if (ev.status === 'VERIFIED') {
        submittedCount++;
        verifiedCount++;
      }
    });

    return { totalSatker, submittedCount, verifiedCount };
  }, [evaluations]);

  // Switch Role Handler with PIN Protection for Juri
  const handleRoleChange = (role: UserRole) => {
    if (role === 'JURI') {
      if (!juriAuth.isAuthenticated) {
        setIsJuriLoginModalOpen(true);
        return;
      }
    }
    setCurrentRole(role);
  };

  const handleJuriLoginSuccess = (pin: string, verifierName: string, juriId?: string) => {
    const matched = findJuriAccountByPin(pin);
    const assignedJuriId = juriId || matched?.id || 'JURI-1';
    const authData = {
      isAuthenticated: true,
      pin,
      verifierName,
      juriId: assignedJuriId
    };
    setJuriAuth(authData);
    try {
      sessionStorage.setItem('SIEPP_JURI_AUTH', JSON.stringify(authData));
    } catch {}
    setIsJuriLoginModalOpen(false);
    setCurrentRole('JURI');
    showToast(`Autentikasi Tim Juri berhasil! Selamat bertugas, [${assignedJuriId}] ${verifierName}.`, 'success');
  };

  const handleJuriLogout = () => {
    const authData = {
      isAuthenticated: false,
      pin: '',
      verifierName: juriAuth.verifierName,
      juriId: juriAuth.juriId
    };
    setJuriAuth(authData);
    try {
      sessionStorage.removeItem('SIEPP_JURI_AUTH');
    } catch {}
    setCurrentRole('DASHBOARD');
    showToast('Akses Mode Juri telah dikunci kembali.', 'info');
  };

  // Handlers Login Unit Kerja/Evaluator Modal
  const handleLoginSatkerFromModal = (unitId: string, pin: string) => {
    try {
      const raw = sessionStorage.getItem('SIEPP_UNLOCKED_SATKER_PINS');
      const existing = raw ? JSON.parse(raw) : {};
      existing[unitId] = pin;
      sessionStorage.setItem('SIEPP_UNLOCKED_SATKER_PINS', JSON.stringify(existing));
    } catch {}
    setActiveUnitForAssessment(unitId);
    setCurrentRole('UNIT');
    const unit = DAFTAR_UNIT_KERJA.find((u) => u.id === unitId);
    showToast(`Berhasil masuk ke formulir ${unit?.nama || unitId}!`, 'success');
  };

  const handleLoginJuriFromModal = (pin: string, verifierName: string, juriId?: string) => {
    handleJuriLoginSuccess(pin, verifierName, juriId);
  };

  const handleLoginAdminFromModal = () => {
    setAdminAuthenticated(true);
    setIsAdminAuth(true);
    setCurrentRole('DASHBOARD');
    showToast('Autentikasi Administrator berhasil! Masuk ke Dashboard.', 'success');
  };

  // Handler: Unit Kerja Simpan Draft Lokal (Instan ke State & localStorage tanpa blocking UI)
  const handleSaveDraftLocal = useCallback(
    (unitId: string, partial: Partial<SatkerEvaluation>) => {
      setEvaluations((prev) => {
        const existing = prev[unitId] || {
          status: 'DRAFT',
          responses: {},
          links: {},
          verifScores: {},
          verifNotes: {}
        };

        const updatedUnitData: SatkerEvaluation = {
          ...existing,
          ...partial,
          status: existing.status === 'SUBMITTED' || existing.status === 'VERIFIED' ? existing.status : 'DRAFT'
        };

        const merged = {
          ...prev,
          [unitId]: updatedUnitData
        };
        saveStoredEvaluations(merged);
        try {
          localStorage.setItem(
            `SIEPP_DRAFT_${unitId}`,
            JSON.stringify({
              responses: updatedUnitData.responses,
              links: updatedUnitData.links,
              videoUrl: updatedUnitData.videoUrl,
              videoDeskripsi: updatedUnitData.videoDeskripsi
            })
          );
        } catch {}
        return merged;
      });
    },
    []
  );

  // Handler: Background Sync ke Server Google Sheets (Debounced, Silent, Tanpa Spinner Overlay)
  const handleBackgroundSyncDraft = useCallback(
    async (
      unitId: string,
      latestData: SatkerEvaluation,
      pin?: string
    ): Promise<{ success: boolean; message?: string }> => {
      const unitObj = DAFTAR_UNIT_KERJA.find((u) => u.id === unitId);
      const scoreRes = calculateEvaluationScore(latestData, 'self', unitObj?.kategori);

      const payload = {
        action: 'SIMPAN_SATKER',
        id: unitId,
        status: 'Draft',
        skorMandiri: scoreRes.nilaiAkhirTerbobot,
        linkVideo: latestData.videoUrl || '',
        deskripsiVideo: latestData.videoDeskripsi || '',
        isianSatker: {
          responses: latestData.responses || {},
          links: latestData.links || {},
          buktiDukung: latestData.buktiDukung || {}
        },
        pin: pin || ''
      };

      try {
        const res = await simpanDataKeServer(payload);
        return res;
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Gagal terhubung ke server Google Sheets (Mode Offline).'
        };
      }
    },
    []
  );

  // Handler: Manual Tombol Simpan Draft (dengan notifikasi toast)
  const handleSaveDraft = async (
    unitId: string,
    partial: Partial<SatkerEvaluation>,
    pin?: string
  ) => {
    handleSaveDraftLocal(unitId, partial);
    const existing = evaluations[unitId] || {
      status: 'DRAFT',
      responses: {},
      links: {},
      verifScores: {},
      verifNotes: {}
    };
    const targetData = {
      ...existing,
      ...partial,
      status: existing.status === 'SUBMITTED' || existing.status === 'VERIFIED' ? existing.status : ('DRAFT' as const)
    };

    const res = await handleBackgroundSyncDraft(unitId, targetData as SatkerEvaluation, pin);
    if (res.success) {
      showToast('Data draft berhasil disinkronkan ke Google Sheets!', 'success');
    } else {
      showToast('Draft tersimpan di lokal (Gagal terhubung ke Google Sheets).', 'info');
    }
  };

  // Handler: Unit Kerja Submit Evaluasi
  const handleSubmitEvaluation = async (unitId: string, pin?: string) => {
    const now = new Date();
    const formatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ` ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;

    const existing = evaluations[unitId] || {
      status: 'DRAFT',
      responses: {},
      links: {},
      verifScores: {},
      verifNotes: {}
    };

    const updatedUnitData: SatkerEvaluation = {
      ...existing,
      status: 'SUBMITTED',
      submittedAt: formatted
    };

    setEvaluations((prev) => ({
      ...prev,
      [unitId]: updatedUnitData
    }));

    // Hitung Skor Mandiri
    const unitObj = DAFTAR_UNIT_KERJA.find((u) => u.id === unitId);
    const scoreRes = calculateEvaluationScore(updatedUnitData, 'self', unitObj?.kategori);

    // Format Payload Submit Satker sesuai instruksi teknis
    const payload = {
      action: 'SIMPAN_SATKER',
      id: unitId,
      status: 'Sudah Submit',
      skorMandiri: scoreRes.nilaiAkhirTerbobot,
      linkVideo: updatedUnitData.videoUrl || '',
      deskripsiVideo: updatedUnitData.videoDeskripsi || '',
      isianSatker: {
        responses: updatedUnitData.responses,
        links: updatedUnitData.links,
        buktiDukung: updatedUnitData.buktiDukung || {}
      },
      pin: pin || ''
    };

    // Kirim payload POST ke Google Apps Script
    const res = await simpanDataKeServer(payload);
    if (res.success) {
      showToast('Evaluasi berhasil dikirim dan disinkronkan ke Google Sheets!', 'success');
    } else {
      showToast('Evaluasi terkirim secara lokal (Gagal terhubung ke Google Sheets).', 'info');
    }
  };

  // Handler: Juri Simpan Hasil Verifikasi (Multi-Juri Non-Overwriting)
  const handleSaveVerification = async (
    unitId: string,
    verifScores: Record<string, number>,
    verifNotes: Record<string, string>,
    customVerifierName?: string,
    customJuriId?: string
  ) => {
    const now = new Date();
    const formatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ` ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;

    const existing = evaluations[unitId] || {
      status: 'DRAFT',
      responses: {},
      links: {},
      verifScores: {},
      verifNotes: {}
    };

    const verifikatorName = customVerifierName || juriAuth.verifierName || 'Drs. H. Saiful Bahri, M.S.I';
    const juriPin = juriAuth.pin || JURI_DEFAULT_PIN;
    const currentJuriId = customJuriId || juriAuth.juriId || 'JURI-1';
    const unitObj = DAFTAR_UNIT_KERJA.find((u) => u.id === unitId);

    // Hitung nilai terbobot mandiri verifikator ini
    const singleJuriBase = calculateBaseScore(verifScores, unitObj?.kategori);

    // Simpan ke dalam objek verifikasiJuri per-juri (tidak saling menimpa)
    const updatedVerifikasiJuri = {
      ...(existing.verifikasiJuri || {}),
      [currentJuriId]: {
        juriId: currentJuriId,
        namaVerifikator: verifikatorName,
        scores: verifScores,
        notes: verifNotes,
        nilaiAkhirTerbobot: singleJuriBase.nilaiAkhirTerbobot,
        verifiedAt: formatted
      }
    };

    // Hitung rata-rata otomatis dari seluruh Juri yang telah menilai
    const tempEvalForSummary: SatkerEvaluation = {
      ...existing,
      status: 'VERIFIED',
      verifikasiJuri: updatedVerifikasiJuri
    };
    const multiSummary = getMultiJuriSummary(tempEvalForSummary, unitObj?.kategori);
    const allVerifiedBy = multiSummary.juriEntries.map((j) => `${j.juriId} (${j.namaVerifikator})`).join(', ');

    const updatedUnitData: SatkerEvaluation = {
      ...existing,
      status: 'VERIFIED',
      verifScores,
      verifNotes,
      verifikasiJuri: updatedVerifikasiJuri,
      verifiedAt: formatted,
      verifiedBy: allVerifiedBy
    };

    setEvaluations((prev) => ({
      ...prev,
      [unitId]: updatedUnitData
    }));

    // Format Payload Simpan Juri sesuai instruksi teknis
    const payload = {
      action: 'SIMPAN_JURI',
      id: unitId,
      nilaiAkhirJuri: multiSummary.averageScore,
      predikat: multiSummary.predikat.label,
      verifikasiJuri: updatedVerifikasiJuri,
      namaVerifikator: verifikatorName,
      juriId: currentJuriId,
      pin: juriPin
    };

    // Kirim payload POST ke Google Apps Script
    const res = await simpanDataKeServer(payload);
    if (res.success) {
      showToast(`Hasil verifikasi [${currentJuriId}] berhasil disinkronkan ke Google Sheets! (Rata-rata: ${multiSummary.averageScore.toFixed(2)})`, 'success');
    } else {
      showToast(`Hasil verifikasi [${currentJuriId}] tersimpan di lokal (Gagal sinkron ke Google Sheets).`, 'info');
    }
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang (reset) seluruh data simulasi ke setelan awal pabrik (6 satker terverifikasi)?')) {
      const fresh = generateSeedData();
      setEvaluations(fresh);
      saveStoredEvaluations(fresh);
      showToast('Data simulasi telah diatur ulang ke kondisi default.', 'info');
    }
  };

  const handleNavigateToUnit = (unitId: string) => {
    setActiveUnitForAssessment(unitId);
    setCurrentRole('UNIT');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center bg-mesh-emerald">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-amber-200 border-b-amber-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800 tracking-tight">SI-EPP GUNUNGKIDUL</p>
            <p className="text-xs text-slate-500 mt-0.5">Menyiapkan basis data pelayanan publik...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-mesh-emerald flex flex-col text-slate-800">
      {/* Initial Server Loading Banner */}
      {isLoadingInitialServer && (
        <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#022c22] text-emerald-200 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b border-emerald-700/50 shadow-xs no-print animate-fade-in-up">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
          <span>Sinkronisasi data langsung dengan Google Sheets...</span>
        </div>
      )}

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-fade-in-up duration-200">
          {toastMessage.type === 'success' ? (
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : toastMessage.type === 'error' ? (
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <WifiOff className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Cloud className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-medium leading-relaxed">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Official Top Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        onOpenServerConfig={handleOpenServerConfigProtected}
        onOpenJuriManager={handleOpenJuriManagerProtected}
        onOpenAspekConfig={handleOpenAspekConfigProtected}
        onSyncData={() => syncFromServer(true)}
        isSyncing={isSyncing}
        isJuriAuthenticated={juriAuth.isAuthenticated}
        isAdminAuthenticated={isAdminAuth}
        onRequireAdminAuth={handleRequireAdminAuth}
        onLogoutAdmin={handleAdminLogout}
        forceOpenOptionsNonce={forceOpenOptionsNonce}
        totalSatker={headerStats.totalSatker}
        submittedCount={headerStats.submittedCount}
        verifiedCount={headerStats.verifiedCount}
        onOpenPanduanModal={() => setIsPanduanModalOpen(true)}
        onOpenEmployeeLogin={() => setIsEmployeeLoginModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${raporUnitId || isPanduanModalOpen ? 'no-print' : ''}`}>
        {currentRole === 'PUBLIC' && (
          <PublicPortalView
            evaluations={evaluations}
            onOpenLogin={() => setIsEmployeeLoginModalOpen(true)}
            isSyncing={isSyncing || isLoadingInitialServer}
          />
        )}

        {currentRole === 'UNIT' && (
          <UnitAssessmentView
            evaluations={evaluations}
            activeUnitId={activeUnitForAssessment}
            onSaveDraft={handleSaveDraft}
            onSaveDraftLocal={handleSaveDraftLocal}
            onBackgroundSyncDraft={handleBackgroundSyncDraft}
            onSubmitEvaluation={handleSubmitEvaluation}
            onOpenRapor={(id) => setRaporUnitId(id)}
            onOpenPanduanModal={() => setIsPanduanModalOpen(true)}
          />
        )}

        {currentRole === 'JURI' && (
          <JuriVerificationView
            evaluations={evaluations}
            juriId={juriAuth.juriId}
            verifierName={juriAuth.verifierName}
            isSyncing={isSyncing || isLoadingInitialServer}
            onSaveVerification={handleSaveVerification}
            onOpenRapor={(id) => setRaporUnitId(id)}
            onLogoutJuri={handleJuriLogout}
            onChangeVerifier={() => setIsJuriLoginModalOpen(true)}
          />
        )}

        {currentRole === 'DASHBOARD' && (
          <ExecutiveDashboardView
            evaluations={evaluations}
            onOpenRapor={(id) => setRaporUnitId(id)}
            onNavigateToUnit={handleNavigateToUnit}
            onSyncData={() => syncFromServer(true)}
            isSyncing={isSyncing}
            onOpenPanduanModal={() => setIsPanduanModalOpen(true)}
          />
        )}
      </main>

      {/* Login Unit Kerja/Evaluator Modal (Satker, Juri, Admin) */}
      <EmployeeLoginModal
        isOpen={isEmployeeLoginModalOpen}
        onClose={() => setIsEmployeeLoginModalOpen(false)}
        onLoginSatker={handleLoginSatkerFromModal}
        onLoginJuri={handleLoginJuriFromModal}
        onLoginAdmin={handleLoginAdminFromModal}
      />

      {/* Admin Authentication Password Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => {
          setIsAdminLoginModalOpen(false);
          setAdminPendingAction(null);
        }}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Juri Authentication PIN Modal */}
      <JuriLoginModal
        isOpen={isJuriLoginModalOpen}
        onClose={() => setIsJuriLoginModalOpen(false)}
        onSuccess={handleJuriLoginSuccess}
      />

      {/* Rapor Evaluasi Print-Ready Modal */}
      <RaporModal
        unitId={raporUnitId}
        evaluations={evaluations}
        onClose={() => setRaporUnitId(null)}
      />

      {/* Buku Panduan Satker Format PDF & Interaktif */}
      <PanduanModal
        isOpen={isPanduanModalOpen}
        onClose={() => setIsPanduanModalOpen(false)}
      />

      {/* Server Configuration Modal */}
      <ServerConfigModal
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        initialTab={serverConfigInitialTab}
        onUrlUpdated={() => {
          showToast('URL Google Apps Script berhasil diperbarui!', 'success');
          syncFromServer(true);
        }}
        onRecalculateMultiJuri={() => {
          const updated = recalculateAllEvaluationsMultiJuri(evaluations);
          setEvaluations(updated);
          showToast('Rata-rata nilai seluruh satker berhasil dihitung ulang secara dinamis!', 'success');
        }}
        onJuriAccountsUpdated={() => {
          const updated = recalculateAllEvaluationsMultiJuri(evaluations);
          setEvaluations(updated);
          showToast('Daftar juri diperbarui & nilai satker otomatis disinkronkan!', 'success');
        }}
        onAspekConfigUpdated={() => {
          const updated = recalculateAllEvaluationsMultiJuri(evaluations);
          setEvaluations(updated);
          showToast('Pengaturan aspek penilaian diperbarui & nilai terbobot otomatis disesuaikan!', 'success');
        }}
      />

      {/* Footer */}
      <footer className="no-print bg-white/90 backdrop-blur-md border-t border-slate-200/90 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.svg"
              alt="MONEV Logo"
              className="w-6 h-6 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-extrabold text-slate-900">MONEV Pelayanan Publik</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">Kankemenag Kabupaten Gunungkidul</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <button
              type="button"
              onClick={() => setIsPanduanModalOpen(true)}
              className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer hover:underline"
            >
              <span>Buku Panduan PDF</span>
            </button>
            {currentRole !== 'UNIT' && currentRole !== 'PUBLIC' && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleOpenServerConfigProtected}
                  className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer hover:underline"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Pengaturan Server (API URL)</span>
                </button>
              </>
            )}
            <span className="text-slate-300">·</span>
            <div className="text-slate-400">
              Standar Pelayanan Publik KUA &amp; Madrasah Negeri © 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
