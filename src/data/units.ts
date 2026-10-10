import { SatuanKerja } from '../types';

export const DAFTAR_UNIT_KERJA: SatuanKerja[] = [
  // Kategori: KUA (18 Unit Kerja)
  { id: "KUA-01", nama: "KUA Wonosari", kategori: "KUA", kapanewon: "Wonosari" },
  { id: "KUA-02", nama: "KUA Playen", kategori: "KUA", kapanewon: "Playen" },
  { id: "KUA-03", nama: "KUA Patuk", kategori: "KUA", kapanewon: "Patuk" },
  { id: "KUA-04", nama: "KUA Nglipar", kategori: "KUA", kapanewon: "Nglipar" },
  { id: "KUA-05", nama: "KUA Ngawen", kategori: "KUA", kapanewon: "Ngawen" },
  { id: "KUA-06", nama: "KUA Semin", kategori: "KUA", kapanewon: "Semin" },
  { id: "KUA-07", nama: "KUA Karangmojo", kategori: "KUA", kapanewon: "Karangmojo" },
  { id: "KUA-08", nama: "KUA Ponjong", kategori: "KUA", kapanewon: "Ponjong" },
  { id: "KUA-09", nama: "KUA Semanu", kategori: "KUA", kapanewon: "Semanu" },
  { id: "KUA-10", nama: "KUA Tepus", kategori: "KUA", kapanewon: "Tepus" },
  { id: "KUA-11", nama: "KUA Tanjungsari", kategori: "KUA", kapanewon: "Tanjungsari" },
  { id: "KUA-12", nama: "KUA Rongkop", kategori: "KUA", kapanewon: "Rongkop" },
  { id: "KUA-13", nama: "KUA Girisubo", kategori: "KUA", kapanewon: "Girisubo" },
  { id: "KUA-14", nama: "KUA Saptosari", kategori: "KUA", kapanewon: "Saptosari" },
  { id: "KUA-15", nama: "KUA Paliyan", kategori: "KUA", kapanewon: "Paliyan" },
  { id: "KUA-16", nama: "KUA Panggang", kategori: "KUA", kapanewon: "Panggang" },
  { id: "KUA-17", nama: "KUA Purwosari", kategori: "KUA", kapanewon: "Purwosari" },
  { id: "KUA-18", nama: "KUA Gedangsari", kategori: "KUA", kapanewon: "Gedangsari" },

  // Kategori: MIN (12 Satker: MIN 1 s.d. MIN 12 Gunungkidul)
  { id: "MAD-01", nama: "MIN 1 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Ngawen" },
  { id: "MAD-02", nama: "MIN 2 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Rongkop" },
  { id: "MAD-03", nama: "MIN 3 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Semin" },
  { id: "MAD-04", nama: "MIN 4 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Wonosari" },
  { id: "MAD-05", nama: "MIN 5 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Playen" },
  { id: "MAD-06", nama: "MIN 6 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Tepus" },
  { id: "MAD-07", nama: "MIN 7 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Patuk" },
  { id: "MAD-08", nama: "MIN 8 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Semanu" },
  { id: "MAD-09", nama: "MIN 9 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Karangmojo" },
  { id: "MAD-10", nama: "MIN 10 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Saptosari" },
  { id: "MAD-11", nama: "MIN 11 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Ponjong" },
  { id: "MAD-12", nama: "MIN 12 Gunungkidul", kategori: "MIN", jenjang: "MIN", kapanewon: "Ngawen" },

  // Kategori: MTsN & MAN (10 Satker: MTsN 1 s.d. MTsN 9 dan MAN 1 Gunungkidul)
  { id: "MAD-13", nama: "MTsN 1 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Playen" },
  { id: "MAD-14", nama: "MTsN 2 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Ponjong" },
  { id: "MAD-15", nama: "MTsN 3 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Semanu" },
  { id: "MAD-16", nama: "MTsN 4 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Wonosari" },
  { id: "MAD-17", nama: "MTsN 5 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Ngawen" },
  { id: "MAD-18", nama: "MTsN 6 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Playen" },
  { id: "MAD-19", nama: "MTsN 7 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Nglipar" },
  { id: "MAD-20", nama: "MTsN 8 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Karangmojo" },
  { id: "MAD-21", nama: "MTsN 9 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MTsN", kapanewon: "Rongkop" },
  { id: "MAD-22", nama: "MAN 1 Gunungkidul", kategori: "MTsN & MAN", jenjang: "MAN", kapanewon: "Wonosari" }
];
