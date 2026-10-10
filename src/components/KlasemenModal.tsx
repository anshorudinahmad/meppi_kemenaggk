import React, { useState, useMemo } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Download,
  Filter,
  Medal,
  Printer,
  Search,
  ShieldCheck,
  Trophy,
  X
} from 'lucide-react';
import { KategoriUnit, SatkerEvaluation } from '../types';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import { getMultiJuriSummary } from '../utils/scoring';

interface KlasemenModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: Record<string, SatkerEvaluation>;
}

export const KlasemenModal: React.FC<KlasemenModalProps> = ({
  isOpen,
  onClose,
  evaluations
}) => {
  const [selectedKategori, setSelectedKategori] = useState<'ALL' | KategoriUnit>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saring HANYA satuan kerja yang berstatus VERIFIED (Final / Terverifikasi Juri)
  // Sembunyikan nilai Mandiri atau draft
  const verifiedList = useMemo(() => {
    return DAFTAR_UNIT_KERJA.map((unit) => {
      const evalData = evaluations[unit.id];
      const isVerified = evalData?.status === 'VERIFIED';
      const multiSummary = getMultiJuriSummary(evalData, unit.kategori);

      return {
        unit,
        isVerified,
        evalData,
        finalScore: isVerified ? multiSummary.averageScore : 0,
        predikat: isVerified ? multiSummary.predikat : null,
        totalJuri: multiSummary.juriEntries.length
      };
    })
      .filter((item) => item.isVerified)
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [evaluations]);

  // Filter berdasarkan kategori dan pencarian nama/kapanewon
  const filteredList = useMemo(() => {
    return verifiedList.filter((item) => {
      if (selectedKategori !== 'ALL' && item.unit.kategori !== selectedKategori) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = item.unit.nama.toLowerCase().includes(q);
        const matchKapanewon = item.unit.kapanewon.toLowerCase().includes(q);
        return matchNama || matchKapanewon;
      }
      return true;
    });
  }, [verifiedList, selectedKategori, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#043329] text-white flex items-center justify-between gap-4 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Klasemen Lengkap Satuan Kerja
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500/50 text-[10px] font-bold text-emerald-200 uppercase">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Terverifikasi Juri
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Kemenag Kabupaten Gunungkidul • Hanya menampilkan data berstatus Final/Terverifikasi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Pencarian */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs Kategori */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl gap-1 text-xs font-bold overflow-x-auto">
            {(['ALL', 'KUA', 'MIN', 'MTsN & MAN'] as const).map((kat) => (
              <button
                key={kat}
                type="button"
                onClick={() => setSelectedKategori(kat)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedKategori === kat
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {kat === 'ALL' ? 'Semua Kategori' : kat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari satker / kapanewon..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Info Legenda Singkat di dalam Modal */}
        <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-950 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-900">Legenda Predikat:</span>
            <span className="font-semibold text-emerald-800">
              (A: Pelayanan Prima) | (B: Sangat Baik) | (C: Baik) | (D: Cukup) | (E: Kurang)
            </span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Total Terverifikasi: <strong className="text-emerald-900">{verifiedList.length}</strong> dari {DAFTAR_UNIT_KERJA.length} Satker
          </div>
        </div>

        {/* Tabel Klasemen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Tidak Ada Data Satuan Kerja Terverifikasi</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {verifiedList.length === 0
                  ? 'Belum ada satuan kerja yang selesai dinilai dan berstatus Final/Terverifikasi oleh Tim Juri.'
                  : `Tidak ada satker terverifikasi yang cocok dengan filter atau kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 text-center w-14">Rank</th>
                    <th className="py-3 px-4">Nama Satuan Kerja</th>
                    <th className="py-3 px-3 text-center">Kategori</th>
                    <th className="py-3 px-3">Kapanewon</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3 px-4 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item, index) => {
                    const rank = index + 1;
                    const isTop1 = rank === 1;
                    const isTop2 = rank === 2;
                    const isTop3 = rank === 3;

                    return (
                      <tr
                        key={item.unit.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isTop1 ? 'bg-amber-50/40 font-semibold' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3.5 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                              🥇 1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-200 text-slate-800 font-black text-xs">
                              🥈 2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700/20 text-amber-900 font-black text-xs">
                              🥉 3
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-slate-500 text-xs">
                              {rank}
                            </span>
                          )}
                        </td>

                        {/* Nama Unit */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.unit.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {item.unit.id}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {item.unit.kategori}
                          </span>
                        </td>

                        {/* Kapanewon */}
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {item.unit.kapanewon}
                        </td>

                        {/* Nilai Akhir */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-sm font-black text-slate-900">
                            {item.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                        </td>

                        {/* Predikat */}
                        <td className="py-3 px-4 text-center">
                          {item.predikat ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs border ${item.predikat.bgLightClass} ${item.predikat.borderClass}`}
                            >
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>{item.predikat.kode} - {item.predikat.label}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Seluruh skor di atas bersumber dari hasil verifikasi objektif Tim Penilai Juri Kemenag Gunungkidul.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            Tutup Klasemen
          </button>
        </div>
      </div>
    </div>
  );
};
