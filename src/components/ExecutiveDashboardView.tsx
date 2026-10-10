import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  BarController,
  ArcElement,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import {
  Award,
  BarChart3,
  BookOpen,
  Building,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Loader2,
  Medal,
  PieChart,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  X
} from 'lucide-react';
import { ASPEK_LIST } from '../data/instruments';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import { SatkerEvaluation } from '../types';
import { calculateEvaluationScore, getMultiJuriSummary } from '../utils/scoring';
import { useCategoryAspekConfig, isAspekActive, DEFAULT_ASPEK_CONFIG } from '../utils/aspekConfig';
import { getStatusPengumumanJuara, triggerChampionConfetti } from '../utils/confetti';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  BarController
);

interface ExecutiveDashboardViewProps {
  evaluations: Record<string, SatkerEvaluation>;
  onOpenRapor: (unitId: string) => void;
  onNavigateToUnit: (unitId: string) => void;
  onSyncData?: () => void;
  isSyncing?: boolean;
  onOpenPanduanModal?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  evaluations,
  onOpenRapor,
  onNavigateToUnit,
  onSyncData,
  isSyncing = false,
  onOpenPanduanModal
}) => {
  const [leaderboardFilter, setLeaderboardFilter] = useState<'ALL' | 'KUA' | 'MIN' | 'MTsN & MAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryAspekConfig] = useCategoryAspekConfig();

  // State untuk Fitur 16: Cetak Piagam Penghargaan Top 3
  const [piagamData, setPiagamData] = useState<{
    id: string;
    nama: string;
    kategori: string;
    peringkat: number;
    tanggal: string;
  }>({
    id: 'KUA-01',
    nama: 'KUA Wonosari',
    kategori: 'KUA',
    peringkat: 1,
    tanggal: '8 Oktober 2026'
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Efek Confetti (Perayaan Juara) - 3 detik otomatis jika status PENGUMUMAN_JUARA === 'AKTIF'
  useEffect(() => {
    if (getStatusPengumumanJuara() === 'AKTIF') {
      const timer = setTimeout(() => {
        triggerChampionConfetti(3000);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const donutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstanceRef = useRef<ChartJS | null>(null);
  const donutChartInstanceRef = useRef<ChartJS | null>(null);

  // Compute stats across all 40 satkers with category-specific active aspects
  const stats = useMemo(() => {
    const totalSatker = DAFTAR_UNIT_KERJA.length; // 40
    let submittedCount = 0;
    let verifiedCount = 0;
    let totalVerifiedScore = 0;

    // Aspect sums
    const aspectSums = [0, 0, 0, 0, 0, 0, 0, 0];
    const aspectCounts = [0, 0, 0, 0, 0, 0, 0, 0];

    // Predicate counts
    const predicateCounts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0
    };

    DAFTAR_UNIT_KERJA.forEach((unit) => {
      const evalData = evaluations[unit.id];
      if (!evalData) return;

      const unitConfig = categoryAspekConfig[unit.kategori] || DEFAULT_ASPEK_CONFIG;

      if (evalData.status === 'SUBMITTED') {
        submittedCount++;
      } else if (evalData.status === 'VERIFIED') {
        submittedCount++;
        verifiedCount++;

        const scoreRes = calculateEvaluationScore(evalData, 'juri', unitConfig);
        totalVerifiedScore += scoreRes.nilaiAkhirTerbobot;

        // Aspect sums in percentage of aspect weight for active aspects
        scoreRes.aspekScores.forEach((asp, idx) => {
          if (asp.isActive) {
            aspectSums[idx] += asp.persentase; // in %
            aspectCounts[idx]++;
          }
        });

        predicateCounts[scoreRes.predikat.kode]++;
      }
    });

    const avgScore = verifiedCount > 0 ? totalVerifiedScore / verifiedCount : 0;
    const aspectAverages = aspectSums.map((sum, idx) => (aspectCounts[idx] > 0 ? sum / aspectCounts[idx] : 0));

    return {
      totalSatker,
      submittedCount,
      verifiedCount,
      avgScore,
      aspectAverages,
      predicateCounts
    };
  }, [evaluations, categoryAspekConfig]);

  // Compute statistics and average scores for 3 distinct categories: KUA (18), MIN (12), MTsN & MAN (10)
  const categoryStats = useMemo(() => {
    const calcCat = (kategori: 'KUA' | 'MIN' | 'MTsN & MAN') => {
      const units = DAFTAR_UNIT_KERJA.filter((u) => u.kategori === kategori);
      const catConfig = categoryAspekConfig[kategori] || DEFAULT_ASPEK_CONFIG;
      let submitted = 0;
      let verified = 0;
      let totalVerifiedScore = 0;

      units.forEach((u) => {
        const evalData = evaluations[u.id];
        if (!evalData) return;
        if (evalData.status === 'SUBMITTED') {
          submitted++;
        } else if (evalData.status === 'VERIFIED') {
          submitted++;
          verified++;
          const scoreRes = calculateEvaluationScore(evalData, 'juri', catConfig);
          totalVerifiedScore += scoreRes.nilaiAkhirTerbobot;
        }
      });

      const avgScore = verified > 0 ? totalVerifiedScore / verified : 0;
      return {
        total: units.length,
        submitted,
        verified,
        avgScore
      };
    };

    return {
      KUA: calcCat('KUA'),
      MIN: calcCat('MIN'),
      MTSN_MAN: calcCat('MTsN & MAN')
    };
  }, [evaluations, categoryAspekConfig]);

  // Compute ranked units for leaderboard
  const rankedUnits = useMemo(() => {
    const list = DAFTAR_UNIT_KERJA.map((unit) => {
      const evalData = evaluations[unit.id];
      const status = evalData?.status || 'BELUM_ISI';
      const unitConfig = categoryAspekConfig[unit.kategori] || DEFAULT_ASPEK_CONFIG;
      const selfScoreRes = calculateEvaluationScore(evalData, 'self', unitConfig);
      const juriScoreRes = calculateEvaluationScore(evalData, 'juri', unitConfig);
      const multiJuri = getMultiJuriSummary(evalData, unitConfig);
      const finalScore = status === 'VERIFIED' ? juriScoreRes.nilaiAkhirTerbobot : selfScoreRes.nilaiAkhirTerbobot;

      return {
        unit,
        status,
        selfScore: selfScoreRes.nilaiAkhirTerbobot,
        juriScore: juriScoreRes.nilaiAkhirTerbobot,
        finalScore,
        predikat: status === 'VERIFIED' ? juriScoreRes.predikat : selfScoreRes.predikat,
        multiJuri
      };
    });

    // Filter by category and search
    return list
      .filter((item) => {
        if (leaderboardFilter !== 'ALL' && item.unit.kategori !== leaderboardFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = item.unit.nama.toLowerCase().includes(q);
          const matchKapanewon = item.unit.kapanewon.toLowerCase().includes(q);
          const matchId = item.unit.id.toLowerCase().includes(q);
          if (!matchName && !matchKapanewon && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Prioritize verified over submitted/draft, then by final score descending
        if (a.status === 'VERIFIED' && b.status !== 'VERIFIED') return -1;
        if (b.status === 'VERIFIED' && a.status !== 'VERIFIED') return 1;
        return b.finalScore - a.finalScore;
      });
  }, [evaluations, leaderboardFilter, searchQuery, categoryAspekConfig]);

  // Klasemen resmi per kategori untuk menentukan Peringkat 1, 2, 3 di KUA, MIN, dan MTsN & MAN
  const categoryRankings = useMemo(() => {
    const categories: Array<'KUA' | 'MIN' | 'MTsN & MAN'> = ['KUA', 'MIN', 'MTsN & MAN'];
    const rankMap: Record<string, number> = {};

    categories.forEach((cat) => {
      const list = DAFTAR_UNIT_KERJA
        .filter((u) => u.kategori === cat)
        .map((unit) => {
          const evalData = evaluations[unit.id];
          const status = evalData?.status || 'BELUM_ISI';
          const unitConfig = categoryAspekConfig[unit.kategori] || DEFAULT_ASPEK_CONFIG;
          const selfScoreRes = calculateEvaluationScore(evalData, 'self', unitConfig);
          const juriScoreRes = calculateEvaluationScore(evalData, 'juri', unitConfig);
          const finalScore = status === 'VERIFIED' ? juriScoreRes.nilaiAkhirTerbobot : selfScoreRes.nilaiAkhirTerbobot;
          return {
            id: unit.id,
            status,
            finalScore
          };
        })
        .sort((a, b) => {
          if (a.status === 'VERIFIED' && b.status !== 'VERIFIED') return -1;
          if (b.status === 'VERIFIED' && a.status !== 'VERIFIED') return 1;
          return b.finalScore - a.finalScore;
        });

      list.forEach((item, idx) => {
        rankMap[item.id] = idx + 1;
      });
    });

    return rankMap;
  }, [evaluations, categoryAspekConfig]);

  // =========================================================
  // FITUR 19: EKSPOR RAW DATA KLASEMEN (EXCEL / CSV)
  // =========================================================
  const handleExportCsv = () => {
    const headers = [
      'Peringkat',
      'ID Satker',
      'Nama Satuan Kerja',
      'Kategori',
      'Kapanewon',
      'Status Pengisian',
      'Nilai Mandiri (Skala 100)',
      'Nilai Akhir Juri (Skala 100)',
      'Predikat Mutu Pelayanan'
    ];

    const rows = rankedUnits.map((item, index) => {
      const rank = index + 1;
      const cleanName = `"${item.unit.nama.replace(/"/g, '""')}"`;
      const cleanKat = `"${item.unit.kategori}"`;
      const cleanKap = `"${item.unit.kapanewon}"`;
      const statusLabel =
        item.status === 'VERIFIED'
          ? 'Terverifikasi Juri'
          : item.status === 'SUBMITTED'
          ? 'Menunggu Verifikasi Juri'
          : item.status === 'DRAFT'
          ? 'Draft Lokal'
          : 'Belum Mengisi';
      const selfScoreStr = item.selfScore.toFixed(2);
      const finalScoreStr = item.status === 'VERIFIED' ? item.finalScore.toFixed(2) : '-';
      const predikatStr = item.predikat ? `"${item.predikat.kode} (${item.predikat.label})"` : `"-"`;

      return [
        rank,
        item.unit.id,
        cleanName,
        cleanKat,
        cleanKap,
        `"${statusLabel}"`,
        selfScoreStr,
        finalScoreStr,
        predikatStr
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const nowStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Klasemen_Evaluasi_Pelayanan_Publik_Kemenag_GK_${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data klasemen berhasil diekspor ke file CSV untuk Microsoft Excel!');
  };

  // =========================================================
  // FITUR 16: CETAK PIAGAM PENGHARGAAN (PDF) UNTUK TOP 3
  // =========================================================
  const cetakPiagamPDF = async (idSatker: string, peringkat: number) => {
    const satker = DAFTAR_UNIT_KERJA.find((u) => u.id === idSatker);
    if (!satker) {
      showToast('Data satuan kerja tidak ditemukan di sistem.');
      return;
    }

    const tanggalFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());

    setPiagamData({
      id: satker.id,
      nama: satker.nama,
      kategori: satker.kategori,
      peringkat,
      tanggal: tanggalFormatted
    });

    showToast(`Menyiapkan piagam penghargaan PDF, harap tunggu sebentar...`);

    // Beri waktu 150ms agar state React ter-update ke elemen DOM
    await new Promise((resolve) => setTimeout(resolve, 150));

    const elementSertifikat = document.getElementById('template-sertifikat-pdf');
    if (!elementSertifikat) {
      showToast('Template sertifikat PDF tidak ditemukan di sistem.');
      return;
    }

    const win = window as any;
    if (!win.html2pdf) {
      showToast('Library pembuat PDF (html2pdf) sedang dimuat, silakan coba dalam beberapa detik.');
      return;
    }

    try {
      const kategori = satker.kategori.replace(/\s+/g, '_');
      const opt = {
        margin:       0.5,
        filename:     `Piagam_Penghargaan_${kategori}_Peringkat_${peringkat}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
      };

      await win.html2pdf().set(opt).from(elementSertifikat).save();
      showToast(`Piagam Penghargaan Juara ${peringkat} (${satker.nama}) berhasil diunduh!`);
    } catch (err) {
      console.error('Error html2pdf piagam:', err);
      showToast('Terjadi kendala saat membuat file piagam PDF.');
    }
  };

  // Render Chart.js
  useEffect(() => {
    // 1. Bar Chart: Rata-rata Capaian Skor per Aspek
    if (barCanvasRef.current) {
      if (barChartInstanceRef.current) {
        barChartInstanceRef.current.destroy();
      }

      const ctx = barCanvasRef.current.getContext('2d');
      if (ctx) {
        // Jika filter kategori aktif, tampilkan aspek yang aktif untuk kategori tersebut.
        // Jika 'ALL', tampilkan aspek yang aktif di setidaknya salah satu kategori.
        const activeAspeks = ASPEK_LIST.filter((a) => {
          if (leaderboardFilter !== 'ALL') {
            const catCfg = categoryAspekConfig[leaderboardFilter] || DEFAULT_ASPEK_CONFIG;
            return isAspekActive(a.id, catCfg);
          }
          return (
            isAspekActive(a.id, categoryAspekConfig['KUA']) ||
            isAspekActive(a.id, categoryAspekConfig['MIN']) ||
            isAspekActive(a.id, categoryAspekConfig['MTsN & MAN'])
          );
        });
        const colorPalette: Record<number, string> = {
          1: '#065f46',
          2: '#047857',
          3: '#059669',
          4: '#10b981',
          5: '#34d399',
          6: '#d97706',
          7: '#b45309',
          8: '#0f766e'
        };

        barChartInstanceRef.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: activeAspeks.map((a) => `${a.id}. ${a.nama.split(' ')[0]}`),
            datasets: [
              {
                label: 'Rata-rata Capaian (%)',
                data: activeAspeks.map((a) => Number((stats.aspectAverages[a.id - 1] || 0).toFixed(1))),
                backgroundColor: activeAspeks.map((a) => colorPalette[a.id] || '#059669'),
                borderRadius: 8,
                borderSkipped: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` Capaian: ${ctx.parsed.y}%`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: (value) => `${value}%`,
                  font: {
                    family: 'JetBrains Mono',
                    size: 11
                  }
                },
                grid: {
                  color: 'rgba(226, 232, 240, 0.7)'
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 10,
                    weight: 'bold'
                  }
                }
              }
            }
          }
        });
      }
    }

    // 2. Donut Chart: Sebaran Predikat Pelayanan
    if (donutCanvasRef.current) {
      if (donutChartInstanceRef.current) {
        donutChartInstanceRef.current.destroy();
      }

      const ctx = donutCanvasRef.current.getContext('2d');
      if (ctx) {
        const counts = [
          stats.predicateCounts.A,
          stats.predicateCounts.B,
          stats.predicateCounts.C,
          stats.predicateCounts.D,
          stats.predicateCounts.E
        ];

        donutChartInstanceRef.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: [
              'A (Pelayanan Prima)',
              'B (Sangat Baik)',
              'C (Baik)',
              'D (Cukup)',
              'E (Kurang)'
            ],
            datasets: [
              {
                data: counts,
                backgroundColor: [
                  '#065f46', // Emerald
                  '#2563eb', // Blue
                  '#d97706', // Gold Amber
                  '#ea580c', // Orange
                  '#e11d48'  // Rose
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  padding: 12,
                  font: {
                    size: 11
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${ctx.parsed} Satker`
                }
              }
            },
            cutout: '68%'
          }
        });
      }
    }

    return () => {
      if (barChartInstanceRef.current) barChartInstanceRef.current.destroy();
      if (donutChartInstanceRef.current) donutChartInstanceRef.current.destroy();
    };
  }, [stats, categoryAspekConfig, leaderboardFilter]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Grand Executive Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#021814] text-white p-7 sm:p-9 shadow-2xl shadow-emerald-950/25 border border-emerald-600/30">
        {/* Subtle Ambient Radial Mesh */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute inset-0 bg-mesh-dark opacity-60 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-extrabold text-amber-300 tracking-widest uppercase bg-emerald-950/90 px-3 py-1 rounded-full border border-amber-400/40 shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Portal Eksekutif · SI-EPP 2026</span>
              </span>
              <span className="text-emerald-400/60 hidden sm:inline">·</span>
              <span className="text-xs text-emerald-200/90 font-medium hidden sm:inline">
                Standar Pelayanan Publik KemenPAN-RB &amp; Kementerian Agama RI
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Rekapitulasi Kinerja &amp; Klasemen Mutu Pelayanan
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/85 leading-relaxed">
              Pemantauan terpadu pemenuhan 8 aspek standar mutu pelayanan publik bagi 18 KUA, 12 MIN, serta 10 MTsN &amp; MAN di lingkungan Kantor Kementerian Agama Kabupaten Gunungkidul.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 self-stretch sm:self-auto">
            {onOpenPanduanModal && (
              <button
                type="button"
                onClick={onOpenPanduanModal}
                className="px-5 py-3.5 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-slate-950 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-200 shadow-xl shadow-amber-500/25 cursor-pointer group"
                title="Buka & Unduh Buku Panduan Satuan Kerja Format PDF"
              >
                <BookOpen className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                <span>Buku Panduan Satker (PDF)</span>
              </button>
            )}

            {onSyncData && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={onSyncData}
                className="px-5 py-3.5 bg-emerald-800/90 hover:bg-emerald-700/90 active:scale-98 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 border border-emerald-500/40 shadow-lg cursor-pointer group"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Sinkronisasi...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-emerald-300 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Sinkronkan Sheets</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Grand KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Satker */}
        <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Satker Terdaftar
              </p>
              <h3 className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight tabular-nums">
                {stats.totalSatker}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2.5 font-medium flex-wrap">
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">18 KUA</span>
                <span className="text-slate-300">·</span>
                <span className="text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">12 MIN</span>
                <span className="text-slate-300">·</span>
                <span className="text-purple-800 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">10 MTsN &amp; MAN</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Sudah Submit */}
        <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pengisian Mandiri Masuk
              </p>
              <h3 className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight tabular-nums">
                {stats.submittedCount}
              </h3>
              <p className="text-xs text-slate-500 mt-2.5 font-medium">
                <strong className="text-amber-600 font-mono font-bold">
                  {Math.round((stats.submittedCount / stats.totalSatker) * 100)}%
                </strong>{' '}
                partisipasi aktif satker
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Sudah Diverifikasi Juri */}
        <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verifikasi Tim Juri
              </p>
              <h3 className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight tabular-nums">
                {stats.verifiedCount}
              </h3>
              <p className="text-xs text-slate-500 mt-2.5 font-medium">
                Telah dinilai Panel Verifikator
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Rata-rata Nilai Kabupaten */}
        <div className="group bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#022c22] text-white rounded-3xl p-6 shadow-xl shadow-emerald-950/20 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-emerald-600/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Rata-rata Nilai Seluruh Satker
              </p>
              <h3 className="font-mono text-3xl sm:text-4xl font-black text-amber-300 mt-2 tracking-tight tabular-nums drop-shadow-sm">
                {stats.avgScore.toFixed(2)}
              </h3>
              <p className="text-xs text-emerald-200/90 mt-2.5 font-medium">
                Skala Resmi 0.00 s.d. 100.00
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-800/80 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Dashboard Card: Panduan Penggunaan Layanan Satuan Kerja (Format PDF) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/30 p-6 sm:p-7 shadow-sm border border-emerald-200/80 hover:shadow-md transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#022c22] to-[#064e3b] text-amber-300 flex items-center justify-center shrink-0 shadow-lg border border-amber-400/40">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Pedoman Resmi Satuan Kerja
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/25 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/70">
                  Tersedia Format PDF
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Panduan Penggunaan Layanan Satuan Kerja (KUA &amp; Madrasah Negeri)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Pelajari alur 5 langkah evaluasi mandiri, pedoman 8 aspek standar mutu (42 butir instrumen), tata cara penyematan bukti dukung Google Drive agar tidak terkunci, serta klasifikasi predikat penilaian resmi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {onOpenPanduanModal && (
              <>
                <button
                  type="button"
                  onClick={onOpenPanduanModal}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-800 via-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 group"
                >
                  <FileText className="w-4 h-4 text-amber-300" />
                  <span>Baca Panduan Interaktif</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPanduanModal}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Unduh Format PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px]">Alur 5 Langkah Pengisian</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px]">8 Aspek Standar Pelayanan</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px]">Protokol Link Google Drive</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px]">Kriteria Nilai &amp; Rapor PDF</span>
          </div>
        </div>
      </div>

      {/* Rangkuman Rata-rata Skor per 3 Kategori Penilaian (KUA, MIN, MTsN & MAN) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Pemisahan 3 Kategori Penilaian
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">·</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Standar Mutu Resmi Kemenag</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
              Rata-rata Skor Mutu per Kategori Penilaian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan rerata capaian evaluasi hasil verifikasi Tim Juri pada Kategori KUA (18), MIN (12), dan MTsN &amp; MAN (10).
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
            <span>Klik kartu untuk melihat klasemen kategori</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-5">
          {/* Card 1: Kategori KUA */}
          <div
            onClick={() => setLeaderboardFilter('KUA')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
              leaderboardFilter === 'KUA'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50/60 hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                  Kategori 1
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-1.5">
                  <span>Kategori KUA</span>
                </h4>
                <p className="text-xs text-slate-500">18 Satker (KUA-01 s.d. KUA-18)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                KUA
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-end justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Skor:</span>
                <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-800 tabular-nums">
                  {categoryStats.KUA.avgScore.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">Verifikasi Juri:</span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs block mt-0.5">
                  {categoryStats.KUA.verified} / 18 Satker
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Kategori MIN */}
          <div
            onClick={() => setLeaderboardFilter('MIN')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
              leaderboardFilter === 'MIN'
                ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-slate-50/60 hover:bg-blue-50/40 border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  Kategori 2
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-1.5">
                  <span>Kategori MIN</span>
                </h4>
                <p className="text-xs text-slate-500">12 Satker (MIN 1 s.d. MIN 12)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                MIN
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-end justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Skor:</span>
                <div className="font-mono text-2xl sm:text-3xl font-black text-blue-800 tabular-nums">
                  {categoryStats.MIN.avgScore.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">Verifikasi Juri:</span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs block mt-0.5">
                  {categoryStats.MIN.verified} / 12 Satker
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Kategori MTsN & MAN */}
          <div
            onClick={() => setLeaderboardFilter('MTsN & MAN')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
              leaderboardFilter === 'MTsN & MAN'
                ? 'bg-purple-50/80 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-slate-50/60 hover:bg-purple-50/40 border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                  Kategori 3
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-1.5">
                  <span>Kategori MTsN &amp; MAN</span>
                </h4>
                <p className="text-xs text-slate-500">10 Satker (9 MTsN + 1 MAN)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                MTs/MA
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-end justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Skor:</span>
                <div className="font-mono text-2xl sm:text-3xl font-black text-purple-800 tabular-nums">
                  {categoryStats.MTSN_MAN.avgScore.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">Verifikasi Juri:</span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs block mt-0.5">
                  {categoryStats.MTSN_MAN.verified} / 10 Satker
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Chart.js */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Rata-rata Capaian Per Aspek (Bar Chart) - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h4 className="text-base font-bold text-slate-900">
                  Rata-rata Capaian Skor per Aspek Pelayanan
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">Persentase (%)</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Grafik menunjukkan rata-rata persentase pemenuhan pada ke-8 aspek penilaian dari satuan kerja yang telah diverifikasi oleh tim penilai.
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <canvas ref={barCanvasRef} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Aspek 1-3:</span> Tata Kelola &amp; Sarpras
            </div>
            <div>
              <span className="font-semibold text-slate-700">Aspek 4-5:</span> SIPP &amp; Aduan
            </div>
            <div>
              <span className="font-semibold text-slate-700">Aspek 6-7:</span> Inovasi &amp; Anti-Korupsi
            </div>
            <div>
              <span className="font-semibold text-slate-700">Aspek 8:</span> Video Layanan
            </div>
          </div>
        </div>

        {/* Right Chart: Sebaran Predikat Pelayanan (Donut Chart) - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-700" />
                <h4 className="text-base font-bold text-slate-900">
                  Sebaran Predikat Pelayanan
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">Satker Terverifikasi</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Distribusi tingkatan mutu pelayanan berdasarkan PermenPAN-RB dan instrumen Kemenag.
            </p>
          </div>

          <div className="h-60 sm:h-64 w-full flex items-center justify-center my-2">
            <canvas ref={donutCanvasRef} />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total Dinilai: <strong className="text-slate-800 font-mono">{stats.verifiedCount}</strong>
            </span>
            <span className="text-emerald-700 font-semibold">
              Kemenag Kab. Gunungkidul
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table (Klasemen Peringkat) */}
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/90 overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gradient-to-b from-slate-50/80 via-white to-white">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center shadow-xs border border-amber-300/40">
                <Trophy className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Klasemen Peringkat Mutu Pelayanan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Urutan peringkat resmi berdasarkan Nilai Akhir Terbobot (0.00 - 100.00) hasil verifikasi Tim Juri.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto flex-wrap">
            {/* 4 Filter Buttons */}
            <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 shadow-inner flex-wrap gap-1 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setLeaderboardFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  leaderboardFilter === 'ALL'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Semua Satker (40)
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardFilter('KUA')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  leaderboardFilter === 'KUA'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                KUA (18)
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardFilter('MIN')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  leaderboardFilter === 'MIN'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                MIN (12)
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardFilter('MTsN & MAN')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  leaderboardFilter === 'MTsN & MAN'
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                MTsN &amp; MAN (10)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[220px] md:min-w-[260px] flex-1 max-w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama satker..."
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

            {/* Tombol Ekspor Raw Data Klasemen ke CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs"
              title="Ekspor seluruh data klasemen ini ke file CSV untuk Microsoft Excel"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Ekspor Klasemen ke CSV</span>
            </button>
          </div>
        </div>

        {/* Active Category Champion Callout Banner */}
        {leaderboardFilter !== 'ALL' && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-slate-50 border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-bold text-slate-800">
                Mode Klasemen: <strong className="text-emerald-900 font-extrabold">{leaderboardFilter === 'KUA' ? 'Kategori KUA (18 Satker)' : leaderboardFilter === 'MIN' ? 'Kategori MIN (12 Satker)' : 'Kategori MTsN & MAN (10 Satker)'}</strong>
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">
                Peringkat 1, 2, dan 3 adalah Juara Resmi Kategori {leaderboardFilter}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-900 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs font-semibold">
              <span className="text-slate-500">Rerata Kategori:</span>
              <strong className="text-emerald-800 font-bold">{categoryStats[leaderboardFilter === 'KUA' ? 'KUA' : leaderboardFilter === 'MIN' ? 'MIN' : 'MTSN_MAN'].avgScore.toFixed(2)}</strong>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <th className="py-4 px-4 w-16 text-center">Rank</th>
                <th className="py-4 px-5">Nama Satuan Kerja</th>
                <th className="py-4 px-4">Kategori &amp; Kapanewon</th>
                <th className="py-4 px-4 text-right">Skor Mandiri</th>
                <th className="py-4 px-4 text-right">Nilai Akhir Juri</th>
                <th className="py-4 px-4 text-center">Predikat Mutu</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rankedUnits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400 font-medium">
                    Tidak ditemukan data satuan kerja yang sesuai kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                rankedUnits.map((item, index) => {
                  const catRank = leaderboardFilter !== 'ALL' ? (index + 1) : (categoryRankings[item.unit.id] || (index + 1));
                  const isTopRank = catRank <= 3;
                  const isTop1 = catRank === 1 && item.status === 'VERIFIED';
                  const isTop2 = catRank === 2 && item.status === 'VERIFIED';
                  const isTop3 = catRank === 3 && item.status === 'VERIFIED';

                  return (
                    <tr
                      key={item.unit.id}
                      className={`hover:bg-emerald-50/40 transition-colors duration-200 ${
                        item.status === 'VERIFIED' ? '' : 'opacity-85'
                      } ${isTop1 ? 'bg-amber-50/25' : isTop2 ? 'bg-slate-50/60' : isTop3 ? 'bg-amber-50/15' : ''}`}
                    >
                      {/* Rank Medal */}
                      <td className="py-4 px-4 text-center font-bold">
                        {isTop1 ? (
                          <button
                            type="button"
                            onClick={() => cetakPiagamPDF(item.unit.id, 1)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-400/30 ring-2 ring-amber-300/80 animate-pulse-subtle cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                            title="Cetak Piagam Penghargaan"
                          >
                            1
                          </button>
                        ) : isTop2 ? (
                          <button
                            type="button"
                            onClick={() => cetakPiagamPDF(item.unit.id, 2)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 font-black text-xs shadow-xs ring-2 ring-slate-200 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                            title="Cetak Piagam Penghargaan"
                          >
                            2
                          </button>
                        ) : isTop3 ? (
                          <button
                            type="button"
                            onClick={() => cetakPiagamPDF(item.unit.id, 3)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white font-black text-xs shadow-xs ring-2 ring-amber-600/40 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                            title="Cetak Piagam Penghargaan"
                          >
                            3
                          </button>
                        ) : (
                          <span className="font-mono text-slate-400 font-bold text-xs tabular-nums">#{index + 1}</span>
                        )}
                      </td>

                      {/* Satker Name */}
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => onNavigateToUnit(item.unit.id)}
                          className="text-left group cursor-pointer block"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                            <span>{item.unit.nama}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.unit.id}
                          </div>
                        </button>
                      </td>

                      {/* Kategori */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-700">{item.unit.kategori}</span>
                      </td>

                      {/* Skor Mandiri */}
                      <td className="py-4 px-4 text-right font-mono font-medium text-slate-500 tabular-nums">
                        {item.status !== 'BELUM_ISI' ? item.selfScore.toFixed(2) : '-'}
                      </td>

                      {/* Nilai Akhir Juri */}
                      <td className="py-4 px-4 text-right">
                        {item.status === 'VERIFIED' ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-sm font-black text-emerald-800 tabular-nums">
                              {item.juriScore.toFixed(2)}
                            </span>
                            {item.multiJuri && item.multiJuri.juriCount > 0 && (
                              <>
                                <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap">
                                  {item.multiJuri.badgeText}
                                </span>
                                {item.multiJuri.breakdownText && (
                                  <span className="font-mono text-[9px] text-slate-500 mt-0.5 whitespace-nowrap tabular-nums">
                                    {item.multiJuri.breakdownText}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        ) : item.status === 'SUBMITTED' ? (
                          <span className="font-mono text-xs font-semibold text-amber-600 italic">
                            (Menunggu Verif)
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Badge Predikat */}
                      <td className="py-4 px-4 text-center">
                        {item.status === 'VERIFIED' ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border shadow-2xs ${item.predikat.colorClass}`}
                          >
                            {item.predikat.label}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'SUBMITTED'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : item.status === 'DRAFT'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {item.status === 'VERIFIED'
                            ? 'Selesai'
                            : item.status === 'SUBMITTED'
                            ? 'Submitted'
                            : item.status === 'DRAFT'
                            ? 'Draft'
                            : 'Belum'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isTopRank && (
                            <button
                              type="button"
                              onClick={() => cetakPiagamPDF(item.unit.id, catRank)}
                              title="Cetak Piagam Penghargaan"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 border border-amber-300 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <Trophy className="w-3.5 h-3.5 text-amber-950 fill-amber-300 shrink-0" />
                              <span className="whitespace-nowrap">Piagam #{catRank}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenRapor(item.unit.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 border border-emerald-200 hover:border-emerald-700 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Buka Rapor</span>
                          </button>
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

      {/* ========================================================= */}
      {/* FITUR 16: TEMPLATE DESAIN PIAGAM PENGHARGAAN (HIDDEN HTML) */}
      {/* ========================================================= */}
      <div
        id="template-sertifikat-pdf"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1122px',
          height: '792px',
          backgroundColor: '#ffffff',
          color: '#111827',
          zIndex: -100,
          pointerEvents: 'none',
          boxSizing: 'border-box',
          padding: '24px',
          fontFamily: 'Georgia, "Times New Roman", Times, serif'
        }}
      >
        {/* Bingkai Luar: Tebal Hijau Kemenag (#065f46) */}
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '6px solid #065f46',
            padding: '8px',
            boxSizing: 'border-box',
            backgroundColor: '#fffdfa'
          }}
        >
          {/* Bingkai Tengah: Aksen Emas/Gold (#d97706) */}
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '3px solid #d97706',
              padding: '6px',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Bingkai Dalam: Garis Rapi dengan Padding Elegan */}
            <div
              style={{
                width: '100%',
                height: '100%',
                border: '1.5px solid #065f46',
                boxSizing: 'border-box',
                padding: '20px 48px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                textAlign: 'center'
              }}
            >
              {/* Ornamen Sudut (Corners) */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px', borderTop: '3px solid #d97706', borderLeft: '3px solid #d97706' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderTop: '3px solid #d97706', borderRight: '3px solid #d97706' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '24px', height: '24px', borderBottom: '3px solid #d97706', borderLeft: '3px solid #d97706' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '24px', height: '24px', borderBottom: '3px solid #d97706', borderRight: '3px solid #d97706' }} />

              {/* Susunan Teks (Rata Tengah / Center) */}
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                {/* Logo Kemenag */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <img
                    src="/favicon.svg"
                    alt="Logo Kemenag"
                    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                  />
                </div>

                {/* KEMENTERIAN AGAMA REPUBLIK INDONESIA */}
                <div
                  style={{
                    fontSize: '13pt',
                    fontWeight: 'bold',
                    color: '#065f46',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    lineHeight: 1.2
                  }}
                >
                  KEMENTERIAN AGAMA REPUBLIK INDONESIA
                </div>

                {/* KANTOR KABUPATEN GUNUNGKIDUL */}
                <div
                  style={{
                    fontSize: '11pt',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    lineHeight: 1.2
                  }}
                >
                  KANTOR KEMENTERIAN AGAMA KABUPATEN GUNUNGKIDUL
                </div>

                {/* (Spasi Lebar) dengan Ornamen Garis Emas */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '14px auto',
                    width: '450px',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, height: '1.5px', backgroundColor: '#d97706' }} />
                  <div style={{ width: '8px', height: '8px', transform: 'rotate(45deg)', backgroundColor: '#065f46' }} />
                  <div style={{ flex: 1, height: '1.5px', backgroundColor: '#d97706' }} />
                </div>

                {/* Teks Judul Besar: PIAGAM PENGHARGAAN */}
                <div
                  style={{
                    fontSize: '34pt',
                    fontWeight: 900,
                    color: '#d97706',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    lineHeight: 1.1,
                    textShadow: '1px 1px 0px rgba(180, 83, 9, 0.4)'
                  }}
                >
                  PIAGAM PENGHARGAAN
                </div>
                <div
                  style={{
                    fontSize: '9.5pt',
                    color: '#6b7280',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}
                >
                  Nomor: B-142/Kk.12.02/01/OT.01/2026
                </div>

                {/* Diberikan kepada: */}
                <div
                  style={{
                    fontSize: '12pt',
                    fontStyle: 'italic',
                    color: '#4b5563',
                    marginTop: '12px'
                  }}
                >
                  Diberikan kepada:
                </div>

                {/* [Nama Satuan Kerja] (Tebal ukuran sangat besar) */}
                <div
                  style={{
                    fontSize: '26pt',
                    fontWeight: 800,
                    color: '#065f46',
                    letterSpacing: '0.03em',
                    marginTop: '4px',
                    lineHeight: 1.2
                  }}
                >
                  {piagamData.nama}
                </div>

                {/* Sebagai: */}
                <div
                  style={{
                    fontSize: '11pt',
                    fontStyle: 'italic',
                    color: '#4b5563',
                    marginTop: '10px'
                  }}
                >
                  Sebagai:
                </div>

                {/* "PERINGKAT [1/2/3] TERBAIK" */}
                <div
                  style={{
                    fontSize: '19pt',
                    fontWeight: 900,
                    color: '#d97706',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: '2px'
                  }}
                >
                  PERINGKAT {piagamData.peringkat} TERBAIK
                </div>

                {/* "Evaluasi Kinerja Penyelenggaraan Standar Pelayanan Publik" */}
                <div
                  style={{
                    fontSize: '13pt',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginTop: '4px'
                  }}
                >
                  Evaluasi Kinerja Penyelenggaraan Standar Pelayanan Publik
                </div>

                {/* "Kategori: [KUA / MIN / MTsN & MAN] Tahun 2026" */}
                <div
                  style={{
                    fontSize: '12pt',
                    fontWeight: 600,
                    color: '#047857',
                    marginTop: '2px'
                  }}
                >
                  Kategori: {piagamData.kategori} Tahun 2026
                </div>
              </div>

              {/* Bagian Bawah: Di pojok kanan bawah */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingTop: '8px',
                  marginTop: '8px'
                }}
              >
                {/* Sisi Kiri Bawah: Validasi Sistem SI-EPP */}
                <div style={{ textAlign: 'left', fontSize: '9pt', color: '#4b5563' }}>
                  <div style={{ display: 'inline-block', border: '1.5px dashed #065f46', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
                    <div style={{ fontWeight: 'bold', color: '#065f46' }}>SI-EPP KEMENAG GUNUNGKIDUL</div>
                    <div style={{ fontSize: '8pt', color: '#047857' }}>Sertifikat Resmi &amp; Terverifikasi Sistem</div>
                  </div>
                </div>

                {/* Di pojok kanan bawah: "Wonosari, [Tanggal Bulan Tahun]", diikuti nama dan garis bawah "Kepala Kantor Kementerian Agama Kab. Gunungkidul" */}
                <div style={{ textAlign: 'center', minWidth: '320px' }}>
                  <div style={{ fontSize: '11pt', color: '#111827' }}>
                    Wonosari, {piagamData.tanggal}
                  </div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#111827', marginTop: '2px' }}>
                    Kepala Kantor Kementerian Agama Kab. Gunungkidul
                  </div>

                  {/* Ruang Tanda Tangan */}
                  <div style={{ height: '52px' }} />

                  {/* Nama dan Garis Bawah */}
                  <div
                    style={{
                      fontSize: '11.5pt',
                      fontWeight: 'bold',
                      color: '#111827',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px'
                    }}
                  >
                    Dr. H. Mukotip, S.Ag., M.Pd.I
                  </div>
                  <div style={{ fontSize: '9.5pt', color: '#374151', marginTop: '2px' }}>
                    NIP. 197012121997031003
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
