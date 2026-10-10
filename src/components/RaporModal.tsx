import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Download, FileText, Printer, ShieldCheck, Sparkles, X } from 'lucide-react';
import { ASPEK_LIST, INSTRUMEN_LIST } from '../data/instruments';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import { SatkerEvaluation } from '../types';
import { calculateEvaluationScore, getMultiJuriSummary } from '../utils/scoring';
import { useAspekConfig } from '../utils/aspekConfig';

interface RaporModalProps {
  unitId: string | null;
  evaluations: Record<string, SatkerEvaluation>;
  onClose: () => void;
}

export const RaporModal: React.FC<RaporModalProps> = ({
  unitId,
  evaluations,
  onClose
}) => {
  if (!unitId) return null;

  const [pdfHint, setPdfHint] = useState<string | null>(null);
  const unit = DAFTAR_UNIT_KERJA.find((u) => u.id === unitId) || DAFTAR_UNIT_KERJA[0];
  const [aspekConfig] = useAspekConfig(unit.kategori);
  const evalData = evaluations[unitId];

  // Calculate score using Juri values if verified, otherwise self, with dynamic aspect weights
  const isVerified = evalData?.status === 'VERIFIED';
  const multiJuri = useMemo(() => getMultiJuriSummary(evalData, aspekConfig), [evalData, aspekConfig]);
  const scoreResult = useMemo(
    () => calculateEvaluationScore(evalData, isVerified ? 'juri' : 'self', aspekConfig),
    [evalData, isVerified, aspekConfig]
  );

  // Collect all notes from all juries with explicit Juri label
  const notesList = useMemo(() => {
    if (multiJuri.combinedNotes.length > 0) {
      return multiJuri.combinedNotes.map((item) => ({
        code: item.code,
        title: item.title,
        juriLabel: `[Catatan ${item.juriId} - ${item.namaVerifikator}]`,
        note: item.note
      }));
    }

    // Fallback for legacy single verifNotes
    return Object.entries(evalData?.verifNotes || {})
      .filter(([_, note]) => note && note.trim() !== '')
      .map(([code, note]) => {
        const item = INSTRUMEN_LIST.find((i) => i.code === code);
        return {
          code,
          title: item ? item.judul : `Butir ${code}`,
          juriLabel: evalData?.verifiedBy ? `[Catatan ${evalData.verifiedBy}]` : '[Catatan Verifikator]',
          note
        };
      });
  }, [evalData, multiJuri]);

  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanUnitName = unit.nama.replace(/[^a-zA-Z0-9]/g, '_');
    document.title = `Rapor_Evaluasi_SIEPP_${unit.id}_${cleanUnitName}_2026`;
    window.print();
    document.title = originalTitle;
  };

  const handleSavePdf = () => {
    const originalTitle = document.title;
    const cleanUnitName = unit.nama.replace(/[^a-zA-Z0-9]/g, '_');
    document.title = `Rapor_Evaluasi_SIEPP_${unit.id}_${cleanUnitName}_2026`;
    setPdfHint('Pilih Tujuan (Destination): "Simpan sebagai PDF" / "Save as PDF" pada dialog cetak browser.');
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setTimeout(() => setPdfHint(null), 8000);
    }, 200);
  };

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div id="rapor-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div id="rapor-modal-dialog" className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#021814] text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 border-b border-emerald-700/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight block">
                Pratinjau Rapor Evaluasi Pelayanan Publik
              </span>
              <span className="text-[11px] text-emerald-200/80">Dokumen Cetak &amp; PDF Resmi SI-EPP 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Button 1: Save as PDF */}
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
              title="Unduh / Simpan sebagai dokumen PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan PDF</span>
            </button>

            {/* Button 2: Print Directly */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
              title="Kirim ke Printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-xl transition-colors cursor-pointer ml-1"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helpful PDF Instruction Banner */}
        {pdfHint && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-900 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{pdfHint}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfHint(null)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Printable Paper Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white" id="rapor-evaluasi-printable">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center relative">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img
                src="/logo.png"
                alt="Logo Resmi MONEV Pelayanan Publik"
                className="w-16 h-16 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-center">
                <h4 className="text-xs font-bold tracking-widest uppercase text-slate-600">
                  KEMENTERIAN AGAMA REPUBLIK INDONESIA
                </h4>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  KANTOR KEMENTERIAN AGAMA KABUPATEN GUNUNGKIDUL
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Jl. Brigjen Katamso No. 13 Wonosari, Gunungkidul, D.I. Yogyakarta 55812
                </p>
              </div>
            </div>
            <div className="mt-3 py-1 px-4 bg-emerald-900 text-white inline-block rounded-md text-xs font-bold tracking-wider uppercase">
              RAPOR EVALUASI STANDAR PELAYANAN PUBLIK (SI-EPP) TAHUN 2026
            </div>
          </div>

          {/* Unit Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-xs text-slate-700">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Satuan Kerja</span>
                <span className="font-bold text-slate-900 text-sm">{unit.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kode Satker &amp; Kategori</span>
                <span className="font-mono font-semibold text-slate-800">{unit.id}</span> · {unit.kategori}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Wilayah Kapanewon</span>
                <span className="font-semibold text-slate-800">{unit.kapanewon}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Hasil Evaluasi</span>
                <span className="font-bold text-emerald-800">
                  {isVerified
                    ? multiJuri.juriCount > 1
                      ? `Telah Diverifikasi Resmi (${multiJuri.badgeText})`
                      : 'Telah Diverifikasi Resmi (Final)'
                    : 'Skor Mandiri Sementara (Belum Final)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tanggal Penerbitan Rapor</span>
                <span className="font-semibold text-slate-800">{currentDateFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Verifikator Penilai</span>
                <span className="font-semibold text-slate-800">
                  {multiJuri.juriEntries.length > 0
                    ? multiJuri.juriEntries.map((j) => `${j.juriId} (${j.namaVerifikator})`).join(', ')
                    : (evalData?.verifiedBy || 'Tim Penilai Pelayanan Publik Kankemenag Gunungkidul')}
                </span>
                {multiJuri.juriCount > 1 && (
                  <span className="block text-[10px] text-emerald-700 font-mono mt-0.5 font-bold">
                    Panel Terdiri dari {multiJuri.juriCount} Juri ({multiJuri.breakdownText})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-900 text-white p-5 rounded-2xl flex flex-col justify-between text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Nilai Akhir Terbobot
                </span>
                <p className="text-xs text-emerald-200/80">
                  {isVerified && multiJuri.juriCount > 0 ? multiJuri.badgeText : 'Skala 0.00 s.d. 100.00'}
                </p>
              </div>
              <div className="mt-4">
                <span className="font-mono text-4xl sm:text-5xl font-black text-amber-300">
                  {scoreResult.nilaiAkhirTerbobot.toFixed(2)}
                </span>
                {isVerified && multiJuri.breakdownText && (
                  <div className="text-[10px] font-mono text-emerald-200 mt-1">
                    Rincian: {multiJuri.breakdownText}
                  </div>
                )}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between ${scoreResult.predikat.bgLightClass} ${scoreResult.predikat.borderClass}`}>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Predikat Mutu Pelayanan
                </span>
                <p className="text-xs opacity-80">Klasifikasi Kemenpan-RB &amp; Kemenag</p>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black block">
                  {scoreResult.predikat.label}
                </span>
              </div>
            </div>

            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs text-slate-600">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Catatan Predikat
              </span>
              <p className="mt-2 leading-relaxed">
                {scoreResult.predikat.deskripsi}
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/80 mt-2">
                Total Perolehan Butir: {scoreResult.totalPerolehan} dari {scoreResult.totalSkorMaksimal} poin
              </div>
            </div>
          </div>

          {/* 8 Aspects Breakdown Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Rincian Capaian Nilai per 8 Aspek Penilaian Standar Pelayanan
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3">Aspek Penilaian</th>
                    <th className="py-2.5 px-3 text-center">Bobot</th>
                    <th className="py-2.5 px-3 text-right">Skor Riil</th>
                    <th className="py-2.5 px-3 text-right">Skor Maks</th>
                    <th className="py-2.5 px-3 text-right">Capaian (%)</th>
                    <th className="py-2.5 px-3 text-right">Nilai Terbobot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scoreResult.aspekScores.map((asp) => {
                    const isInactive = !asp.isActive;
                    return (
                      <tr
                        key={asp.aspekId}
                        className={`transition-colors ${
                          isInactive
                            ? 'bg-slate-50/80 text-slate-400 opacity-75'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{asp.aspekId}</td>
                        <td className="py-2 px-3 font-semibold">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isInactive ? 'text-slate-500 line-through' : 'text-slate-800'}>
                              {asp.nama}
                            </span>
                            {isInactive && (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
                                Aspek Dikecualikan untuk Kategori Ini
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {asp.bobot}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {isInactive ? '-' : asp.perolehanSkor}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          {isInactive ? '-' : asp.skorMaksimal}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {isInactive ? '-' : `${asp.persentase.toFixed(1)}%`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                          {isInactive ? '-' : asp.nilaiTerbobot.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-300">
                    <td colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider">
                      Total Nilai Akhir {(scoreResult.totalBobotAktif ?? 100) < 100 ? `(Bobot Aktif: ${scoreResult.totalBobotAktif ?? 100}%)` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">{scoreResult.totalBobotAktif ?? 100}%</td>
                    <td className="py-2.5 px-3 text-right font-mono">{scoreResult.totalPerolehan}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{scoreResult.totalSkorMaksimal}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {scoreResult.totalSkorMaksimal > 0
                        ? `${((scoreResult.totalPerolehan / scoreResult.totalSkorMaksimal) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-900">
                      {scoreResult.nilaiAkhirTerbobot.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Juri Notes & Recommendations Compilation */}
          <div className="mb-8 page-break-inside-avoid">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Catatan &amp; Rekomendasi Perbaikan Tim Verifikator
            </h4>

            {notesList.length > 0 ? (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                {notesList.map((item, idx) => (
                  <div key={idx} className="text-xs text-slate-800 bg-white/70 p-2.5 rounded-lg border border-amber-100">
                    <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <span>• Butir {item.code}: {item.title}</span>
                    </div>
                    <div className="text-emerald-900 font-bold font-mono text-[11px] mt-1 pl-3">
                      {item.juriLabel}:
                    </div>
                    <p className="text-slate-700 pl-3 mt-0.5 italic">
                      &quot;{item.note}&quot;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 italic text-center">
                Seluruh instrumen pemenuhan standar pelayanan publik telah memenuhi ekspektasi penilaian prima. Pertahankan konsistensi kualitas layanan.
              </div>
            )}
          </div>

          {/* Official Signatures */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-700 page-break-inside-avoid">
            <div>
              <p className="text-[10px] text-slate-400">
                Dokumen resmi sistem SI-EPP Kankemenag Gunungkidul.
                <br />
                Verifikasi keaslian via aplikasi SI-EPP.
              </p>
            </div>

            <div className="text-center w-64">
              <p className="mb-1 text-slate-500">Wonosari, {currentDateFormatted}</p>
              <p className="font-semibold text-slate-900">Ketua Tim Penilai Pelayanan Publik</p>
              <p className="text-[11px] text-slate-500">Kankemenag Kabupaten Gunungkidul</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-serif italic text-emerald-800 text-xs">[ Tanda Tangan Resmi Terbit ]</span>
              </div>
              <p className="font-bold text-slate-900 underline">Drs. H. Saiful Bahri, M.S.I</p>
              <p className="font-mono text-[10px] text-slate-500">NIP. 197405102002121003</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Format Dokumen: <strong>A4 Portrait Resmi (SI-EPP 2026)</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Unduh sebagai file PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Kirim ke Printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
