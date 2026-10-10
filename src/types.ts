export type KategoriUnit = 'KUA' | 'MIN' | 'MTsN & MAN';

export interface SatuanKerja {
  id: string;
  nama: string;
  kategori: KategoriUnit;
  kapanewon: string;
  jenjang?: 'MIN' | 'MTsN' | 'MAN';
}

export interface ButirInstrumen {
  code: string;
  aspekId: number;
  judul: string;
  pertanyaan: string;
  buktiDukung: string;
  opsi: [string, string, string, string, string]; // Skor 0, 1, 2, 3, 4
}

export interface AspekInfo {
  id: number;
  nama: string;
  bobot: number; // in percent e.g. 12 for 12%
  skorMaks: number; // e.g. 12 or 16
  keterangan: string;
}

export type StatusEvaluasi = 'BELUM_ISI' | 'DRAFT' | 'SUBMITTED' | 'VERIFIED';

export interface JuriVerificationEntry {
  juriId: string; // e.g. 'JURI-1', 'JURI-2', ...
  namaVerifikator: string;
  scores: Record<string, number>; // code -> score 0-4
  notes: Record<string, string>; // code -> catatan juri
  nilaiAkhirTerbobot: number;
  verifiedAt: string;
}

export interface SatkerEvaluation {
  status: StatusEvaluasi;
  responses: Record<string, number>; // code -> score 0-4
  links: Record<string, string>; // code -> link bukti
  videoUrl?: string;
  videoDeskripsi?: string;
  verifScores: Record<string, number>; // code -> score 0-4 (rerata multi-juri)
  verifNotes: Record<string, string>; // code -> catatan juri
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifikasiJuri?: Record<string, JuriVerificationEntry>; // juriId -> entry
}

export interface MultiJuriSummary {
  juriCount: number;
  juriEntries: JuriVerificationEntry[];
  averageScore: number;
  predikat: PredikatInfo;
  breakdownText: string;
  badgeText: string;
  combinedNotes: Array<{
    code: string;
    title: string;
    juriId: string;
    namaVerifikator: string;
    note: string;
  }>;
  averageAspectScores: AspectScoreResult[];
}

export interface AspectScoreResult {
  aspekId: number;
  nama: string;
  bobot: number;
  perolehanSkor: number;
  skorMaksimal: number;
  persentase: number;
  nilaiTerbobot: number;
  isActive?: boolean;
}

export interface EvaluationScoreResult {
  totalSkorMaksimal: number;
  totalPerolehan: number;
  totalBobotAktif?: number;
  nilaiAkhirTerbobot: number;
  aspekScores: AspectScoreResult[];
  predikat: PredikatInfo;
}

export interface PredikatInfo {
  kode: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
  deskripsi: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
}
