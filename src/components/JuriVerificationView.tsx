import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Gavel,
  Lock,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  Users,
  Video,
  X
} from 'lucide-react';
import { ASPEK_LIST, INSTRUMEN_LIST } from '../data/instruments';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import { KategoriUnit, SatkerEvaluation, StatusEvaluasi } from '../types';
import { calculateBaseScore, calculateEvaluationScore, getMultiJuriSummary } from '../utils/scoring';
import { useCategoryAspekConfig, isAspekActive, DEFAULT_ASPEK_CONFIG } from '../utils/aspekConfig';

interface JuriVerificationViewProps {
  evaluations: Record<string, SatkerEvaluation>;
  juriId?: string;
  verifierName?: string;
  isSyncing?: boolean;
  onSaveVerification: (
    unitId: string,
    verifScores: Record<string, number>,
    verifNotes: Record<string, string>,
    verifierName?: string,
    juriId?: string
  ) => void;
  onOpenRapor: (unitId: string) => void;
  onLogoutJuri?: () => void;
  onChangeVerifier?: () => void;
}

export const JuriVerificationView: React.FC<JuriVerificationViewProps> = ({
  evaluations,
  juriId = 'JURI-1',
  verifierName = 'Dr. H. Mukotip, S.Ag., M.Pd.I',
  isSyncing = false,
  onSaveVerification,
  onOpenRapor,
  onLogoutJuri,
  onChangeVerifier
}) => {
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVerifierName, setActiveVerifierName] = useState<string>(verifierName);
  const [showOtherJuriesCard, setShowOtherJuriesCard] = useState<boolean>(true);

  // Dynamic Aspects Configuration per Kategori Satker
  const [categoryAspekConfig] = useCategoryAspekConfig();

  // Active workspace for verifying a satker
  const [verifyingUnitId, setVerifyingUnitId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<number>(1); // 1-8 Aspek

  const verifyingUnit = useMemo(() => {
    return DAFTAR_UNIT_KERJA.find((u) => u.id === verifyingUnitId);
  }, [verifyingUnitId]);

  const activeUnitAspekConfig = useMemo(() => {
    if (verifyingUnit) {
      return categoryAspekConfig[verifyingUnit.kategori] || DEFAULT_ASPEK_CONFIG;
    }
    return categoryAspekConfig['KUA'] || DEFAULT_ASPEK_CONFIG;
  }, [verifyingUnit, categoryAspekConfig]);

  const activeAspekList = useMemo(() => {
    return ASPEK_LIST.filter((a) => isAspekActive(a.id, activeUnitAspekConfig));
  }, [activeUnitAspekConfig]);

  useEffect(() => {
    if (verifierName) {
      setActiveVerifierName(verifierName);
    }
  }, [verifierName]);

  // Ensure activeWorkspaceTab points to an active aspect
  useEffect(() => {
    if (!isAspekActive(activeWorkspaceTab, activeUnitAspekConfig)) {
      const fallback = activeAspekList[0]?.id || 1;
      setActiveWorkspaceTab(fallback);
    }
  }, [activeUnitAspekConfig, activeWorkspaceTab, activeAspekList]);

  // Temporary state inside verification session
  const [tempVerifScores, setTempVerifScores] = useState<Record<string, number>>({});
  const [tempVerifNotes, setTempVerifNotes] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered unit list
  const filteredUnits = useMemo(() => {
    return DAFTAR_UNIT_KERJA.filter((unit) => {
      const evalData = evaluations[unit.id];
      const status: StatusEvaluasi = evalData?.status || 'BELUM_ISI';
      const hasMyAssessment = Boolean(evalData?.verifikasiJuri?.[juriId]);

      if (selectedKategori !== 'ALL' && unit.kategori !== selectedKategori) return false;
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'MY_PENDING' && hasMyAssessment) return false;
        if (selectedStatus === 'MY_DONE' && !hasMyAssessment) return false;
        if (selectedStatus === 'SUBMITTED' && status !== 'SUBMITTED') return false;
        if (selectedStatus === 'VERIFIED' && status !== 'VERIFIED') return false;
        if (selectedStatus === 'DRAFT' && status !== 'DRAFT' && status !== 'BELUM_ISI') return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = unit.nama.toLowerCase().includes(query);
        const matchKapanewon = unit.kapanewon.toLowerCase().includes(query);
        const matchId = unit.id.toLowerCase().includes(query);
        if (!matchName && !matchKapanewon && !matchId) return false;
      }
      return true;
    });
  }, [evaluations, selectedKategori, selectedStatus, searchQuery, juriId]);

  // Open verification modal/workspace
  const handleStartVerification = (unitId: string) => {
    const evalData = evaluations[unitId];
    setVerifyingUnitId(unitId);
    setActiveWorkspaceTab(activeAspekList[0]?.id || 1);

    // Requirement 2:
    // Ketika JURI-1 membuka satker, form menampilkan skor dan catatan milik JURI-1.
    // Ketika JURI-2 membuka satker yang sama, form mulai dari kosong (atau memuat isian JURI-2 sebelumnya)
    // tanpa mengubah nilai milik JURI-1.
    const existingJuriEntry = evalData?.verifikasiJuri?.[juriId];
    const initialScores: Record<string, number> = {};
    const initialNotes: Record<string, string> = {};

    INSTRUMEN_LIST.forEach((item) => {
      if (existingJuriEntry && typeof existingJuriEntry.scores?.[item.code] === 'number') {
        initialScores[item.code] = existingJuriEntry.scores[item.code];
        initialNotes[item.code] = existingJuriEntry.notes?.[item.code] || '';
      } else {
        // Form mulai dari kosong untuk juri baru (skor 0 dan catatan kosong)
        initialScores[item.code] = 0;
        initialNotes[item.code] = '';
      }
    });

    setTempVerifScores(initialScores);
    setTempVerifNotes(initialNotes);
  };

  const handleScoreChange = (code: string, score: number) => {
    setTempVerifScores((prev) => ({ ...prev, [code]: score }));
  };

  const handleNoteChange = (code: string, note: string) => {
    setTempVerifNotes((prev) => ({ ...prev, [code]: note }));
  };

  // Copy all self scores as base
  const handleCopySelfScores = () => {
    if (!verifyingUnitId) return;
    const evalData = evaluations[verifyingUnitId];
    if (!evalData?.responses) return;

    setTempVerifScores((prev) => ({
      ...prev,
      ...evalData.responses
    }));
    showToast('Seluruh skor klaim mandiri berhasil disalin ke lembar verifikasi Anda.');
  };

  const handleSaveAndPublish = () => {
    if (!verifyingUnitId) return;
    onSaveVerification(verifyingUnitId, tempVerifScores, tempVerifNotes, activeVerifierName, juriId);
    showToast(`Hasil verifikasi [${juriId}] berhasil disimpan dan disinkronkan ke Google Sheets!`);
    setVerifyingUnitId(null);
  };

  const verifyingEval = useMemo(() => {
    if (!verifyingUnitId) return null;
    return evaluations[verifyingUnitId] || null;
  }, [verifyingUnitId, evaluations]);

  // Real-time calculation of this individual juri's score with category-specific active weights
  const currentJuriScoreResult = useMemo(() => {
    return calculateBaseScore(tempVerifScores, activeUnitAspekConfig);
  }, [tempVerifScores, activeUnitAspekConfig]);

  const currentSelfScoreResult = useMemo(() => {
    if (!verifyingEval) return null;
    return calculateEvaluationScore(verifyingEval, 'self', activeUnitAspekConfig);
  }, [verifyingEval, activeUnitAspekConfig]);

  // Other juries who evaluated this unit
  const otherJuriesEntries = useMemo(() => {
    if (!verifyingEval?.verifikasiJuri) return [];
    return Object.values(verifyingEval.verifikasiJuri).filter((j) => j.juriId !== juriId);
  }, [verifyingEval, juriId]);

  // Simulated average score if this juri submits
  const simulatedAverageScore = useMemo(() => {
    const scores = [currentJuriScoreResult.nilaiAkhirTerbobot];
    otherJuriesEntries.forEach((oj) => {
      const recalculated = calculateBaseScore(oj.scores, activeUnitAspekConfig);
      scores.push(recalculated.nilaiAkhirTerbobot);
    });
    const sum = scores.reduce((a, b) => a + b, 0);
    return Number((sum / scores.length).toFixed(2));
  }, [currentJuriScoreResult, otherJuriesEntries, activeUnitAspekConfig]);

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

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/90 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300/60 shadow-2xs">
                Portal Tim Penilai &amp; Verifikator
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Panel Verifikasi Standar Pelayanan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verifikasi Lapangan &amp; Penilaian Mutu Satker
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Pilih satuan kerja untuk membuka lembar verifikasi berdampingan (Side-by-Side) antara klaim mandiri dan penilaian juri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Badge Aktif Login sebagai: [ID Juri] - [Nama Verifikator] */}
            <div className="flex items-center gap-3 text-xs text-emerald-950 bg-emerald-50/90 px-4 py-2.5 rounded-2xl border border-emerald-300/80 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Login sebagai:
                </span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono bg-gradient-to-r from-emerald-800 to-emerald-900 text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs">
                    {juriId}
                  </span>
                  <span>{activeVerifierName}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onChangeVerifier && (
                <button
                  type="button"
                  onClick={onChangeVerifier}
                  className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-300/90 rounded-2xl text-xs font-bold text-slate-700 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  title="Ganti ke akun Juri lain (Multi-Juri Dinamis)"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ganti Verifikator</span>
                </button>
              )}

              {onLogoutJuri && (
                <button
                  type="button"
                  onClick={onLogoutJuri}
                  className="px-3.5 py-2.5 bg-slate-100/90 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  title="Keluar dari Mode Juri"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{onChangeVerifier ? 'Logout' : 'Ganti Verifikator / Logout'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Kategori Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs shadow-inner">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori (40)</option>
                <option value="KUA">Kategori KUA (18)</option>
                <option value="MIN">Kategori MIN (12)</option>
                <option value="MTsN & MAN">Kategori MTsN &amp; MAN (10)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs shadow-inner">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="SUBMITTED">Menunggu Verifikasi (Submitted)</option>
                <option value="VERIFIED">Sudah Diverifikasi</option>
                <option value="DRAFT">Draft / Belum Isi</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-auto md:min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama satker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Satker Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-16 text-center">No</th>
                <th className="py-3.5 px-4">Nama Satuan Kerja</th>
                <th className="py-3.5 px-4">Kategori / Kapanewon</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Skor Mandiri</th>
                <th className="py-3.5 px-4 text-right">Nilai Juri</th>
                <th className="py-3.5 px-4 text-center">Predikat</th>
                <th className="py-3.5 px-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isSyncing ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-3.5 w-6 bg-slate-200 rounded mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-44 bg-slate-200 rounded mb-1.5"></div>
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-5 w-20 bg-slate-200 rounded-full mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-8 w-28 bg-slate-200 rounded-xl mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan satuan kerja yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit, idx) => {
                  const evalData = evaluations[unit.id];
                  const status: StatusEvaluasi = evalData?.status || 'BELUM_ISI';
                  const unitConfig = categoryAspekConfig[unit.kategori] || DEFAULT_ASPEK_CONFIG;
                  const selfScoreRes = calculateEvaluationScore(evalData, 'self', unitConfig);
                  const juriScoreRes = calculateEvaluationScore(evalData, 'juri', unitConfig);

                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{unit.nama}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{unit.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{unit.kategori}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-tight ${
                            status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : status === 'SUBMITTED'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : status === 'DRAFT'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {status === 'VERIFIED'
                            ? 'Terverifikasi'
                            : status === 'SUBMITTED'
                            ? 'Menunggu'
                            : status === 'DRAFT'
                            ? 'Draft'
                            : 'Belum Isi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                        {status !== 'BELUM_ISI' ? selfScoreRes.nilaiAkhirTerbobot.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {status === 'VERIFIED' ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-emerald-800">
                              {juriScoreRes.nilaiAkhirTerbobot.toFixed(2)}
                            </span>
                            {(() => {
                              const multi = getMultiJuriSummary(evalData, unitConfig);
                              if (multi.juriCount > 0) {
                                return (
                                  <>
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap">
                                      {multi.badgeText}
                                    </span>
                                    {multi.breakdownText && (
                                      <span className="text-[9px] font-mono text-slate-500 mt-0.5 whitespace-nowrap">
                                        {multi.breakdownText}
                                      </span>
                                    )}
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {status === 'VERIFIED' ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${juriScoreRes.predikat.colorClass}`}
                          >
                            {juriScoreRes.predikat.kode} ({juriScoreRes.predikat.label.split(' ')[0]})
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartVerification(unit.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
                          >
                            <Gavel className="w-3 h-3" />
                            <span>{status === 'VERIFIED' ? 'Edit Verif' : 'Verifikasi'}</span>
                          </button>

                          {status === 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={() => onOpenRapor(unit.id)}
                              title="Buka Rapor Evaluasi"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDE-BY-SIDE VERIFICATION WORKSPACE MODAL */}
      {verifyingUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700">
                      Lembar Verifikasi Juri
                    </span>
                    <span className="text-xs text-emerald-200 font-mono">({verifyingUnit.id})</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                    {verifyingUnit.nama}
                  </h3>
                  <p className="text-xs text-emerald-200/90">
                    Kategori: {verifyingUnit.kategori}
                  </p>
                </div>
              </div>

              {/* Live Comparison Counters */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="bg-emerald-950/70 px-3.5 py-1.5 rounded-xl border border-emerald-700/80 text-right">
                  <span className="text-[10px] text-emerald-300 block uppercase font-medium">Klaim Mandiri</span>
                  <span className="font-mono text-base font-bold text-white">
                    {currentSelfScoreResult?.nilaiAkhirTerbobot.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-right shadow-sm">
                  <span className="text-[10px] uppercase block font-semibold">Skor Juri Terbobot</span>
                  <span className="font-mono text-base font-black">
                    {currentJuriScoreResult?.nilaiAkhirTerbobot.toFixed(2) || '0.00'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyingUnitId(null)}
                  className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Quick Actions & Aspect Navigation */}
            <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                {activeAspekList.map((aspek) => {
                  const isActive = aspek.id === activeWorkspaceTab;
                  return (
                    <button
                      key={aspek.id}
                      type="button"
                      onClick={() => setActiveWorkspaceTab(aspek.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
                      }`}
                    >
                      <span className="font-mono">{aspek.id}.</span>
                      <span>{aspek.nama}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 self-end shrink-0">
                <button
                  type="button"
                  onClick={handleCopySelfScores}
                  title="Salin seluruh skor mandiri yang diklaim satker ke skor juri"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Salin Skor Mandiri</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Side-by-Side Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
              {/* Panel Status Penilaian Juri Lain (Multi-Verifikator) */}
              {verifyingEval?.verifikasiJuri && Object.keys(verifyingEval.verifikasiJuri).length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Status Panel Tim Juri untuk Satker Ini:
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {Object.keys(verifyingEval.verifikasiJuri).length} Verifikator telah menilai
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {Object.values(verifyingEval.verifikasiJuri).map((entry) => {
                      const isMe = entry.juriId === juriId;
                      return (
                        <div
                          key={entry.juriId}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                            isMe
                              ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              isMe ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {entry.juriId} {isMe && '(Sesi Anda)'}
                            </span>
                            <span className="font-mono font-black text-emerald-800 text-sm">
                              {calculateBaseScore(entry.scores, activeUnitAspekConfig).nilaiAkhirTerbobot.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 mt-1 truncate">
                            {entry.namaVerifikator}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {entry.verifiedAt || 'Telah Diverifikasi'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aspek Header */}
              {(() => {
                const currentAspek = activeAspekList.find((a) => a.id === activeWorkspaceTab) || activeAspekList[0] || ASPEK_LIST[0];
                return (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Aspek {currentAspek.id}: {currentAspek.nama}
                      </h4>
                      <p className="text-xs text-slate-500">{currentAspek.keterangan}</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      Bobot: {currentAspek.bobot}%
                    </span>
                  </div>
                );
              })()}

              {/* Items for current aspect */}
              {activeWorkspaceTab !== 8 ? (
                <div className="space-y-5">
                  {INSTRUMEN_LIST.filter((i) => i.aspekId === activeWorkspaceTab).map((item) => {
                    const claimedScore = verifyingEval?.responses?.[item.code] ?? 0;
                    const evidenceLink = verifyingEval?.links?.[item.code];
                    const juriScore = tempVerifScores[item.code] ?? claimedScore;
                    const juriNote = tempVerifNotes[item.code] ?? '';

                    return (
                      <div
                        key={item.code}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5"
                      >
                        {/* Title Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-900 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                              Butir {item.code}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm">{item.judul}</h5>
                          </div>

                          {evidenceLink ? (
                            <a
                              href={evidenceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Dokumen Bukti Dukung</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Tidak ada link bukti dukung
                            </span>
                          )}
                        </div>

                        {/* Pertanyaan */}
                        <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {item.pertanyaan}
                        </p>

                        {/* Side-by-Side: Sisi Kiri (Klaim) vs Sisi Kanan (Verifikasi Juri) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* SISI KIRI: KLAIM MANDIRI */}
                          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Sisi Kiri: Klaim Mandiri Satker
                                </span>
                                <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                  Klaim: Skor {claimedScore}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                                <strong>Kriteria yang Dipilih:</strong>
                                <br />
                                {item.opsi[claimedScore] || 'Belum memilih'}
                              </p>
                            </div>

                            <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80">
                              <span className="font-semibold text-slate-700">Bukti yang diminta:</span>{' '}
                              {item.buktiDukung}
                            </div>
                          </div>

                          {/* SISI KANAN: PENILAIAN JURI */}
                          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                                Sisi Kanan: Skor Verifikasi Juri
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-800">
                                Ditetapkan: Skor {juriScore}
                              </span>
                            </div>

                            {/* 5 Skor Buttons */}
                            <div className="grid grid-cols-5 gap-1.5">
                              {[0, 1, 2, 3, 4].map((val) => {
                                const isSelected = juriScore === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleScoreChange(item.code, val)}
                                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all text-center border ${
                                      isSelected
                                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Kriteria Deskripsi for chosen juri score */}
                            <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-amber-100">
                              <strong>Kriteria Terpilih:</strong> {item.opsi[juriScore]}
                            </div>

                            {/* Catatan / Rekomendasi Verifikator */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                Catatan / Rekomendasi Verifikator untuk Butir Ini:
                              </label>
                              <input
                                type="text"
                                value={juriNote}
                                onChange={(e) => handleNoteChange(item.code, e.target.value)}
                                placeholder="Contoh: Bukti fisik SK lengkap, namun dokumen evaluasi tahunan belum dilampirkan."
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ASPEK 8 (VIDEO PRAKTIK PELAYANAN) IN JURI MODE */
                <div className="space-y-6">
                  {/* Video Player & Deskripsi */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Video className="w-5 h-5 text-emerald-700" />
                      <h5 className="font-bold text-slate-900 text-base">
                        Pratinjau Video Praktik Pelayanan Unit Kerja
                      </h5>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Video Embed */}
                      <div className="bg-slate-900 rounded-2xl overflow-hidden min-h-[260px] flex items-center justify-center p-2 text-white">
                        {getYouTubeEmbedUrl(verifyingEval?.videoUrl) ? (
                          <iframe
                            className="w-full h-full min-h-[250px] rounded-xl"
                            src={getYouTubeEmbedUrl(verifyingEval?.videoUrl)!}
                            title="Video Praktik Pelayanan"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : verifyingEval?.videoUrl ? (
                          <div className="text-center p-6 space-y-3">
                            <Play className="w-8 h-8 text-emerald-400 mx-auto" />
                            <p className="text-xs text-slate-300">{verifyingEval.videoUrl}</p>
                            <a
                              href={verifyingEval.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Buka Video Eksternal
                            </a>
                          </div>
                        ) : (
                          <div className="text-center p-6 text-slate-400 text-xs">
                            Unit kerja belum menyertakan tautan video.
                          </div>
                        )}
                      </div>

                      {/* Deskripsi Alur */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Deskripsi Alur & Inovasi yang Diajukan Satker:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed italic">
                            &quot;{verifyingEval?.videoDeskripsi || 'Tidak ada deskripsi tertulis.'}&quot;
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500">
                          Tautan:{' '}
                          {verifyingEval?.videoUrl ? (
                            <a
                              href={verifyingEval.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 font-semibold underline truncate inline-block max-w-xs align-bottom"
                            >
                              {verifyingEval.videoUrl}
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Rubrik Penilaian Video oleh Juri */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-900 text-sm">
                      Penilaian 3 Rubrik Video Praktik Pelayanan (Bobot 20%):
                    </h5>

                    {INSTRUMEN_LIST.filter((i) => i.aspekId === 8).map((rubrik) => {
                      const claimedScore = verifyingEval?.responses?.[rubrik.code] ?? 0;
                      const juriScore = tempVerifScores[rubrik.code] ?? claimedScore;
                      const juriNote = tempVerifNotes[rubrik.code] ?? '';

                      return (
                        <div
                          key={rubrik.code}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                Butir {rubrik.code}
                              </span>
                              <h6 className="font-bold text-slate-900 text-sm">{rubrik.judul}</h6>
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-800">
                              Skor Juri Ditetapkan: {juriScore} / 4
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {rubrik.pertanyaan}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Sisi Kiri: Klaim Mandiri Satker */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Sisi Kiri: Klaim Mandiri Satker
                                  </span>
                                  <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                    Klaim: Skor {claimedScore}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                                  <strong>Kriteria yang Diklaim:</strong>
                                  <br />
                                  {rubrik.opsi[claimedScore] || 'Belum memilih klaim skor'}
                                </p>
                              </div>
                              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="font-semibold text-slate-700">Fokus Rubrik:</span> Observasi video praktik alur, etika 5S, dan transparansi anti-gratifikasi.
                              </div>
                            </div>

                            {/* Sisi Kanan: Verifikasi Juri */}
                            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                                  Sisi Kanan: Skor Verifikasi Juri
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-800">
                                  Skor: {juriScore}
                                </span>
                              </div>

                              {/* 5 Skor Buttons */}
                              <div className="grid grid-cols-5 gap-1.5">
                                {[0, 1, 2, 3, 4].map((val) => {
                                  const isSelected = juriScore === val;
                                  return (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => handleScoreChange(rubrik.code, val)}
                                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all text-center border ${
                                        isSelected
                                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                      }`}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-amber-100">
                                <strong>Kriteria Juri:</strong> {rubrik.opsi[juriScore]}
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                  Catatan Observasi Juri untuk Butir {rubrik.code}:
                                </label>
                                <input
                                  type="text"
                                  value={juriNote}
                                  onChange={(e) => handleNoteChange(rubrik.code, e.target.value)}
                                  placeholder="Catatan observasi alur, 5S, atau edukasi anti-gratifikasi dalam video..."
                                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white p-4 sm:p-5 border-t border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-xs text-slate-500">
                  <span>Nilai Juri ({juriId}): </span>
                  <strong className="text-slate-900 font-mono text-sm">
                    {currentJuriScoreResult?.nilaiAkhirTerbobot.toFixed(2)}
                  </strong>{' '}
                  <span className="font-semibold text-emerald-800">({currentJuriScoreResult?.predikat.label})</span>
                  {otherJuriesEntries.length > 0 && (
                    <span className="block sm:inline sm:ml-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Estimasi Rata-rata: {simulatedAverageScore.toFixed(2)} ({otherJuriesEntries.length + 1} Juri)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-[11px] text-slate-500">Penilai:</span>
                  <input
                    type="text"
                    value={activeVerifierName}
                    onChange={(e) => setActiveVerifierName(e.target.value)}
                    placeholder="Nama Verifikator"
                    className="font-medium text-slate-800 bg-transparent outline-none w-44 sm:w-56 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setVerifyingUnitId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal / Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndPublish}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Hasil Verifikasi [{juriId}]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
