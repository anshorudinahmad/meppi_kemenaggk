import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FolderUp,
  HelpCircle,
  KeyRound,
  Lock,
  Play,
  Save,
  Send,
  ShieldAlert,
  Unlock,
  UploadCloud,
  Video
} from 'lucide-react';
import { ASPEK_LIST, INSTRUMEN_LIST } from '../data/instruments';
import { LINK_FOLDER_BUKTI, CENTRAL_DRIVE_FOLDER_URL } from '../data/driveFolders';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import { KategoriUnit, SatkerEvaluation, StatusEvaluasi } from '../types';
import { calculateEvaluationScore, getMultiJuriSummary } from '../utils/scoring';
import { getExpectedSatkerPin, validateSatkerPin } from '../utils/security';
import { useAspekConfig, isAspekActive, getTotalBobotAktif } from '../utils/aspekConfig';
import { showConfirmDialog, showSuccessAlert } from '../utils/sweetAlert';
import { simpanDataKeServer } from '../utils/googleSheets';

export type AutoSaveStatus = 'idle' | 'saving_local' | 'synced_server' | 'offline';

interface UnitAssessmentViewProps {
  evaluations: Record<string, SatkerEvaluation>;
  activeUnitId?: string | null;
  onSaveDraft: (unitId: string, data: Partial<SatkerEvaluation>, pin?: string) => void;
  onSaveDraftLocal?: (unitId: string, data: Partial<SatkerEvaluation>) => void;
  onBackgroundSyncDraft?: (
    unitId: string,
    data: SatkerEvaluation,
    pin?: string
  ) => Promise<{ success: boolean; message?: string }>;
  onSubmitEvaluation: (unitId: string, pin?: string) => void;
  onOpenRapor: (unitId: string) => void;
  onOpenPanduanModal?: () => void;
}

export const UnitAssessmentView: React.FC<UnitAssessmentViewProps> = ({
  evaluations,
  activeUnitId,
  onSaveDraft,
  onSaveDraftLocal,
  onBackgroundSyncDraft,
  onSubmitEvaluation,
  onOpenRapor,
  onOpenPanduanModal
}) => {
  const [selectedKategori, setSelectedKategori] = useState<KategoriUnit>('KUA');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('KUA-01');
  const [activeAspekId, setActiveAspekId] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Aspects Configuration (Spesifik per Kategori Satker)
  const [aspekConfig] = useAspekConfig(selectedKategori);

  const activeAspekList = useMemo(() => {
    return ASPEK_LIST.filter((a) => isAspekActive(a.id, aspekConfig));
  }, [aspekConfig]);

  // Ensure activeAspekId always points to an active aspect
  React.useEffect(() => {
    if (!isAspekActive(activeAspekId, aspekConfig)) {
      const fallback = activeAspekList[0]?.id || 1;
      setActiveAspekId(fallback);
    }
  }, [aspekConfig, activeAspekId, activeAspekList]);

  // PIN Authentication state per Satker (persisted in session)
  const [unlockedPins, setUnlockedPins] = useState<Record<string, string>>(() => {
    try {
      const raw = sessionStorage.getItem('SIEPP_UNLOCKED_SATKER_PINS');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const isCurrentUnitUnlocked = Boolean(unlockedPins[selectedUnitId]);
  const currentPin = unlockedPins[selectedUnitId] || '';
  const expectedPin = getExpectedSatkerPin(selectedUnitId);

  // FITUR 20: Auto-Save State & Debounced Background Sync (3000ms)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [isFading, setIsFading] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selectedUnitId when activeUnitId is updated from outside
  React.useEffect(() => {
    if (activeUnitId) {
      setSelectedUnitId(activeUnitId);
      const unit = DAFTAR_UNIT_KERJA.find((u) => u.id === activeUnitId);
      if (unit) {
        setSelectedKategori(unit.kategori);
      }
    }
  }, [activeUnitId]);

  const handleUnlockForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateSatkerPin(selectedUnitId, pinInput)) {
      const cleanPin = pinInput.trim().toUpperCase();
      const updated = { ...unlockedPins, [selectedUnitId]: cleanPin };
      setUnlockedPins(updated);
      try {
        sessionStorage.setItem('SIEPP_UNLOCKED_SATKER_PINS', JSON.stringify(updated));
      } catch {}
      setPinError(null);
      setPinInput('');
      showToast(`Kunci akses form ${currentUnit.nama} berhasil dibuka! Akses edit telah aktif.`);
    } else {
      setPinError(`PIN salah! Format PIN untuk unit ini adalah ${expectedPin}.`);
    }
  };

  const handleLockAgain = () => {
    const updated = { ...unlockedPins };
    delete updated[selectedUnitId];
    setUnlockedPins(updated);
    try {
      sessionStorage.setItem('SIEPP_UNLOCKED_SATKER_PINS', JSON.stringify(updated));
    } catch {}
    showToast(`Formulir ${currentUnit.nama} telah dikunci kembali.`);
  };

  const filteredUnits = useMemo(() => {
    return DAFTAR_UNIT_KERJA.filter((u) => u.kategori === selectedKategori);
  }, [selectedKategori]);

  const currentUnit = useMemo(() => {
    return DAFTAR_UNIT_KERJA.find((u) => u.id === selectedUnitId) || DAFTAR_UNIT_KERJA[0];
  }, [selectedUnitId]);

  const currentEval = useMemo<SatkerEvaluation>(() => {
    const existing = evaluations[selectedUnitId];
    if (existing) return existing;
    return {
      status: 'BELUM_ISI',
      responses: {},
      links: {},
      verifScores: {},
      verifNotes: {}
    };
  }, [evaluations, selectedUnitId]);

  const latestDraftRef = useRef<SatkerEvaluation>(currentEval);

  useEffect(() => {
    latestDraftRef.current = currentEval;
  }, [currentEval]);

  // Reset status ke idle saat satker berganti
  useEffect(() => {
    setAutoSaveStatus('idle');
    setIsFading(false);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
  }, [selectedUnitId]);

  // Handler Sinkronisasi Background ke Server (Silent, no overlay)
  const triggerBackgroundSync = useCallback(
    async (dataToSync: SatkerEvaluation) => {
      // Penanganan koneksi offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setAutoSaveStatus('offline');
        setIsFading(false);
        return;
      }

      try {
        let res: { success: boolean; message?: string };
        if (onBackgroundSyncDraft) {
          res = await onBackgroundSyncDraft(selectedUnitId, dataToSync, currentPin);
        } else {
          const unitObj = DAFTAR_UNIT_KERJA.find((u) => u.id === selectedUnitId);
          const scoreRes = calculateEvaluationScore(dataToSync, 'self', unitObj?.kategori);
          res = await simpanDataKeServer({
            action: 'SIMPAN_SATKER',
            id: selectedUnitId,
            status: 'Draft',
            skorMandiri: scoreRes.nilaiAkhirTerbobot,
            linkVideo: dataToSync.videoUrl || '',
            deskripsiVideo: dataToSync.videoDeskripsi || '',
            isianSatker: {
              responses: dataToSync.responses || {},
              links: dataToSync.links || {}
            },
            pin: currentPin || ''
          });
        }

        if (res.success) {
          setAutoSaveStatus('synced_server');
          setIsFading(false);
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
          fadeTimerRef.current = setTimeout(() => {
            setIsFading(true);
          }, 4000);
        } else {
          setAutoSaveStatus('offline');
          setIsFading(false);
        }
      } catch {
        setAutoSaveStatus('offline');
        setIsFading(false);
      }
    },
    [onBackgroundSyncDraft, selectedUnitId, currentPin]
  );

  // Listener Event Online/Offline Jaringan
  useEffect(() => {
    const handleOnline = () => {
      if (autoSaveStatus === 'offline' && isCurrentUnitUnlocked) {
        triggerBackgroundSync(latestDraftRef.current);
      }
    };
    const handleOffline = () => {
      setAutoSaveStatus('offline');
      setIsFading(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [autoSaveStatus, isCurrentUnitUnlocked, triggerBackgroundSync]);

  // Fungsi mutasi instan lokal + Debounce sync 3000ms
  const performAutoSave = (partial: Partial<SatkerEvaluation>) => {
    const updatedUnitData: SatkerEvaluation = {
      ...currentEval,
      ...partial,
      status: currentEval.status === 'BELUM_ISI' ? 'DRAFT' : currentEval.status
    };
    latestDraftRef.current = updatedUnitData;

    // 1. Simpan Lokal Instan (State & localStorage)
    if (onSaveDraftLocal) {
      onSaveDraftLocal(selectedUnitId, partial);
    } else {
      onSaveDraft(selectedUnitId, partial, currentPin);
    }

    try {
      localStorage.setItem(
        `SIEPP_DRAFT_${selectedUnitId}`,
        JSON.stringify({
          responses: updatedUnitData.responses,
          links: updatedUnitData.links,
          videoUrl: updatedUnitData.videoUrl,
          videoDeskripsi: updatedUnitData.videoDeskripsi
        })
      );
    } catch {}

    // 2. Tampilkan teks indikator: "⏳ Menyimpan di perangkat..." (oranye/kuning)
    setAutoSaveStatus('saving_local');
    setIsFading(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    // 3. Background Sync ke Server Google Sheets (Debounce 3000ms / 3 Detik)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      triggerBackgroundSync(updatedUnitData);
    }, 3000);
  };

  // Handle category switch
  const handleCategoryChange = (kat: KategoriUnit) => {
    setSelectedKategori(kat);
    const firstUnitInKat = DAFTAR_UNIT_KERJA.find((u) => u.kategori === kat);
    if (firstUnitInKat) {
      setSelectedUnitId(firstUnitInKat.id);
    }
  };

  // Response change for Aspek 1-7 (Auto-Save Local & Debounce Background Sync)
  const handleScoreSelect = (code: string, score: number) => {
    const updatedResponses = { ...currentEval.responses, [code]: score };
    performAutoSave({ responses: updatedResponses });
  };

  // Link change for Aspek 1-7 (Auto-Save Local & Debounce Background Sync)
  const handleLinkChange = (code: string, link: string) => {
    const updatedLinks = { ...currentEval.links, [code]: link };
    performAutoSave({ links: updatedLinks });
  };

  // Video data change (Aspek 8) (Auto-Save Local & Debounce Background Sync)
  const handleVideoUrlChange = (url: string) => {
    performAutoSave({ videoUrl: url });
  };

  const handleVideoDeskripsiChange = (desk: string) => {
    performAutoSave({ videoDeskripsi: desk });
  };

  // Calculation for self progress & score with dynamic aspect weights
  const scoreResult = useMemo(() => {
    return calculateEvaluationScore(currentEval, 'self', aspekConfig);
  }, [currentEval, aspekConfig]);

  // Exclude inactive aspect items from completeness progress bar (0-100%)
  const activeItems = useMemo(() => {
    return INSTRUMEN_LIST.filter((item) => isAspekActive(item.aspekId, aspekConfig));
  }, [aspekConfig]);

  const totalItemsCount = activeItems.length;
  const answeredCount = useMemo(() => {
    const responses = currentEval.responses || {};
    return activeItems.filter((item) => typeof responses[item.code] === 'number').length;
  }, [activeItems, currentEval.responses]);

  const progressPercent = totalItemsCount > 0
    ? Math.min(100, Math.round((answeredCount / totalItemsCount) * 100))
    : 100;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ==========================================
  // FITUR CETAK RAPOR EVALUASI (PDF) UNTUK SATKER
  // ==========================================
  const pdfMultiJuri = useMemo(() => {
    return getMultiJuriSummary(currentEval, aspekConfig);
  }, [currentEval, aspekConfig]);

  const pdfSelfScoreResult = useMemo(() => {
    return calculateEvaluationScore(currentEval, 'self', aspekConfig);
  }, [currentEval, aspekConfig]);

  const pdfJuriScoreResult = useMemo(() => {
    return calculateEvaluationScore(currentEval, 'juri', aspekConfig);
  }, [currentEval, aspekConfig]);

  // Abaikan aspek yang disetting NONAKTIF untuk kategori satker ini
  const pdfActiveAspectScores = useMemo(() => {
    return pdfJuriScoreResult.aspekScores.filter((asp) => asp.isActive);
  }, [pdfJuriScoreResult]);

  // Rangkuman seluruh catatan perbaikan dari Juri dikelompokkan per butir instrumen lengkap dengan label nama Juri
  const pdfNotesList = useMemo(() => {
    if (pdfMultiJuri.combinedNotes && pdfMultiJuri.combinedNotes.length > 0) {
      return pdfMultiJuri.combinedNotes.map((item) => ({
        code: item.code,
        title: item.title,
        juriLabel: `[Catatan ${item.juriId} - ${item.namaVerifikator}]`,
        note: item.note
      }));
    }

    return Object.entries(currentEval?.verifNotes || {})
      .filter(([_, note]) => note && note.trim() !== '')
      .map(([code, note]) => {
        const item = INSTRUMEN_LIST.find((i) => i.code === code);
        return {
          code,
          title: item ? item.judul : `Butir ${code}`,
          juriLabel: currentEval?.verifiedBy ? `[Catatan ${currentEval.verifiedBy}]` : '[Catatan Tim Verifikator]',
          note
        };
      });
  }, [currentEval, pdfMultiJuri]);

  const pdfTanggalVerifikasi = useMemo(() => {
    if (currentEval.verifiedAt) {
      try {
        return new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date(currentEval.verifiedAt));
      } catch {}
    }
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }, [currentEval.verifiedAt]);

  const pdfKetuaJuriNama = useMemo(() => {
    return pdfMultiJuri.juriEntries[0]?.namaVerifikator || currentEval.verifiedBy || 'Dr. H. Mukotip, S.Ag., M.Pd.I';
  }, [pdfMultiJuri, currentEval.verifiedBy]);

  const cetakRaporPDF = async () => {
    if (currentEval.status !== 'VERIFIED') {
      showToast('Unduh Rapor PDF hanya dapat dilakukan jika satker sudah Terverifikasi oleh tim juri.');
      return;
    }

    showToast('Menyiapkan dokumen PDF, harap tunggu sebentar...');

    const elementTemplate = document.getElementById('template-rapor-pdf');
    if (!elementTemplate) {
      showToast('Template dokumen rapor PDF tidak ditemukan di sistem.');
      return;
    }

    const win = window as any;
    if (!win.html2pdf) {
      showToast('Library pembuat PDF (html2pdf) sedang dimuat, silakan coba dalam beberapa detik.');
      return;
    }

    try {
      const opt = {
        margin:       0.5,
        filename:     `Rapor_Evaluasi_${currentUnit.nama.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await win.html2pdf().set(opt).from(elementTemplate).save();
    } catch (err) {
      console.error('Error html2pdf:', err);
      showToast('Terjadi kendala saat membuat PDF. Silakan gunakan tombol Lihat Rapor Evaluasi.');
    }
  };

  const handleSaveDraftClick = () => {
    if (!isCurrentUnitUnlocked) {
      showToast(`Formulir ${currentUnit.nama} masih terkunci! Masukkan PIN Satker (${expectedPin}) terlebih dahulu.`);
      return;
    }
    onSaveDraft(selectedUnitId, {
      status: currentEval.status === 'BELUM_ISI' ? 'DRAFT' : currentEval.status
    }, currentPin);
    showToast(`Draft evaluasi ${currentUnit.nama} berhasil disimpan ke sistem!`);
  };

  const handleSubmitClick = async () => {
    if (!isCurrentUnitUnlocked) {
      showToast(`Formulir ${currentUnit.nama} masih terkunci! Masukkan PIN Satker (${expectedPin}) terlebih dahulu.`);
      return;
    }
    const isVideoActive = isAspekActive(8, aspekConfig);
    const isComplete = answeredCount >= totalItemsCount && (!isVideoActive || Boolean(currentEval.videoUrl));
    if (!isComplete) {
      const ok = await showConfirmDialog({
        title: 'Formulir Belum Lengkap',
        text: `Perhatian: Anda belum melengkapi seluruh butir penilaian aktif (${answeredCount}/${totalItemsCount})${isVideoActive && !currentEval.videoUrl ? ' atau link video praktik' : ''}. Yakin ingin mengirim evaluasi sekarang?`,
        confirmButtonText: 'Tetap Kirim Evaluasi',
        cancelButtonText: 'Lengkapi Dahulu',
        icon: 'warning'
      });
      if (!ok) return;
    } else {
      const ok = await showConfirmDialog({
        title: 'Kirim Formulir Evaluasi Mandiri',
        text: `Kirim formulir evaluasi untuk ${currentUnit.nama}? Data akan diteruskan ke Tim Juri Verifikator dan disinkronkan ke Google Sheets.`,
        confirmButtonText: 'Kirim Sekarang',
        cancelButtonText: 'Periksa Kembali',
        icon: 'question'
      });
      if (!ok) return;
    }
    onSubmitEvaluation(selectedUnitId, currentPin);
    showToast(`Evaluasi ${currentUnit.nama} berhasil dikirim & disinkronkan ke Google Sheets!`);
  };

  // Extract YouTube ID if valid
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        const v = urlParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    } catch {
      return null;
    }
    return null;
  };

  const currentAspek = activeAspekList.find((a) => a.id === activeAspekId) || activeAspekList[0] || ASPEK_LIST[0];
  const itemsInCurrentAspek = INSTRUMEN_LIST.filter((item) => item.aspekId === currentAspek.id);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Satker Selection Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/90 relative animate-fade-in-up">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-widest bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300/60 shadow-2xs">
                Mode Satuan Kerja
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Evaluasi Mandiri (Self-Assessment)</span>
              {onOpenPanduanModal && (
                <>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={onOpenPanduanModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-950 bg-amber-200/90 hover:bg-amber-300 border border-amber-400 transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="Buka & Unduh Buku Panduan Satker Format PDF"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-900" />
                    <span>Buku Panduan (PDF)</span>
                  </button>
                </>
              )}
            </div>
            <h2
              className="font-black text-slate-900 tracking-tight"
              style={{ fontSize: '20px' }}
            >
              Lembar Kerja Pemenuhan Standar Pelayanan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              Pilih satuan kerja KUA, MIN, atau MTsN &amp; MAN, lengkapi pemenuhan 8 aspek pelayanan, dan lampirkan tautan bukti dukung yang valid.
            </p>
          </div>

          {/* Unit Selector Form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto flex-wrap">
            {/* Category Segmented Control */}
            <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 shadow-inner overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => handleCategoryChange('KUA')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  selectedKategori === 'KUA'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                KUA (18)
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('MIN')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  selectedKategori === 'MIN'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                MIN (12)
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('MTsN & MAN')}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  selectedKategori === 'MTsN & MAN'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                MTsN &amp; MAN (10)
              </button>
            </div>

            {/* Satker Dropdown */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] md:min-w-[320px] lg:min-w-[340px] flex-1 max-w-full">
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold rounded-2xl p-2.5 pl-3.5 pr-8 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all shadow-inner cursor-pointer"
              >
                {filteredUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current Satker Banner & Progress Status */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 text-amber-300 flex items-center justify-center font-bold text-lg shadow-md shrink-0 border border-amber-300/40">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="font-extrabold text-slate-900 tracking-tight"
                  style={{ fontSize: '31px' }}
                >
                  {currentUnit.nama}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {currentUnit.id}
                </span>
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: '#e5780a' }}
              >
                Kategori: <strong className="font-semibold" style={{ color: '#e5780a' }}>{currentUnit.kategori}</strong>
                {currentUnit.jenjang ? ` · Jenjang ${currentUnit.jenjang}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Pill */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <span
                className="px-3.5 py-1 rounded-full font-bold border shadow-2xs border-emerald-900/20"
                style={{
                  color: '#ffd804',
                  backgroundColor: '#315f3f',
                  fontSize: '13px'
                }}
              >
                {currentEval.status === 'VERIFIED'
                  ? 'Sudah Diverifikasi Juri'
                  : currentEval.status === 'SUBMITTED'
                  ? 'Menunggu Verifikasi Juri'
                  : currentEval.status === 'DRAFT'
                  ? 'Dalam Pengerjaan (Draft)'
                  : 'Belum Diisi'}
              </span>
            </div>

            {/* Rapor button if verified */}
            {currentEval.status === 'VERIFIED' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenRapor(currentUnit.id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat Rapor Evaluasi</span>
                </button>

                <button
                  type="button"
                  onClick={cetakRaporPDF}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 hover:from-amber-400 hover:via-amber-500 hover:to-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border border-amber-300/40"
                  title="Unduh Dokumen Rapor Evaluasi Resmi (PDF)"
                >
                  <Download className="w-3.5 h-3.5 text-amber-200" />
                  <span>Unduh Rapor Evaluasi (PDF)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PIN Security Status Banner */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          {!isCurrentUnitUnlocked ? (
            <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-950">
                      Formulir Terkunci (Mode Baca Saja)
                    </h4>
                    <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      Proteksi PIN Satker
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 mt-0.5 max-w-xl leading-relaxed">
                    Untuk mengisi skor mandiri, menginput tautan bukti dukung, atau mengirim evaluasi atas nama <strong>{currentUnit.nama}</strong>, silakan masukkan PIN Akses Satker.
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1 font-mono">
                    *Petunjuk Format PIN: <strong>{expectedPin}</strong>
                  </p>
                </div>
              </div>

              {/* Form Input PIN */}
              <form onSubmit={handleUnlockForm} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder={`Masukkan PIN (${expectedPin})`}
                    className="w-full sm:w-56 pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Kunci Form</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900">Akses Edit Terbuka</span>
                    <span className="text-[10px] font-mono bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      PIN: {currentPin}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Anda memiliki izin penuh untuk mengisi atau memperbarui data evaluasi {currentUnit.nama}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLockAgain}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors self-end sm:self-auto cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Kunci Kembali</span>
              </button>
            </div>
          )}

          {pinError && (
            <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}
        </div>

        {/* Real-time Progress & Projected Score Bar */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Kelengkapan Pengisian</span>
              <span className="font-mono font-bold text-emerald-800">
                {answeredCount}/{totalItemsCount} butir ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-y md:border-y-0 md:border-x border-slate-200 px-0 md:px-4 py-2 md:py-0">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Skor Mandiri Terbobot
              </p>
              <p className="text-xs text-slate-400">Skala 0 - 100</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-bold text-slate-900">
                {scoreResult.nilaiAkhirTerbobot.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Proyeksi Predikat
              </p>
              <p className="text-xs text-slate-400">{scoreResult.predikat.deskripsi.slice(0, 32)}...</p>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${scoreResult.predikat.colorClass}`}
              >
                {scoreResult.predikat.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aspek Tabs Navigation (Hanya Menampilkan Aspek yang Berstatus Aktif) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max p-1">
          {activeAspekList.map((aspek) => {
            const isActive = aspek.id === activeAspekId;
            const items = INSTRUMEN_LIST.filter((i) => i.aspekId === aspek.id);
            const answeredInAspek = items.filter((i) => currentEval.responses?.[i.code] !== undefined).length;
            const isFull = answeredInAspek === items.length;

            return (
              <button
                key={aspek.id}
                type="button"
                onClick={() => setActiveAspekId(aspek.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 flex items-center gap-2.5 border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 text-white border-emerald-800 shadow-md shadow-emerald-950/20 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-xs'
                      : isFull
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {aspek.id}
                </span>
                <span className="whitespace-nowrap">{aspek.nama}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono tabular-nums ${
                    isActive
                      ? 'bg-emerald-800/80 text-amber-300 font-bold border border-emerald-700/50'
                      : 'bg-slate-200/80 text-slate-600 font-medium'
                  }`}
                >
                  {aspek.bobot}%
                </span>
                {isFull && !isActive && (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Aspect Detail Header */}
      <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#042f2e] text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-emerald-950/15 border border-emerald-600/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-amber-300 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-amber-400/40">
              Aspek {currentAspek.id}
            </span>
            <span className="text-xs text-emerald-200/90 font-medium">Bobot Penilaian: {currentAspek.bobot}% (Skor Maks: {currentAspek.skorMaks})</span>
            
            {/* Indikator Auto-Save (Draft Visual) */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all duration-300 ease-in-out border ${
                autoSaveStatus === 'saving_local'
                  ? 'bg-amber-950 text-amber-300 border-amber-400/80 shadow-xs animate-pulse'
                  : autoSaveStatus === 'synced_server'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-400/80 shadow-xs'
                  : autoSaveStatus === 'offline'
                  ? 'bg-rose-950 text-rose-300 border-rose-400/80 shadow-xs'
                  : 'bg-emerald-950/40 text-emerald-300/70 border-emerald-800/40'
              }`}
            >
              <span className="text-xs">
                {autoSaveStatus === 'saving_local' && '⏳'}
                {autoSaveStatus === 'synced_server' && '🟢'}
                {autoSaveStatus === 'offline' && '🔴'}
                {autoSaveStatus === 'idle' && '•'}
              </span>
              <span>
                {autoSaveStatus === 'saving_local' && 'Menyimpan di perangkat...'}
                {autoSaveStatus === 'synced_server' && 'Draft tersimpan ke server'}
                {autoSaveStatus === 'offline' && 'Offline (Tersimpan di perangkat lokal)'}
                {autoSaveStatus === 'idle' && 'Pilih isian untuk mulai mengevaluasi'}
              </span>
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{currentAspek.nama}</h3>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl">{currentAspek.keterangan}</p>
        </div>

        <div className="text-right shrink-0 bg-emerald-950/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-700/60 shadow-inner">
          <p className="text-[10px] uppercase text-emerald-300 font-bold tracking-wider">Perolehan Skor Aspek</p>
          <p className="font-mono text-2xl font-black text-amber-300 tabular-nums mt-0.5">
            {scoreResult.aspekScores.find((a) => a.aspekId === currentAspek.id)?.nilaiTerbobot.toFixed(2)} / {currentAspek.bobot.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Kotak Informasi Bukti Dukung Terpusat (Google Drive Kankemenag) */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
            {/* Google Drive Logo */}
            <svg className="w-5 h-5" viewBox="0 0 87.3 78">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25 29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.55h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.2-2.1 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.4l6.15 10.65z" fill="#ea4335"/>
              <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
              <path d="M59.4 53.6H27.5L13.75 77.4c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.55 76.8 12.55-21.75c.8-1.4 1.2-2.95 1.2-4.5 0-1.55-.4-3.1-1.2-4.5L64.75 6.3C63.95 4.9 62.8 3.8 61.45 3L47.7 26.8l11.7 20.25z" fill="#ffba00"/>
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-1.5">
              <span>💡</span>
              <span>Informasi Bukti Dukung:</span>
            </h4>
            <p className="text-xs text-blue-900/90 leading-relaxed max-w-3xl">
              Anda dapat melampirkan tautan/link Google Drive milik satker Anda masing-masing pada setiap butir penilaian. Namun, jika Anda ingin mengunggah file secara langsung, silakan gunakan Folder Drive Terpusat berikut:
            </p>
          </div>
        </div>
        <a
          href={CENTRAL_DRIVE_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 shrink-0 cursor-pointer border border-blue-500"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#ffffff" fillOpacity="0.95"/>
            <path d="M43.65 25 29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.55h27.5z" fill="#ffffff" fillOpacity="0.95"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.2-2.1 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.4l6.15 10.65z" fill="#ffffff" fillOpacity="0.95"/>
            <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#ffffff" fillOpacity="0.95"/>
            <path d="M59.4 53.6H27.5L13.75 77.4c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#ffffff" fillOpacity="0.95"/>
            <path d="m73.55 76.8 12.55-21.75c.8-1.4 1.2-2.95 1.2-4.5 0-1.55-.4-3.1-1.2-4.5L64.75 6.3C63.95 4.9 62.8 3.8 61.45 3L47.7 26.8l11.7 20.25z" fill="#ffffff" fillOpacity="0.95"/>
          </svg>
          <span>Buka Folder Upload Bukti Dukung</span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
        </a>
      </div>

      {/* Aspect Questions or Special Video Section */}
      {currentAspek.id !== 8 ? (
        <div className="space-y-6">
          {itemsInCurrentAspek.map((item, index) => {
            const currentSelectedScore = currentEval.responses?.[item.code];
            const currentLink = currentEval.links?.[item.code] || '';

            return (
              <div
                key={item.code}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6 transition-all hover:border-slate-300"
              >
                {/* Header Butir */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-mono font-bold">
                      Butir {item.code}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{item.judul}</h4>
                  </div>
                  {currentSelectedScore !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Terpilih: Skor {currentSelectedScore}</span>
                    </div>
                  )}
                </div>

                {/* Pertanyaan */}
                <p className="text-sm font-medium text-slate-800 mb-5 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  {item.pertanyaan}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* 5 Radio Options (Left side: 8 cols) */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Pilih Kriteria Skor yang Sesuai dengan Kondisi Unit Anda:
                    </label>

                    {item.opsi.map((teksKriteria, skorVal) => {
                      const isChecked = currentSelectedScore === skorVal;
                      return (
                        <label
                          key={skorVal}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                            !isCurrentUnitUnlocked
                              ? 'opacity-80 cursor-not-allowed bg-slate-50/50 border-slate-200'
                              : isChecked
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-xs cursor-pointer'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`radio-${item.code}`}
                            value={skorVal}
                            checked={isChecked}
                            disabled={!isCurrentUnitUnlocked}
                            onChange={() => handleScoreSelect(item.code, skorVal)}
                            className="mt-1 w-4 h-4 text-emerald-700 border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
                          />
                          <div className="text-xs text-slate-700 leading-relaxed">
                            <span
                              className={`inline-block font-mono font-bold px-1.5 py-0.5 rounded text-[11px] mr-1.5 ${
                                isChecked
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              Skor {skorVal}
                            </span>
                            <span>{teksKriteria}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Supporting Evidence Input (Right side: 5 cols) */}
                  <div className="lg:col-span-5 bg-slate-50/90 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <FileCheck className="w-4 h-4 text-emerald-700" />
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Link Bukti Dukung
                        </label>
                      </div>

                      <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-lg mb-3">
                        <p className="text-[11px] text-amber-900 leading-snug">
                          <strong>Format Bukti yang Diminta:</strong>
                          <br />
                          {item.buktiDukung}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <p className="text-[11px] text-slate-500 font-medium">
                          Tautan Dokumen / Bukti Dukung:
                        </p>
                        {LINK_FOLDER_BUKTI[item.code] && (
                          <a
                            href={LINK_FOLDER_BUKTI[item.code]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold shadow-xs transition-colors self-start sm:self-auto"
                            title={`Buka subfolder Google Drive butir ${item.code}`}
                          >
                            <FolderUp className="w-3.5 h-3.5 text-blue-600" />
                            <span>📤 Buka Folder {item.code}</span>
                          </a>
                        )}
                      </div>

                      <input
                        type="url"
                        value={currentLink}
                        disabled={!isCurrentUnitUnlocked}
                        onChange={(e) => handleLinkChange(item.code, e.target.value)}
                        onInput={(e) => handleLinkChange(item.code, (e.target as HTMLInputElement).value)}
                        placeholder={isCurrentUnitUnlocked ? "Masukkan Link Google Drive file Anda di sini..." : "Form terkunci — masukkan PIN untuk mengisi bukti"}
                        className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />

                      <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                        Klik tombol di atas, buat folder baru dengan nama Satker Anda, unggah file, lalu copy-paste link file Anda ke kolom ini.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        *Pastikan izin tautan disetel &quot;Anyone with the link can view&quot;.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      {currentLink ? (
                        <a
                          href={currentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Uji Buka Tautan Bukti</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada tautan bukti</span>
                      )}
                      <span className="text-slate-400">PDF / Foto / SK</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ASPEK 8: VIDEO PRAKTIK PELAYANAN */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Pengunggahan Video Praktik Pelayanan Publik (3 - 5 Menit)
                </h4>
                <p className="text-xs text-slate-500">
                  Unit kerja menginput 1 (satu) link video YouTube atau Google Drive. Video ini dinilai langsung oleh Tim Juri berdasarkan 3 butir rubrik.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Video URL & Deskripsi Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Tautan Video Resmi (YouTube / Google Drive) *
                    </label>
                    {LINK_FOLDER_BUKTI["8.1"] && (
                      <a
                        href={LINK_FOLDER_BUKTI["8.1"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold shadow-xs transition-colors self-start sm:self-auto"
                        title="Buka subfolder Google Drive video praktik pelayanan"
                      >
                        <FolderUp className="w-3.5 h-3.5 text-blue-600" />
                        <span>📤 Buka Folder 8.1</span>
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={currentEval.videoUrl || ''}
                    disabled={!isCurrentUnitUnlocked}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    onInput={(e) => handleVideoUrlChange((e.target as HTMLInputElement).value)}
                    placeholder={isCurrentUnitUnlocked ? "Masukkan Link Google Drive file Anda di sini... (atau tautan YouTube)" : "Form terkunci — masukkan PIN untuk mengisi tautan video"}
                    className="w-full bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed border border-slate-300 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                    Klik tombol di atas jika ingin mengunggah video ke Drive. Buat folder nama satker Anda, unggah video, lalu salin link-nya ke kolom ini. Rekomendasi: Unggah ke YouTube (status Publik/Unlisted) agar pratinjau player dapat diputar langsung oleh Juri.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Deskripsi Ringkas Inovasi & Alur dalam Video
                  </label>
                  <textarea
                    rows={4}
                    value={currentEval.videoDeskripsi || ''}
                    disabled={!isCurrentUnitUnlocked}
                    onChange={(e) => handleVideoDeskripsiChange(e.target.value)}
                    onInput={(e) => handleVideoDeskripsiChange((e.target as HTMLTextAreaElement).value)}
                    placeholder={isCurrentUnitUnlocked ? "Jelaskan secara singkat jenis layanan yang divisualisasikan, inovasi PTSP, peragaan budaya 5S, penolakan gratifikasi, serta fasilitas disabilitas..." : "Form terkunci — masukkan PIN untuk mengisi deskripsi video"}
                    className="w-full bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed border border-slate-300 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {currentEval.videoUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={currentEval.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Tautan Video di Tab Baru
                    </a>
                  </div>
                )}
              </div>

              {/* Video Player Preview */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-center items-center min-h-[260px] p-2 text-white">
                {getYouTubeEmbedUrl(currentEval.videoUrl) ? (
                  <iframe
                    className="w-full h-full min-h-[250px] rounded-xl"
                    src={getYouTubeEmbedUrl(currentEval.videoUrl)!}
                    title="Pratinjau Video Praktik Pelayanan"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : currentEval.videoUrl ? (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <Play className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold">Tautan Video Terdaftar</p>
                    <p className="text-xs text-slate-400 max-w-sm truncate">{currentEval.videoUrl}</p>
                    <a
                      href={currentEval.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Pratinjau Video
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <Video className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Belum ada tautan video yang dimasukkan. Masukkan URL YouTube atau Google Drive di sebelah kiri untuk melihat pratinjau.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rubrik Penilaian Video & Klaim Mandiri */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Rubrik Penilaian Video &amp; Klaim Mandiri (3 Butir - Bobot 20%)
                </h4>
                <p className="text-xs text-slate-500">
                  Tentukan skor klaim mandiri (0 s.d. 4) yang sesuai dengan konten video yang Anda unggah. Skor ini akan diverifikasi oleh Tim Juri.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-lg self-start sm:self-auto">
                Bobot Aspek: 20%
              </span>
            </div>

            <div className="space-y-6">
              {INSTRUMEN_LIST.filter((i) => i.aspekId === 8).map((rubrik) => {
                const currentSelectedScore = currentEval.responses?.[rubrik.code];
                return (
                  <div key={rubrik.code} className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg">
                          Butir {rubrik.code}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900">{rubrik.judul}</h5>
                      </div>
                      {currentSelectedScore !== undefined && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Klaim Mandiri: Skor {currentSelectedScore}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                      {rubrik.pertanyaan}
                    </p>

                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Pilih Kriteria Skor Klaim Mandiri:
                      </label>
                      {rubrik.opsi.map((opsiText, skorVal) => {
                        const isChecked = currentSelectedScore === skorVal;
                        return (
                          <label
                            key={skorVal}
                            className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                              !isCurrentUnitUnlocked
                                ? 'opacity-80 cursor-not-allowed bg-slate-50/50 border-slate-200'
                                : isChecked
                                ? 'bg-emerald-50 border-emerald-500 shadow-xs cursor-pointer'
                                : 'bg-white border-slate-200 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`radio-${rubrik.code}`}
                              value={skorVal}
                              checked={isChecked}
                              disabled={!isCurrentUnitUnlocked}
                              onChange={() => handleScoreSelect(rubrik.code, skorVal)}
                              className="mt-0.5 text-emerald-700 disabled:cursor-not-allowed"
                            />
                            <div className="text-xs text-slate-700 leading-snug">
                              <span
                                className={`inline-block font-mono font-bold px-1.5 py-0.2 rounded text-[10px] mr-1.5 ${
                                  isChecked ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                Skor {skorVal}
                              </span>
                              <span>{opsiText}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Form Action Controls (Bottom Bar) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          {!isCurrentUnitUnlocked ? (
            <>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-amber-900 font-medium">
                Formulir dalam proteksi kunci PIN. Masukkan PIN di atas untuk menyimpan atau mengirim.
              </span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-slate-600 font-medium">
                Akses edit aktif (PIN terverifikasi). Perubahan akan otomatis disinkronkan ke basis data.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveDraftClick}
            disabled={!isCurrentUnitUnlocked}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
              !isCurrentUnitUnlocked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer shadow-xs active:scale-95'
            }`}
          >
            {!isCurrentUnitUnlocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Save className="w-4 h-4 text-slate-600" />}
            <span>Simpan Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={!isCurrentUnitUnlocked}
            className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
              !isCurrentUnitUnlocked
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-emerald-900/25 cursor-pointer active:scale-95 hover:shadow-lg'
            }`}
          >
            {!isCurrentUnitUnlocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Send className="w-4 h-4 text-white" />}
            <span>Kirim / Submit Evaluasi</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TEMPLATE RAPOR / DOKUMEN CETAK PDF (HIDDEN DI UI, CETAK PDF) */}
      {/* ========================================================= */}
      <div
        id="template-rapor-pdf"
        aria-hidden="true"
        className="font-serif text-black bg-white"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          padding: '40px 48px',
          backgroundColor: '#ffffff',
          color: '#111827',
          zIndex: -100,
          pointerEvents: 'none',
          boxSizing: 'border-box'
        }}
      >
        {/* KOP SURAT */}
        <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', letterSpacing: '0.05em', color: '#000000', textTransform: 'uppercase' }}>
            KEMENTERIAN AGAMA REPUBLIK INDONESIA
          </div>
          <div style={{ fontSize: '15pt', fontWeight: 800, letterSpacing: '0.02em', color: '#000000', textTransform: 'uppercase', marginTop: '2px' }}>
            KANTOR KEMENTERIAN AGAMA KABUPATEN GUNUNGKIDUL
          </div>
          <div style={{ fontSize: '9pt', color: '#374151', marginTop: '4px' }}>
            Jl. Brigjen Katamso No. 13, Wonosari, Gunungkidul, D.I. Yogyakarta 55812
          </div>
          <div style={{ fontSize: '9pt', color: '#374151' }}>
            Telepon: (0274) 391442 | Pos-el: kabgunungkidul@kemenag.go.id | Laman: gunungkidul.kemenag.go.id
          </div>

          {/* Garis Bawah Ganda Tebal */}
          <div style={{ borderBottom: '2px solid #000000', marginTop: '12px' }} />
          <div style={{ borderBottom: '4px solid #000000', marginTop: '2px' }} />
        </div>

        {/* JUDUL RAPOR */}
        <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '18px' }}>
          <div style={{ fontSize: '13pt', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline', color: '#000000', letterSpacing: '0.05em' }}>
            RAPOR EVALUASI PEMENUHAN STANDAR PELAYANAN PUBLIK
          </div>
          <div style={{ fontSize: '9.5pt', fontWeight: 600, color: '#374151', marginTop: '3px' }}>
            Sistem Evaluasi dan Pemantauan Pelayanan Publik (SI-EPP) Tahun 2026
          </div>
        </div>

        {/* IDENTITAS SATKER */}
        <div style={{ marginBottom: '18px', fontSize: '10pt' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '180px', padding: '3px 0', fontWeight: 'bold' }}>Nama Satuan Kerja</td>
                <td style={{ width: '15px', padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{currentUnit.nama}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Kategori Satker</td>
                <td style={{ padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0' }}>
                  {currentUnit.kategori} {currentUnit.jenjang ? `(Jenjang ${currentUnit.jenjang})` : ''}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Kapanewon / Wilayah</td>
                <td style={{ padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0' }}>{currentUnit.kapanewon || 'Gunungkidul'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Tanggal Verifikasi</td>
                <td style={{ padding: '3px 0' }}>:</td>
                <td style={{ padding: '3px 0' }}>{pdfTanggalVerifikasi}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* HASIL AKHIR & PREDIKAT */}
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            border: '2px solid #000000',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#4b5563', letterSpacing: '0.05em' }}>
              HASIL EVALUASI TIM VERIFIKATOR / PANEL JURI:
            </div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#000000', marginTop: '4px' }}>
              Predikat Pelayanan: <span style={{ textTransform: 'uppercase' }}>{pdfJuriScoreResult.predikat.kode}</span> ({pdfJuriScoreResult.predikat.label})
            </div>
            <div style={{ fontSize: '8.5pt', color: '#4b5563', marginTop: '2px', fontStyle: 'italic' }}>
              Total Bobot Aktif: {pdfJuriScoreResult.totalBobotAktif ?? 100}% {((pdfJuriScoreResult.totalBobotAktif ?? 100) < 100) ? '(Sebagian Aspek Dikecualikan)' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>
              NILAI AKHIR TERBOBOT
            </div>
            <div style={{ fontSize: '26pt', fontWeight: 900, color: '#000000', lineHeight: 1 }}>
              {pdfJuriScoreResult.nilaiAkhirTerbobot.toFixed(2)}
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#4b5563', marginTop: '2px' }}>
              dari skala 100.00
            </div>
          </div>
        </div>

        {/* TABEL RINCIAN ASPEK (ASPEK AKTIF SAJA) */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', color: '#000000' }}>
            I. Rincian Penilaian Aspek Pelayanan (Mandiri vs Tim Verifikator)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '32px' }}>No</th>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left' }}>Aspek Pelayanan</th>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '68px' }}>Bobot (%)</th>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '85px' }}>Skor Mandiri</th>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '105px' }}>Skor Rata-rata Juri</th>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '75px' }}>Capaian (%)</th>
                <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', width: '80px' }}>Nilai Terbobot</th>
              </tr>
            </thead>
            <tbody>
              {pdfActiveAspectScores.map((asp, idx) => {
                const selfAsp = pdfSelfScoreResult.aspekScores.find((s) => s.aspekId === asp.aspekId);
                return (
                  <tr key={asp.aspekId}>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px' }}>{asp.nama}</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'center' }}>{asp.bobot}%</td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'center' }}>
                      {selfAsp ? `${selfAsp.perolehanSkor} / ${selfAsp.skorMaksimal}` : '-'}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {asp.perolehanSkor} / {asp.skorMaksimal}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'center' }}>
                      {asp.persentase.toFixed(1)}%
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {asp.nilaiTerbobot.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                <td colSpan={2} style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center', textTransform: 'uppercase' }}>
                  Total Nilai Akhir (Bobot Aktif: {pdfJuriScoreResult.totalBobotAktif ?? 100}%)
                </td>
                <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center' }}>
                  {pdfJuriScoreResult.totalBobotAktif ?? 100}%
                </td>
                <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center' }}>
                  {pdfSelfScoreResult.totalPerolehan} / {pdfSelfScoreResult.totalSkorMaksimal}
                </td>
                <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center' }}>
                  {pdfJuriScoreResult.totalPerolehan} / {pdfJuriScoreResult.totalSkorMaksimal}
                </td>
                <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center' }}>
                  {pdfJuriScoreResult.totalSkorMaksimal > 0
                    ? `${((pdfJuriScoreResult.totalPerolehan / pdfJuriScoreResult.totalSkorMaksimal) * 100).toFixed(1)}%`
                    : '0.0%'}
                </td>
                <td style={{ border: '1px solid #000000', padding: '7px 8px', textAlign: 'center', fontSize: '10.5pt', fontWeight: 900 }}>
                  {pdfJuriScoreResult.nilaiAkhirTerbobot.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DAFTAR CATATAN EVALUASI JURI */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', color: '#000000' }}>
            II. Catatan &amp; Rekomendasi Perbaikan Tim Verifikator
          </div>
          {pdfNotesList.length > 0 ? (
            <div style={{ border: '1px solid #000000', padding: '10px 14px', backgroundColor: '#fcfcfc', fontSize: '8.5pt' }}>
              {pdfNotesList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    paddingBottom: idx === pdfNotesList.length - 1 ? 0 : '8px',
                    marginBottom: idx === pdfNotesList.length - 1 ? 0 : '8px',
                    borderBottom: idx === pdfNotesList.length - 1 ? 'none' : '1px dashed #d1d5db'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#000000' }}>
                    <span>{item.code} — {item.title}</span>
                    <span style={{ marginLeft: '6px', fontSize: '8pt', color: '#374151' }}>{item.juriLabel}</span>
                  </div>
                  <div style={{ marginTop: '2px', color: '#1f2937', fontStyle: 'italic' }}>
                    "{item.note}"
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '1px solid #000000', padding: '10px 14px', backgroundColor: '#fcfcfc', fontSize: '8.5pt', fontStyle: 'italic', color: '#4b5563' }}>
              Tidak ada catatan rekomendasi perbaikan khusus dari Tim Verifikator. Dokumen dan pemenuhan standar pelayanan telah dinyatakan lengkap.
            </div>
          )}
        </div>

        {/* KOLOM TANDA TANGAN (DUA KOLOM) */}
        <div style={{ marginTop: '30px', pageBreakInside: 'avoid' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingRight: '20px' }}>
                  <div>Mengetahui,</div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Ketua Tim Verifikator</div>
                  <div style={{ height: '65px' }} />
                  <div style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                    {pdfKetuaJuriNama}
                  </div>
                  <div style={{ color: '#374151', fontSize: '8.5pt' }}>NIP. 197003151998031002</div>
                </td>
                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingLeft: '20px' }}>
                  <div>Wonosari, {pdfTanggalVerifikasi}</div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Kepala {currentUnit.nama}</div>
                  <div style={{ height: '65px' }} />
                  <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                    ( .............................................................. )
                  </div>
                  <div style={{ color: '#374151', fontSize: '8.5pt' }}>NIP. .........................................................</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FITUR 20: INDIKATOR UI AUTO-SAVE (STICKY POJOK KANAN BAWAH) */}
      {/* ========================================================= */}
      <aside
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 right-5 z-40 transition-all duration-300 ease-in-out no-print pointer-events-auto select-none ${
          isFading ? 'opacity-85' : 'opacity-100'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl backdrop-blur-md border transition-all duration-300 ease-in-out ${
            autoSaveStatus === 'saving_local'
              ? 'bg-amber-50/95 text-amber-900 border-amber-300 shadow-amber-500/20'
              : autoSaveStatus === 'synced_server'
              ? 'bg-emerald-50/95 text-emerald-900 border-emerald-300 shadow-emerald-500/20'
              : autoSaveStatus === 'offline'
              ? 'bg-rose-50/95 text-rose-900 border-rose-300 shadow-rose-500/20'
              : 'bg-white/95 text-slate-700 border-slate-200/90 shadow-slate-900/10'
          }`}
        >
          {autoSaveStatus === 'saving_local' && (
            <>
              <span className="text-xs">⏳</span>
              <span className="tracking-tight font-bold">Menyimpan di perangkat...</span>
            </>
          )}
          {autoSaveStatus === 'synced_server' && (
            <>
              <span className="text-xs">🟢</span>
              <span className="tracking-tight font-bold text-emerald-900">Draft tersimpan ke server</span>
            </>
          )}
          {autoSaveStatus === 'offline' && (
            <>
              <span className="text-xs">🔴</span>
              <span className="tracking-tight font-bold text-rose-900">Offline (Tersimpan di perangkat lokal)</span>
            </>
          )}
          {autoSaveStatus === 'idle' && (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
              <span className="tracking-tight text-slate-600 font-medium">Pilih isian untuk mulai mengevaluasi</span>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
