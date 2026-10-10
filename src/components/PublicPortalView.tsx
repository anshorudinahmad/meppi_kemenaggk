import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  Loader2,
  Lock,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
  X
} from 'lucide-react';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import { KategoriUnit, SatkerEvaluation } from '../types';
import { getMultiJuriSummary } from '../utils/scoring';
import { useCategoryAspekConfig } from '../utils/aspekConfig';
import { getStatusPengumumanJuara, triggerChampionConfetti } from '../utils/confetti';

interface PublicPortalViewProps {
  evaluations: Record<string, SatkerEvaluation>;
  onOpenLogin: () => void;
  isSyncing?: boolean;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  evaluations,
  onOpenLogin,
  isSyncing = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<'ALL' | KategoriUnit>('ALL');
  const [categoryAspekConfig] = useCategoryAspekConfig();

  // Efek Confetti (Perayaan Juara) - 3 detik otomatis jika status PENGUMUMAN_JUARA === 'AKTIF'
  useEffect(() => {
    if (getStatusPengumumanJuara() === 'AKTIF') {
      const timer = setTimeout(() => {
        triggerChampionConfetti(3000);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Hitung data publik terverifikasi dan skor untuk seluruh satuan kerja
  const publicUnitData = useMemo(() => {
    return DAFTAR_UNIT_KERJA.map((unit) => {
      const evalData = evaluations[unit.id];
      const isVerified = evalData?.status === 'VERIFIED';
      const isSubmitted = evalData?.status === 'SUBMITTED';

      // Hitung ringkasan skor multi-juri yang akurat
      const multiSummary = getMultiJuriSummary(evalData, unit.kategori);
      const finalScore = isVerified ? multiSummary.averageScore : 0;
      const predikat = isVerified ? multiSummary.predikat : null;

      return {
        unit,
        evalData,
        status: evalData?.status || 'BELUM_ISI',
        isVerified,
        isSubmitted,
        finalScore,
        predikat,
        videoUrl: evalData?.videoUrl || '',
        videoDeskripsi: evalData?.videoDeskripsi || ''
      };
    });
  }, [evaluations, categoryAspekConfig]);

  // Klasemen Top 3 per Kategori (Hanya predikat A, B, C; D dan E disembunyikan)
  const categoryTopRankers = useMemo(() => {
    const categories: KategoriUnit[] = ['KUA', 'MIN', 'MTsN & MAN'];
    const result: Record<KategoriUnit, typeof publicUnitData> = {
      'KUA': [],
      'MIN': [],
      'MTsN & MAN': []
    };

    categories.forEach((cat) => {
      const filtered = publicUnitData
        .filter((item) => {
          if (item.unit.kategori !== cat) return false;
          if (!item.isVerified) return false;
          // Hanya tampilkan satker dengan predikat A, B, atau C (Skor > 70)
          // Sembunyikan satker berpredikat D dan E dari etalase publik
          return item.finalScore > 70 && item.predikat && ['A', 'B', 'C'].includes(item.predikat.kode);
        })
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 3);

      result[cat] = filtered;
    });

    return result;
  }, [publicUnitData]);

  // Galeri Inovasi Pelayanan Terbuka (Aspek 8)
  // Syarat: Terverifikasi, memiliki linkVideo & deskripsiVideo, Nilai Akhir > 80 (Sangat Baik / Prima)
  const inovasiVideos = useMemo(() => {
    return publicUnitData
      .filter((item) => {
        if (!item.isVerified) return false;
        if (!item.videoUrl || item.videoUrl.trim() === '') return false;
        if (!item.videoDeskripsi || item.videoDeskripsi.trim() === '') return false;
        // Filter: Hanya satker yang meraih nilai akhir di atas 80 (> 80.00)
        return item.finalScore > 80.00;
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [publicUnitData]);

  // Filter pencarian masyarakat
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return publicUnitData.filter((item) => {
      const matchName = item.unit.nama.toLowerCase().includes(query);
      const matchKapanewon = item.unit.kapanewon.toLowerCase().includes(query);
      const matchCat = item.unit.kategori.toLowerCase().includes(query);
      return matchName || matchKapanewon || matchCat;
    });
  }, [publicUnitData, searchQuery]);

  return (
    <div className="space-y-10 pb-16 animate-fade-in">
      {/* 1. HERO SECTION & BANNER UTAMA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#043329] text-white shadow-2xl border border-emerald-500/30 p-6 sm:p-10 lg:p-12">
        {/* Background Decorative Rings */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-amber-400/50 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide uppercase">
              Keterbukaan Informasi Publik 2026
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md leading-tight">
              Portal Transparansi Pelayanan Publik
            </h1>
            <p className="text-base sm:text-xl text-emerald-100 font-medium max-w-2xl mx-auto drop-shadow-sm">
              Kantor Kementerian Agama Kabupaten Gunungkidul
            </p>
          </div>

          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl mx-auto leading-relaxed">
            Informasi akuntabilitas dan standar mutu pelayanan publik Kantor Urusan Agama (KUA) dan Madrasah Negeri se-Kabupaten Gunungkidul secara terbuka, transparan, dan terpercaya.
          </p>

          {/* 2. SEARCH BAR BESAR */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/40 via-emerald-400/40 to-amber-300/40 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="pl-4 sm:pl-5 text-emerald-700">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari KUA atau Madrasah Anda... (cth: Wonosari, Playen, MIN 1)"
                  className="w-full py-4 pl-3 pr-10 text-sm sm:text-base font-medium placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="pr-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick helper tag */}
            <p className="text-[11px] sm:text-xs text-emerald-200/80 mt-2.5 text-center">
              💡 Ketik nama KUA, Madrasah, atau Kapanewon untuk melihat hasil evaluasi &amp; predikat mutu layanan.
            </p>
          </div>
        </div>
      </section>

      {/* HASIL PENCARIAN PUBLIK JIKA USER MENGISI SEARCH BAR */}
      {searchQuery.trim() !== '' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Hasil Pencarian ({searchResults.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Kata kunci: <span className="font-semibold text-emerald-800">"{searchQuery}"</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              Tutup Hasil Pencarian
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Satuan Kerja Tidak Ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tidak ada KUA atau Madrasah yang cocok dengan kata kunci "{searchQuery}". Silakan coba dengan kata kunci lain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item) => (
                <div
                  key={item.unit.id}
                  className="bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.unit.kategori}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Kapanewon {item.unit.kapanewon}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {item.unit.nama}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200/70">
                    {item.isVerified && item.predikat ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Nilai Akhir:</span>
                          <span className="text-lg font-black text-slate-900">
                            {item.finalScore.toFixed(2)}
                            <span className="text-xs font-normal text-slate-500"> / 100</span>
                          </span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-center font-bold text-xs ${item.predikat.bgLightClass} ${item.predikat.borderClass}`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Predikat: {item.predikat.label}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                        <span className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Status: Dalam Proses Evaluasi</span>
                        </span>
                      </div>
                    )}

                    {item.videoUrl && (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-amber-300" />
                        <span>Tonton Video Layanan</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. ETALASE PENGHARGAAN (TOP RANKERS) - UNIT PELAYANAN TERBAIK TAHUN INI */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold uppercase tracking-wide">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Etalase Keunggulan Pelayanan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Unit Pelayanan Terbaik Tahun Ini
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Penghargaan bergengsi bagi Satuan Kerja peraih peringkat tertinggi dengan predikat pelayanan prima di lingkungan Kemenag Kabupaten Gunungkidul.
          </p>
        </div>

        {/* 3 Klasemen Cards (dengan Skeleton Loading saat isSyncing) */}
        {isSyncing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/90 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200"></div>
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-300 rounded"></div>
                        <div className="h-3 w-36 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-5 w-12 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-200 rounded-xl"></div>
                          <div className="h-3.5 w-28 bg-slate-300 rounded"></div>
                        </div>
                        <div className="h-5 w-14 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-3 w-40 bg-slate-200 rounded mx-auto mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* a. TOP 3 KUA */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Kategori KUA</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Kantor Urusan Agama Kecamatan</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Top 3
                  </span>
                </div>

                {categoryTopRankers['KUA'].length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Sedang dalam proses penilaian</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {categoryTopRankers['KUA'].map((item, index) => (
                      <TopRankerRow key={item.unit.id} rank={index + 1} item={item} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Kualifikasi: Nilai Terbobot Terverifikasi &ge; 70.00
                </span>
              </div>
            </div>

            {/* b. TOP 3 MIN */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100/80 text-blue-800 flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Kategori MIN</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Madrasah Ibtidaiyah Negeri</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Top 3
                  </span>
                </div>

                {categoryTopRankers['MIN'].length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Sedang dalam proses penilaian</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {categoryTopRankers['MIN'].map((item, index) => (
                      <TopRankerRow key={item.unit.id} rank={index + 1} item={item} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Kualifikasi: Nilai Terbobot Terverifikasi &ge; 70.00
                </span>
              </div>
            </div>

            {/* c. TOP 3 MTsN & MAN */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Kategori MTsN &amp; MAN</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Madrasah Tsanawiyah &amp; Aliyah Negeri</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Top 3
                  </span>
                </div>

                {categoryTopRankers['MTsN & MAN'].length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Sedang dalam proses penilaian</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {categoryTopRankers['MTsN & MAN'].map((item, index) => (
                      <TopRankerRow key={item.unit.id} rank={index + 1} item={item} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Kualifikasi: Nilai Terbobot Terverifikasi &ge; 70.00
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. GALERI INOVASI PELAYANAN TERBUKA (DARI ASPEK 8) */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold uppercase tracking-wide">
              <Video className="w-3.5 h-3.5 text-emerald-700" />
              <span>Etalase Video Praktik Baik (Aspek 8)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Galeri Inovasi Pelayanan Terbuka
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Menampilkan video praktik riil pelayanan unggulan dari Satuan Kerja yang berhasil meraih nilai di atas 80 (Sangat Baik / Pelayanan Prima).
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {inovasiVideos.length} Inovasi Layanan Terpilih
            </span>
          </div>
        </div>

        {isSyncing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-200/90 flex flex-col justify-between">
                <div className="h-44 bg-slate-300 p-5 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-slate-400 rounded"></div>
                    <div className="h-4 w-20 bg-slate-400 rounded"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-400"></div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-24 bg-slate-400 rounded"></div>
                      <div className="h-4 w-36 bg-slate-400 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-slate-200 rounded"></div>
                    <div className="h-3 w-full bg-slate-200 rounded"></div>
                    <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-10 w-full bg-slate-200 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : inovasiVideos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Belum Ada Video Inovasi Terpilih</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Video inovasi hanya ditampilkan dari Satuan Kerja yang telah terverifikasi juri dengan nilai akhir di atas 80 (Sangat Baik / Pelayanan Prima).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inovasiVideos.map((item) => (
              <div
                key={item.unit.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 hover:shadow-2xl hover:border-emerald-400 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group"
              >
                {/* Visual Header / Banner */}
                <div className="relative h-44 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-slate-900 p-5 flex flex-col justify-between text-white overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-amber-400/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                  {/* Badges */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-950/90 text-amber-300 border border-amber-400/40 shadow-xs">
                      {item.unit.kategori}
                    </span>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      Nilai: {item.finalScore.toFixed(2)}
                    </span>
                  </div>

                  {/* Play Button Icon Highlight */}
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-200 font-medium">Praktik Baik Layanan</p>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {item.unit.nama}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                      <span>Kapanewon {item.unit.kapanewon}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-bold">{item.predikat?.label}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.videoDeskripsi}
                    </p>
                  </div>

                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#064e3b] to-[#022c22] hover:from-emerald-800 hover:to-emerald-950 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-amber-300" />
                    <span>Tonton Video Layanan</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. CALL TO ACTION: AKSES PEGAWAI / INTERNAL */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-emerald-800/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Akses Khusus Aparatur Kemenag</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Petugas Satuan Kerja atau Tim Penilai Juri?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Masuk dengan PIN Satker untuk melengkapi instrumen evaluasi mandiri, atau autentikasi PIN Juri / Admin untuk verifikasi penilaian.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLogin}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Lock className="w-4 h-4" />
          <span>Login Unit Kerja/Evaluator</span>
        </button>
      </section>
    </div>
  );
};

// Sub-komponen Baris Top Ranker untuk Etalase
interface TopRankerRowProps {
  rank: number;
  item: {
    unit: { id: string; nama: string; kapanewon: string; kategori: string };
    finalScore: number;
    predikat: { kode: string; label: string; colorClass: string; bgLightClass: string } | null;
  };
}

const TopRankerRow: React.FC<TopRankerRowProps> = ({ rank, item }) => {
  const medalStyle =
    rank === 1
      ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-amber-100'
      : rank === 2
      ? 'bg-slate-100 text-slate-800 border-slate-300 shadow-slate-100'
      : 'bg-orange-100 text-orange-800 border-orange-300 shadow-orange-100';

  const medalBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 transition-all duration-200 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${medalStyle}`}
        >
          {medalBadge}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 truncate">
            {item.unit.nama}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            Kapanewon {item.unit.kapanewon}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-xs font-black text-slate-900">
          {item.finalScore.toFixed(2)}
        </div>
        {item.predikat && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Predikat {item.predikat.kode}
          </span>
        )}
      </div>
    </div>
  );
};
