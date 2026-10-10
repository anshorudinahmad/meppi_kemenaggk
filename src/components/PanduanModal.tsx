import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Link as LinkIcon,
  Printer,
  Shield,
  Sparkles,
  X,
  Building,
  Check,
  Phone,
  Mail,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ASPEK_LIST, INSTRUMEN_LIST } from '../data/instruments';

interface PanduanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PanduanModal: React.FC<PanduanModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'alur' | 'aspek' | 'bukti' | 'skoring' | 'faq'>('all');
  const [pdfHint, setPdfHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = 'Buku_Panduan_Penggunaan_SIEPP_Satker_Kemenag_Gunungkidul_2026';
    window.print();
    document.title = originalTitle;
  };

  const handleSavePdf = () => {
    const originalTitle = document.title;
    document.title = 'Buku_Panduan_Penggunaan_SIEPP_Satker_Kemenag_Gunungkidul_2026';
    setPdfHint('Pilih Tujuan (Destination): "Simpan sebagai PDF" / "Save as PDF" dengan tata letak Portrait pada dialog cetak browser.');
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
    <div
      id="panduan-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div
        id="panduan-modal-dialog"
        className="bg-white w-full max-w-5xl max-h-[96vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#021814] text-white px-4 sm:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 border-b border-emerald-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md font-extrabold border border-amber-300">
              <BookOpen className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Buku Panduan Penggunaan Satuan Kerja
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Format PDF
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                Pedoman Operasional Penilaian Mandiri SI-EPP 2026 · Kemenag Kab. Gunungkidul
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Quick Navigation Tabs (Screen only) */}
            <div className="hidden lg:flex items-center bg-emerald-950/60 p-1 rounded-xl border border-emerald-700/50 mr-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'all' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('alur')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'alur' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Alur Kerja
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('aspek')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'aspek' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                8 Aspek
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bukti')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'bukti' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Bukti Dukung
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('skoring')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'skoring' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Predikat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'faq' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                FAQ
              </button>
            </div>

            {/* Action 1: Save / Download PDF */}
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
              title="Unduh Panduan sebagai dokumen PDF resmi"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            {/* Action 2: Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-600/60 cursor-pointer active:scale-95"
              title="Cetak Buku Panduan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
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

        {/* Helpful Banner for PDF generation */}
        {pdfHint && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{pdfHint}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfHint(null)}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div
          id="panduan-modal-printable"
          className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-10 bg-white text-slate-800"
        >
          {/* ============================================================== */}
          {/* KOP RESMI DOKUMEN (STANDAR KEMENTERIAN AGAMA GUNUNGKIDUL)     */}
          {/* ============================================================== */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-950 text-amber-400 font-extrabold border-2 border-amber-400 shadow-md">
                <Building className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>

              <div className="text-center flex-1">
                <h4 className="text-xs sm:text-sm font-bold tracking-widest text-slate-700 uppercase">
                  Kementerian Agama Republik Indonesia
                </h4>
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                  Kantor Kementerian Agama Kabupaten Gunungkidul
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
                  Jl. Brigjen Katamso No. 13, Purbosari, Wonosari, Kabupaten Gunungkidul, D.I. Yogyakarta 55812
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                  Laman: gunungkidul.kemenag.go.id · Pos-el: kepeg.gk@gmail.com
                </p>
              </div>

              <div className="w-16 sm:w-20 shrink-0 hidden sm:block text-right">
                <span className="text-[9px] font-mono text-slate-400 block">DOKUMEN RESMI</span>
                <span className="text-[10px] font-bold text-emerald-800 block">SI-EPP 2026</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* COVER TITLE & IDENTITAS DOKUMEN                               */}
          {/* ============================================================== */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-9 shadow-lg relative overflow-hidden border border-emerald-700/50 page-break-inside-avoid">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-xs">
                  Pedoman Resmi Satuan Kerja
                </span>
                <span className="text-emerald-300 text-xs font-mono">
                  Kode Dok: PND-SIEPP/GK/2026.01
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Buku Panduan Evaluasi Mandiri Standar Pelayanan Publik (SI-EPP)
              </h1>

              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-2xl">
                Petunjuk Teknis Tata Cara Pengisian Penilaian Mandiri, Pengunggahan Bukti Dukung 8 Aspek Pelayanan,
                Verifikasi Tim Penilai, dan Penerbitan Rapor Hasil Evaluasi bagi 18 KUA, 12 MIN, 9 MTsN, dan 1 MAN.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-emerald-200 font-medium border-t border-emerald-800/80">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Tahun Penilaian: <strong>2026</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Sasaran: <strong>40 Satuan Kerja</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Sistem: <strong>Terpadu &amp; Terverifikasi</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 1: DASAR HUKUM & SEKILAS APLIKASI                     */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'alur') && (
            <div className="space-y-4 page-break-inside-avoid">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sekilas Aplikasi &amp; Landasan Yuridis</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                Aplikasi <strong>Sistem Evaluasi Pelayanan Publik (SI-EPP)</strong> merupakan inovasi digital di lingkungan
                Kantor Kementerian Agama Kabupaten Gunungkidul untuk menjamin standar mutu pelayanan prima, kepastian
                layanan, transparansi, serta akuntabilitas penyelenggaraan layanan di seluruh KUA dan Madrasah Negeri
                sesuai amanat perundang-undangan:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    <span>UU No. 25 Tahun 2009</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tentang Pelayanan Publik, mewajibkan setiap penyelenggara negara menyusun dan menetapkan Standar Pelayanan.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>PermenPAN-RB No. 29/2022</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pedoman Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (PEKPPP) secara berkala dan terukur.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Keputusan Menteri Agama</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pedoman Standar Pelayanan dan Penguatan Zona Integritas (WBK/WBBM) di lingkungan Kementerian Agama RI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: 5 LANGKAH ALUR KERJA SATUAN KERJA                  */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'alur') && (
            <div className="space-y-4 page-break-inside-avoid">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900">Alur 5 Langkah Pengisian oleh Satuan Kerja</h3>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
                    1
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Pilih Mode Satuan Kerja &amp; Satker Anda</h4>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Langkah Awal
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pada navigasi atas, pastikan berada pada <strong>Mode Satuan Kerja</strong>. Pilih kelompok kategori
                      (KUA, MIN, atau MTsN &amp; MAN), kemudian pilih nama satuan kerja Anda melalui menu dropdown pilihan.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
                    2
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Lengkapi Pemenuhan 8 Aspek (42 Butir Instrumen)</h4>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Evaluasi Mandiri
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Buka tab pada masing-masing dari 8 Aspek Standar Pelayanan. Teliti setiap butir instrumen, pilih opsi
                      jawaban/skor pemenuhan (skala 1 s.d. 5) yang secara nyata dan jujur telah diterapkan di unit kerja Anda.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
                    3
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Lampirkan Tautan Bukti Dukung (Google Drive / Cloud)</h4>
                      <span className="text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                        Wajib &amp; Terverifikasi
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pada kolom bukti dukung di setiap butir, salin tautan (URL) dokumen pendukung (Google Drive, OneDrive,
                      atau portal resmi). <strong>Penting:</strong> Pastikan setelan berbagi (share permissions) diatur ke
                      <em> "Siapa saja yang memiliki link dapat melihat (Viewer)"</em> agar juri dapat memverifikasi berkas.
                      Jika ingin mengunggah file langsung ke folder bersama, Anda dapat menggunakan{' '}
                      <a
                        href="https://drive.google.com/drive/folders/1A17BS_i_8IiQd4b0hPHvXIRjAFXYzUiI?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline font-semibold"
                      >
                        Folder Drive Terpusat Kankemenag
                      </a>
                      , lalu menyalin link file yang telah diunggah ke formulir.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
                    4
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Simpan Sementara (Draft) atau Ajukan Resmi (Submit)</h4>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Finalisasi Data
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Gunakan tombol <strong>"Simpan Draft"</strong> jika pengisian belum tuntas. Jika seluruh 42 butir instrumen
                      dan tautan bukti telah terisi lengkap, klik tombol <strong>"Kirim Evaluasi Mandiri"</strong> untuk mengirim berkas
                      resmi kepada Tim Penilai / Juri Kemenag.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
                    5
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Pantau Hasil Penilaian Juri &amp; Cetak Rapor Resmi</h4>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Rapor &amp; Sertifikat
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Setelah Tim Penilai melakukan verifikasi berkas dan lapangan, status satker akan berubah menjadi
                      <strong> "Telah Diverifikasi Resmi"</strong>. Satker dapat mengunduh dan mencetak
                      <strong> Lembar Rapor Evaluasi Pelayanan Publik</strong> berformat PDF resmi lengkap dengan rincian nilai dan catatan perbaikan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: TABEL 8 ASPEK & BOBOT PENILAIAN                     */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'aspek') && (
            <div className="space-y-4 page-break-inside-avoid">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900">Rincian 8 Aspek Standar Pelayanan &amp; Bobot Penilaian</h3>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">No</th>
                      <th className="py-3 px-4">Nama Aspek Pelayanan</th>
                      <th className="py-3 px-3 text-center w-28">Jumlah Butir</th>
                      <th className="py-3 px-3 text-center w-28">Bobot (%)</th>
                      <th className="py-3 px-4">Fokus Pemenuhan Standar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700 bg-white">
                      {ASPEK_LIST.map((aspek, idx) => {
                        const count = INSTRUMEN_LIST.filter((i) => i.aspekId === aspek.id).length;
                        return (
                          <tr key={aspek.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="py-3 px-3.5 text-center font-bold text-slate-900">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{aspek.nama}</td>
                            <td className="py-3 px-3 text-center font-mono">{count} Butir</td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/60">
                              {aspek.bobot}%
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              {aspek.keterangan}
                            </td>
                          </tr>
                        );
                      })}
                    <tr className="bg-emerald-950 text-white font-extrabold text-xs">
                      <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider">
                        Total Akumulasi
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">42 Butir</td>
                      <td className="py-3.5 px-3 text-center font-mono text-amber-300">100%</td>
                      <td className="py-3.5 px-4 text-emerald-200 font-normal text-[11px]">
                        Konversi Skor Skala 0 s.d. 100
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: STANDAR BUKTI DUKUNG GOOGLE DRIVE                  */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'bukti') && (
            <div className="space-y-4 page-break-inside-avoid">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h3 className="text-lg font-bold text-slate-900">Ketentuan &amp; Standar Bukti Dukung (Evidence)</h3>
              </div>

              <div className="bg-amber-50/80 rounded-2xl p-4 sm:p-5 border border-amber-300/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Penting: Tata Cara Pengaturan Link Google Drive Agar Lolos Verifikasi</span>
                </div>
                <p className="text-xs text-amber-950/85 leading-relaxed">
                  Banyak berkas yang gagal dinilai oleh Tim Juri diakibatkan oleh tautan terkunci (memerlukan izin akses).
                  Pastikan mengikuti protokol berikut sebelum menyematkan link ke aplikasi:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-amber-200/90 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Atur Akses Publik
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Klik kanan folder/file Drive &gt; <strong>Bagikan (Share)</strong> &gt; Ubah Akses Umum menjadi <strong>"Siapa saja yang memiliki link dapat melihat"</strong> (Anyone with the link: Viewer).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200/90 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Penamaan Rapi &amp; Jelas
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Beri nama file/folder dengan kode butir yang sesuai, misal: <code>[1.1] SOP_Layanan_Nikah.pdf</code> atau <code>[3.2] Foto_Ruang_Tunggu.jpg</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block text-xs mb-1">SK &amp; Dokumen Resmi</span>
                  <span className="text-[11px] text-slate-500">
                    Format PDF bertandatangan pejabat &amp; berstempel resmi instansi.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block text-xs mb-1">Foto Sarana Prasarana</span>
                  <span className="text-[11px] text-slate-500">
                    Foto berwarna jelas, memperlihatkan kondisi fisik ruangan yang bersih dan rapi.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block text-xs mb-1">Laporan SKM &amp; Aduan</span>
                  <span className="text-[11px] text-slate-500">
                    Rekapitulasi berkala disertai bukti tindak lanjut penyelesaian penanganan aduan.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block text-xs mb-1">Tautan Publikasi</span>
                  <span className="text-[11px] text-slate-500">
                    Tautan aktif YouTube, Instagram, atau website satker yang dapat diakses publik.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 5: KLASIFIKASI PREDIKAT & SKORING                      */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'skoring') && (
            <div className="space-y-4 page-break-inside-avoid">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h3 className="text-lg font-bold text-slate-900">Klasifikasi Predikat Mutu &amp; Kriteria Penilaian</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-1">
                  <span className="font-mono text-2xl font-black text-emerald-900">A</span>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Pelayanan Prima</div>
                  <div className="text-xs font-mono font-bold text-slate-700">90.00 – 100.00</div>
                  <p className="text-[10px] text-slate-500 mt-1">Sangat Baik Sekali, teladan standar mutu.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-300 text-center space-y-1">
                  <span className="font-mono text-2xl font-black text-teal-900">B</span>
                  <div className="text-[10px] font-bold text-teal-800 uppercase">Sangat Baik</div>
                  <div className="text-xs font-mono font-bold text-slate-700">80.00 – 89.99</div>
                  <p className="text-[10px] text-slate-500 mt-1">Memenuhi mayoritas standar dengan baik.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-300 text-center space-y-1">
                  <span className="font-mono text-2xl font-black text-blue-900">C</span>
                  <div className="text-[10px] font-bold text-blue-800 uppercase">Baik</div>
                  <div className="text-xs font-mono font-bold text-slate-700">70.00 – 79.99</div>
                  <p className="text-[10px] text-slate-500 mt-1">Standar dasar terpenuhi, butuh pembaruan.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-center space-y-1">
                  <span className="font-mono text-2xl font-black text-amber-900">D</span>
                  <div className="text-[10px] font-bold text-amber-800 uppercase">Cukup</div>
                  <div className="text-xs font-mono font-bold text-slate-700">60.00 – 69.99</div>
                  <p className="text-[10px] text-slate-500 mt-1">Perlu perbaikan pada sarpras dan SOP.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-center space-y-1">
                  <span className="font-mono text-2xl font-black text-rose-900">E</span>
                  <div className="text-[10px] font-bold text-rose-800 uppercase">Perlu Pembinaan</div>
                  <div className="text-xs font-mono font-bold text-slate-700">&lt; 60.00</div>
                  <p className="text-[10px] text-slate-500 mt-1">Wajib pembinaan khusus dari Kankemenag.</p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 6: FAQ & PUSAT BANTUAN                                 */}
          {/* ============================================================== */}
          {(activeTab === 'all' || activeTab === 'faq') && (
            <div className="space-y-4 page-break-inside-avoid">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  06
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pertanyaan Sering Diajukan (FAQ) &amp; Bantuan</h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">
                    Q: Apakah data evaluasi yang disimpan sementara (draft) bisa hilang?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    A: Tidak. Sistem secara otomatis mencadangkan data formulir Anda ke penyimpanan lokal aman browser dan database sinkronisasi cloud. Namun tetap disarankan melakukan klik "Simpan Draft" setelah melengkapi data.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">
                    Q: Bagaimana jika link bukti dukung kami perlu diperbaiki setelah dikirim?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    A: Satuan kerja dapat memperbarui isi folder Google Drive kapan saja tanpa mengubah link yang sudah disematkan, atau berkoordinasi dengan Tim Juri/Verifikator untuk membuka kembali akses pengeditan.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">
                    Q: Kapan sertifikat atau rapor hasil evaluasi resmi dapat dicetak?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    A: Rapor resmi dapat dicetak segera setelah Tim Juri menetapkan status "VERIFIED" (Sudah Diverifikasi Juri). Anda dapat mengklik tombol "Cetak Rapor Resmi" pada banner status satker Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* LEMBAR PENGESAHAN RESMI (PRINT ONLY / OFFICIAL FOOTER)         */}
          {/* ============================================================== */}
          <div className="pt-8 border-t-2 border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 page-break-inside-avoid">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">SI-EPP Versi 2.4.0 · Kemenag Gunungkidul</p>
              <p>Dokumen Pedoman Operasional Pengguna Layanan Satuan Kerja</p>
              <p className="font-mono text-[10px]">Dicetak resmi pada: {currentDateFormatted}</p>
            </div>

            <div className="text-center sm:text-right space-y-1 min-w-[240px]">
              <p className="text-xs text-slate-600">Wonosari, {currentDateFormatted}</p>
              <p className="text-xs font-bold text-slate-900">
                Kepala Kantor Kementerian Agama
                <br />
                Kabupaten Gunungkidul
              </p>
              <div className="h-16 flex items-center justify-center sm:justify-end">
                <span className="text-[10px] text-emerald-800 font-mono italic px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                  [Tertanda secara Elektronik &amp; Sah]
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 underline">
                Dr. H. Mukotip, S.Ag., M.Pd.I
              </p>
              <p className="text-[11px] font-mono text-slate-600">
                NIP. 197012121997031003
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
