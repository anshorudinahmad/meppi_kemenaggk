import { ASPEK_LIST, INSTRUMEN_LIST } from '../data/instruments';
import { DAFTAR_UNIT_KERJA } from '../data/units';
import {
  AspectScoreResult,
  EvaluationScoreResult,
  JuriVerificationEntry,
  MultiJuriSummary,
  PredikatInfo,
  SatkerEvaluation,
  KategoriUnit
} from '../types';
import { getStoredAspekConfig, isAspekActive, getTotalBobotAktif } from './aspekConfig';

export const STORAGE_KEY = 'SIEPP_KEMENAG_GK_DATA_V1';

export function getPredikatInfo(score: number): PredikatInfo {
  const rounded = Number(score.toFixed(2));
  if (rounded > 90.00) {
    return {
      kode: 'A',
      label: 'A (Pelayanan Prima)',
      deskripsi: 'Pelayanan Prima dengan kepatuhan standar pelayanan luar biasa dan inovasi unggul.',
      colorClass: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      bgLightClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderClass: 'border-emerald-600'
    };
  }
  if (rounded > 80.00) {
    return {
      kode: 'B',
      label: 'B (Sangat Baik)',
      deskripsi: 'Sangat Baik, memenuhi seluruh standar pokok pelayanan dengan konsisten.',
      colorClass: 'text-blue-800 bg-blue-100 border-blue-300',
      bgLightClass: 'bg-blue-50 text-blue-800 border-blue-200',
      borderClass: 'border-blue-600'
    };
  }
  if (rounded > 70.00) {
    return {
      kode: 'C',
      label: 'C (Baik)',
      deskripsi: 'Baik, standar pelayanan dasar telah terpenuhi namun perlu akselerasi sarpras dan inovasi.',
      colorClass: 'text-amber-800 bg-amber-100 border-amber-300',
      bgLightClass: 'bg-amber-50 text-amber-800 border-amber-200',
      borderClass: 'border-amber-500'
    };
  }
  if (rounded > 60.00) {
    return {
      kode: 'D',
      label: 'D (Cukup / Catatan)',
      deskripsi: 'Cukup dengan catatan pemenuhan komponen standar yang belum komprehensif.',
      colorClass: 'text-orange-800 bg-orange-100 border-orange-300',
      bgLightClass: 'bg-orange-50 text-orange-800 border-orange-200',
      borderClass: 'border-orange-500'
    };
  }
  return {
    kode: 'E',
    label: 'E (Kurang / Perlu Pembinaan)',
    deskripsi: 'Kurang memadai, memerlukan pendampingan intensif dari Tim Pengawas Kemenag.',
    colorClass: 'text-rose-800 bg-rose-100 border-rose-300',
    bgLightClass: 'bg-rose-50 text-rose-800 border-rose-200',
    borderClass: 'border-rose-600'
  };
}

/**
 * Menghitung rincian skor per aspek dan total nilai terbobot murni dari objek skor { [code]: number }
 * Menggunakan rumus nilai akhir dinamis proporsional (redistribusi bobot):
 * (Skor Perolehan / Total Bobot Aktif) * 100
 */
export function calculateBaseScore(
  scoresObj: Record<string, number> = {},
  aspekConfigOrCategory?: Record<number, boolean> | KategoriUnit
): EvaluationScoreResult {
  const config = typeof aspekConfigOrCategory === 'string'
    ? getStoredAspekConfig(aspekConfigOrCategory)
    : (aspekConfigOrCategory || getStoredAspekConfig());
  let totalSkorMaksimal = 0;
  let totalPerolehan = 0;
  let skorPerolehanAktif = 0;
  let totalBobotAktif = 0;

  const aspekScores = ASPEK_LIST.map((aspek) => {
    const active = isAspekActive(aspek.id, config);
    const items = INSTRUMEN_LIST.filter((i) => i.aspekId === aspek.id);
    const skorMaks = items.length * 4;

    let perolehan = 0;
    items.forEach((item) => {
      const score = scoresObj[item.code];
      if (typeof score === 'number' && !isNaN(score)) {
        perolehan += Math.max(0, Math.min(4, score));
      }
    });

    if (active) {
      totalSkorMaksimal += skorMaks;
      totalPerolehan += perolehan;
      totalBobotAktif += aspek.bobot;

      const persentase = skorMaks > 0 ? (perolehan / skorMaks) * 100 : 0;
      // Rumus skor terbobot riil per aspek: (Skor Perolehan / Skor Maks Aspek) * Bobot Aspek
      const nilaiTerbobot = skorMaks > 0 ? (perolehan / skorMaks) * aspek.bobot : 0;
      skorPerolehanAktif += nilaiTerbobot;

      return {
        aspekId: aspek.id,
        nama: aspek.nama,
        bobot: aspek.bobot,
        perolehanSkor: perolehan,
        skorMaksimal: skorMaks,
        persentase: Number(persentase.toFixed(2)),
        nilaiTerbobot: Number(nilaiTerbobot.toFixed(2)),
        isActive: true
      };
    } else {
      // Aspek yang dinonaktifkan: tidak dihitung dalam total bobot aktif
      return {
        aspekId: aspek.id,
        nama: aspek.nama,
        bobot: aspek.bobot,
        perolehanSkor: 0,
        skorMaksimal: skorMaks,
        persentase: 0,
        nilaiTerbobot: 0,
        isActive: false
      };
    }
  });

  // Rumus Nilai Akhir Baru (Proporsional / Redistribusi Bobot):
  // (Skor Perolehan / Total Bobot Aktif) * 100
  const finalScore = totalBobotAktif > 0
    ? Number(((skorPerolehanAktif / totalBobotAktif) * 100).toFixed(2))
    : 0;
  const predikat = getPredikatInfo(finalScore);

  return {
    totalSkorMaksimal,
    totalPerolehan,
    totalBobotAktif,
    nilaiAkhirTerbobot: finalScore,
    aspekScores,
    predikat
  };
}

/**
 * Ringkasan Multi-Verifikator / Panel Tim Juri
 * Menghitung Nilai Akhir Rata-Rata Otomatis dari seluruh Juri yang telah memverifikasi satker
 */
export function getMultiJuriSummary(
  evalData?: SatkerEvaluation,
  aspekConfigOrCategory?: Record<number, boolean> | KategoriUnit
): MultiJuriSummary {
  const config = typeof aspekConfigOrCategory === 'string'
    ? getStoredAspekConfig(aspekConfigOrCategory)
    : (aspekConfigOrCategory || getStoredAspekConfig());
  const entries: JuriVerificationEntry[] = [];

  if (evalData?.verifikasiJuri && Object.keys(evalData.verifikasiJuri).length > 0) {
    Object.values(evalData.verifikasiJuri).forEach((entry) => {
      if (entry && entry.juriId) {
        entries.push(entry);
      }
    });
  }

  // Fallback jika status VERIFIED namun belum ada entri di verifikasiJuri (data legacy)
  if (entries.length === 0 && evalData?.status === 'VERIFIED') {
    const singleScores = evalData.verifScores || {};
    const singleNotes = evalData.verifNotes || {};
    const base = calculateBaseScore(singleScores, config);
    entries.push({
      juriId: 'JURI-1',
      namaVerifikator: evalData.verifiedBy || 'Dr. H. Mukotip, S.Ag., M.Pd.I',
      scores: singleScores,
      notes: singleNotes,
      nilaiAkhirTerbobot: base.nilaiAkhirTerbobot,
      verifiedAt: evalData.verifiedAt || '2026-10-02 14:15 WIB'
    });
  }

  if (entries.length === 0) {
    const selfBase = calculateBaseScore(evalData?.responses || {}, config);
    return {
      juriCount: 0,
      juriEntries: [],
      averageScore: selfBase.nilaiAkhirTerbobot,
      predikat: selfBase.predikat,
      breakdownText: '',
      badgeText: 'Belum Dinilai Juri',
      combinedNotes: [],
      averageAspectScores: selfBase.aspekScores
    };
  }

  // Hitung ulang nilai masing-masing Juri dengan rumus dinamis aktif
  const evaluatedEntries: JuriVerificationEntry[] = entries.map((entry) => {
    const base = calculateBaseScore(entry.scores, config);
    return {
      ...entry,
      nilaiAkhirTerbobot: base.nilaiAkhirTerbobot
    };
  });

  // Urutkan juri berdasarkan ID (JURI-1, JURI-2, dst)
  evaluatedEntries.sort((a, b) => a.juriId.localeCompare(b.juriId));

  // Hitung Rata-rata Aritmatika Nilai Terbobot Seluruh Juri
  const sumScores = evaluatedEntries.reduce((sum, e) => sum + e.nilaiAkhirTerbobot, 0);
  const averageScore = Number((sumScores / evaluatedEntries.length).toFixed(2));
  const predikat = getPredikatInfo(averageScore);

  // Rincian singkat: e.g. "J1: 85.0 | J2: 91.0"
  const breakdownParts = evaluatedEntries.map((e) => {
    const shortId = e.juriId.replace('JURI-', 'J');
    return `${shortId}: ${e.nilaiAkhirTerbobot.toFixed(1)}`;
  });
  const breakdownText = breakdownParts.join(' | ');

  // Badge text: e.g. "Rata-rata 2 Juri" atau "1 Juri (JURI-1)"
  const badgeText = evaluatedEntries.length > 1
    ? `Rata-rata ${evaluatedEntries.length} Juri`
    : `1 Juri (${evaluatedEntries[0].juriId})`;

  // Gabungkan seluruh catatan perbaikan dari semua Juri dengan label nama jurinya
  const combinedNotes: Array<{
    code: string;
    title: string;
    juriId: string;
    namaVerifikator: string;
    note: string;
  }> = [];

  INSTRUMEN_LIST.forEach((item) => {
    evaluatedEntries.forEach((entry) => {
      const note = entry.notes?.[item.code];
      if (note && note.trim() !== '') {
        combinedNotes.push({
          code: item.code,
          title: item.judul,
          juriId: entry.juriId,
          namaVerifikator: entry.namaVerifikator,
          note: note.trim()
        });
      }
    });
  });

  // Hitung rata-rata per aspek dari seluruh juri
  const averageAspectScores: AspectScoreResult[] = ASPEK_LIST.map((aspek) => {
    const active = isAspekActive(aspek.id, config);
    const items = INSTRUMEN_LIST.filter((i) => i.aspekId === aspek.id);
    const skorMaks = items.length * 4;

    if (!active) {
      return {
        aspekId: aspek.id,
        nama: aspek.nama,
        bobot: aspek.bobot,
        perolehanSkor: 0,
        skorMaksimal: skorMaks,
        persentase: 0,
        nilaiTerbobot: 0,
        isActive: false
      };
    }

    let sumAspectScore = 0;
    evaluatedEntries.forEach((entry) => {
      const entryBase = calculateBaseScore(entry.scores, config);
      const asp = entryBase.aspekScores.find((a) => a.aspekId === aspek.id);
      if (asp) sumAspectScore += asp.nilaiTerbobot;
    });

    const avgVal = Number((sumAspectScore / evaluatedEntries.length).toFixed(2));

    return {
      aspekId: aspek.id,
      nama: aspek.nama,
      bobot: aspek.bobot,
      perolehanSkor: 0,
      skorMaksimal: skorMaks,
      persentase: aspek.bobot > 0 ? Number(((avgVal / aspek.bobot) * 100).toFixed(1)) : 0,
      nilaiTerbobot: avgVal,
      isActive: true
    };
  });

  return {
    juriCount: evaluatedEntries.length,
    juriEntries: evaluatedEntries,
    averageScore,
    predikat,
    breakdownText,
    badgeText,
    combinedNotes,
    averageAspectScores
  };
}

export function calculateEvaluationScore(
  evalData?: SatkerEvaluation,
  source: 'self' | 'juri' = 'juri',
  aspekConfigOrCategory?: Record<number, boolean> | KategoriUnit
): EvaluationScoreResult {
  const config = typeof aspekConfigOrCategory === 'string'
    ? getStoredAspekConfig(aspekConfigOrCategory)
    : (aspekConfigOrCategory || getStoredAspekConfig());

  // Jika penilaian juri dan berstatus VERIFIED, gunakan multi-juri rata-rata
  if (source === 'juri' && evalData?.status === 'VERIFIED') {
    if (evalData.verifikasiJuri && Object.keys(evalData.verifikasiJuri).length > 0) {
      const multi = getMultiJuriSummary(evalData, config);
      return {
        totalSkorMaksimal: 100,
        totalPerolehan: multi.averageScore,
        totalBobotAktif: getTotalBobotAktif(config),
        nilaiAkhirTerbobot: multi.averageScore,
        aspekScores: multi.averageAspectScores,
        predikat: multi.predikat
      };
    }
    // Jika hanya verifScores tunggal
    if (evalData.verifScores && Object.keys(evalData.verifScores).length > 0) {
      return calculateBaseScore(evalData.verifScores, config);
    }
  }

  // Penilaian mandiri satker (self)
  return calculateBaseScore(evalData?.responses || {}, config);
}

export function generateSeedData(): Record<string, SatkerEvaluation> {
  const seeds: Record<string, SatkerEvaluation> = {};

  const seededUnits = [
    {
      id: 'KUA-01',
      baseScore: 4,
      name: 'KUA Wonosari',
      video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      juries: [
        { id: 'JURI-1', name: 'Drs. H. Saiful Bahri, M.S.I', delta: 0, date: '2026-10-02 10:15 WIB' },
        { id: 'JURI-2', name: 'Hj. Siti Rohmah, S.Ag., M.A', delta: 0, date: '2026-10-02 13:40 WIB' }
      ]
    },
    {
      id: 'KUA-02',
      baseScore: 3,
      name: 'KUA Playen',
      video: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      juries: [
        { id: 'JURI-1', name: 'Drs. H. Saiful Bahri, M.S.I', delta: 0, date: '2026-10-02 11:20 WIB' },
        { id: 'JURI-3', name: 'H. Ahmad Fauzi, S.H.I., M.H', delta: 1, date: '2026-10-02 14:10 WIB' }
      ]
    },
    {
      id: 'MAD-01',
      baseScore: 4,
      name: 'MIN 1 Gunungkidul',
      video: 'https://drive.google.com/file/d/1exampleMin1Video/view',
      juries: [
        { id: 'JURI-2', name: 'Hj. Siti Rohmah, S.Ag., M.A', delta: 0, date: '2026-10-02 09:30 WIB' },
        { id: 'JURI-4', name: 'Dra. Hj. Nurul Hidayati, M.Pd', delta: -1, date: '2026-10-02 15:20 WIB' }
      ]
    },
    {
      id: 'MAD-13',
      baseScore: 3,
      name: 'MTsN 1 Gunungkidul',
      video: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
      juries: [
        { id: 'JURI-3', name: 'H. Ahmad Fauzi, S.H.I., M.H', delta: 0, date: '2026-10-02 10:45 WIB' }
      ]
    },
    {
      id: 'MAD-22',
      baseScore: 4,
      name: 'MAN 1 Gunungkidul',
      video: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      juries: [
        { id: 'JURI-1', name: 'Drs. H. Saiful Bahri, M.S.I', delta: 0, date: '2026-10-02 14:00 WIB' },
        { id: 'JURI-2', name: 'Hj. Siti Rohmah, S.Ag., M.A', delta: 0, date: '2026-10-02 15:10 WIB' },
        { id: 'JURI-5', name: 'Muhammad Ridwan, S.Kom., M.M', delta: -1, date: '2026-10-02 16:30 WIB' }
      ]
    },
    {
      id: 'KUA-15',
      baseScore: 3,
      name: 'KUA Paliyan',
      video: 'https://drive.google.com/file/d/1exampleKuaPaliyan/view',
      juries: [
        { id: 'JURI-4', name: 'Dra. Hj. Nurul Hidayati, M.Pd', delta: 0, date: '2026-10-02 11:00 WIB' },
        { id: 'JURI-5', name: 'Muhammad Ridwan, S.Kom., M.M', delta: 1, date: '2026-10-02 13:25 WIB' }
      ]
    },
    { id: 'KUA-07', baseScore: 3, name: 'KUA Karangmojo', status: 'SUBMITTED' as const },
    { id: 'MAD-05', baseScore: 3, name: 'MIN 5 Gunungkidul', status: 'SUBMITTED' as const }
  ];

  seededUnits.forEach((u) => {
    const isVerified = u.status !== 'SUBMITTED';
    const responses: Record<string, number> = {};
    const links: Record<string, string> = {};

    INSTRUMEN_LIST.forEach((item, idx) => {
      let selfScore = u.baseScore;
      if (idx % 5 === 0) selfScore = Math.max(2, u.baseScore - 1);
      if (idx % 7 === 0) selfScore = Math.min(4, u.baseScore);
      responses[item.code] = selfScore;
      links[item.code] = `https://drive.google.com/drive/folders/1_${u.id}_bukti_${item.code.replace('.', '_')}`;
    });

    // Buat multi-juri verifications map
    const verifikasiJuriMap: Record<string, JuriVerificationEntry> = {};
    const combinedVerifScores: Record<string, number> = {};
    const combinedVerifNotes: Record<string, string> = {};

    if (isVerified && u.juries && u.juries.length > 0) {
      u.juries.forEach((jury, jIdx) => {
        const jScores: Record<string, number> = {};
        const jNotes: Record<string, string> = {};

        INSTRUMEN_LIST.forEach((item, idx) => {
          let score = responses[item.code];
          if ((idx + jIdx) % 4 === 0) {
            score = Math.max(1, Math.min(4, score + jury.delta));
          }
          jScores[item.code] = score;

          if (idx === 2) {
            jNotes[item.code] = jIdx === 0
              ? 'Standar Pelayanan sudah terpampang baik, mohon tambahkan SK penetapan terbaru.'
              : 'Sarana Maklumat Pelayanan jelas terbaca di area front office.';
          } else if (idx === 8) {
            jNotes[item.code] = jIdx === 0
              ? 'Toilet disabilitas bersih, perlu penambahan pegangan tangan (handrail).'
              : 'Jalur landai kursi roda sudah memenuhi standar kemiringan.';
          } else if (idx === 22) {
            jNotes[item.code] = `Video alur pelayanan ${u.name} sangat komunikatif dan jelas (Dinilai oleh ${jury.name}).`;
          }
        });

        const jBase = calculateBaseScore(jScores);
        verifikasiJuriMap[jury.id] = {
          juriId: jury.id,
          namaVerifikator: jury.name,
          scores: jScores,
          notes: jNotes,
          nilaiAkhirTerbobot: jBase.nilaiAkhirTerbobot,
          verifiedAt: jury.date
        };
      });

      // Rata-rata skor butir untuk verifScores kompatibilitas
      INSTRUMEN_LIST.forEach((item) => {
        let sum = 0;
        u.juries!.forEach((jury) => {
          sum += verifikasiJuriMap[jury.id].scores[item.code] ?? 0;
        });
        combinedVerifScores[item.code] = Math.round(sum / u.juries!.length);
      });

      // Gabungkan catatan utama
      u.juries.forEach((jury) => {
        Object.entries(verifikasiJuriMap[jury.id].notes).forEach(([code, note]) => {
          if (!combinedVerifNotes[code]) {
            combinedVerifNotes[code] = `[${jury.id} - ${jury.name}]: ${note}`;
          }
        });
      });
    }

    seeds[u.id] = {
      status: isVerified ? 'VERIFIED' : 'SUBMITTED',
      responses,
      links,
      videoUrl: u.video || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoDeskripsi: `Video implementasi Service Excellence dan alur Pelayanan Terpadu Satu Pintu (PTSP) di lingkungan ${u.name}, menampilkan penerapan 5S, loket ramah difabel, penolakan gratifikasi, serta survei kepuasan SKM via QR Code.`,
      verifScores: isVerified ? combinedVerifScores : {},
      verifNotes: isVerified ? combinedVerifNotes : {},
      verifikasiJuri: isVerified ? verifikasiJuriMap : undefined,
      submittedAt: '2026-09-28 09:30 WIB',
      verifiedAt: isVerified ? '2026-10-02 16:30 WIB' : undefined,
      verifiedBy: isVerified
        ? (u.juries ? u.juries.map((j) => `${j.id} (${j.name})`).join(', ') : 'Tim Juri Kemenag')
        : undefined
    };
  });

  return seeds;
}

export function loadStoredEvaluations(): Record<string, SatkerEvaluation> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse localStorage evaluations', err);
  }
  const initial = generateSeedData();
  saveStoredEvaluations(initial);
  return initial;
}

export function saveStoredEvaluations(data: Record<string, SatkerEvaluation>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save evaluations into localStorage', err);
  }
}

/**
 * Menghitung ulang rata-rata nilai dari seluruh kunci objek di dalam satker.verifikasiJuri
 * Bersifat 100% dinamis terhadap berapapun jumlah juri yang menilai
 */
export function recalculateAllEvaluationsMultiJuri(
  evaluations: Record<string, SatkerEvaluation>
): Record<string, SatkerEvaluation> {
  const result: Record<string, SatkerEvaluation> = {};

  Object.entries(evaluations).forEach(([id, satker]) => {
    if (satker.verifikasiJuri && Object.keys(satker.verifikasiJuri).length > 0) {
      const juriEntries = Object.values(satker.verifikasiJuri).filter((e) => e && e.juriId);

      if (juriEntries.length > 0) {
        // Hitung rata-rata per item instrumen dari seluruh entri juri yang ada
        const combinedScores: Record<string, number> = {};
        INSTRUMEN_LIST.forEach((item) => {
          let sum = 0;
          let count = 0;
          juriEntries.forEach((entry) => {
            if (typeof entry.scores?.[item.code] === 'number') {
              sum += entry.scores[item.code];
              count++;
            }
          });
          if (count > 0) {
            combinedScores[item.code] = Math.round((sum / count) * 10) / 10;
          }
        });

        // Gabungkan verifikator
        const verifierNames = juriEntries
          .map((j) => `${j.juriId} (${j.namaVerifikator})`)
          .join(', ');

        result[id] = {
          ...satker,
          status: 'VERIFIED',
          verifScores: combinedScores,
          verifiedBy: verifierNames
        };
      } else {
        result[id] = satker;
      }
    } else {
      result[id] = satker;
    }
  });

  saveStoredEvaluations(result);
  return result;
}

