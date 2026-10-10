import { useState, useEffect } from 'react';
import { ASPEK_LIST } from '../data/instruments';
import { AspekInfo, KategoriUnit } from '../types';

export const ASPEK_CONFIG_STORAGE_KEY = 'pengaturanAspek';
export const ASPEK_CONFIG_EVENT = 'siepp_pengaturan_aspek_updated';

export const KATEGORI_SATKER_LIST: KategoriUnit[] = ['KUA', 'MIN', 'MTsN & MAN'];

export type CategoryAspekConfig = Record<KategoriUnit, Record<number, boolean>>;

export const DEFAULT_ASPEK_CONFIG: Record<number, boolean> = {
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
  7: true,
  8: true
};

export const DEFAULT_CATEGORY_ASPEK_CONFIG: CategoryAspekConfig = {
  'KUA': { ...DEFAULT_ASPEK_CONFIG },
  'MIN': { ...DEFAULT_ASPEK_CONFIG },
  'MTsN & MAN': { ...DEFAULT_ASPEK_CONFIG }
};

/**
 * Normalisasi objek pengaturan aspek tunggal (1..8 boolean)
 */
export function normalizeSingleAspekConfig(rawObj: any): Record<number, boolean> {
  const config: Record<number, boolean> = { ...DEFAULT_ASPEK_CONFIG };
  if (!rawObj || typeof rawObj !== 'object') return config;

  ASPEK_LIST.forEach((aspek) => {
    if (typeof rawObj[aspek.id] === 'boolean') {
      config[aspek.id] = rawObj[aspek.id];
    } else if (typeof rawObj[String(aspek.id)] === 'boolean') {
      config[aspek.id] = rawObj[String(aspek.id)];
    } else if (typeof rawObj[`Aspek ${aspek.id}`] === 'string') {
      config[aspek.id] = rawObj[`Aspek ${aspek.id}`].trim().toUpperCase() === 'AKTIF';
    }
  });

  return config;
}

/**
 * Mendapatkan konfigurasi aspek bersarang per kategori dari localStorage
 */
export function getStoredCategoryAspekConfig(): CategoryAspekConfig {
  try {
    const raw = localStorage.getItem(ASPEK_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        // Cek apakah sudah berformat nested per kategori
        const hasCategoryKeys = KATEGORI_SATKER_LIST.some((kat) => kat in parsed);
        if (hasCategoryKeys) {
          const result: CategoryAspekConfig = {
            'KUA': normalizeSingleAspekConfig(parsed['KUA']),
            'MIN': normalizeSingleAspekConfig(parsed['MIN']),
            'MTsN & MAN': normalizeSingleAspekConfig(parsed['MTsN & MAN'])
          };
          return result;
        }

        // Jika masih berformat flat legacy (Record<number, boolean>)
        const flatNormalized = normalizeSingleAspekConfig(parsed);
        const migrated: CategoryAspekConfig = {
          'KUA': { ...flatNormalized },
          'MIN': { ...flatNormalized },
          'MTsN & MAN': { ...flatNormalized }
        };
        return migrated;
      }
    }
  } catch (err) {
    console.error('Gagal membaca pengaturan aspek per kategori dari localStorage', err);
  }
  return {
    'KUA': { ...DEFAULT_ASPEK_CONFIG },
    'MIN': { ...DEFAULT_ASPEK_CONFIG },
    'MTsN & MAN': { ...DEFAULT_ASPEK_CONFIG }
  };
}

/**
 * Menyimpan konfigurasi aspek per kategori ke localStorage dan memancarkan event pembaruan
 */
export function saveStoredCategoryAspekConfig(config: CategoryAspekConfig): void {
  try {
    localStorage.setItem(ASPEK_CONFIG_STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ASPEK_CONFIG_EVENT, { detail: config }));
    }
  } catch (err) {
    console.error('Gagal menyimpan pengaturan aspek ke localStorage', err);
  }
}

/**
 * Mendapatkan konfigurasi aspek spesifik untuk salah satu kategori satker
 */
export function getStoredAspekConfig(kategori?: KategoriUnit): Record<number, boolean> {
  const all = getStoredCategoryAspekConfig();
  if (kategori && all[kategori]) {
    return all[kategori];
  }
  return all['KUA'];
}

/**
 * Menyimpan konfigurasi aspek untuk salah satu kategori atau semua kategori
 */
export function saveStoredAspekConfig(config: Record<number, boolean>, kategori?: KategoriUnit): void {
  const current = getStoredCategoryAspekConfig();
  if (kategori) {
    current[kategori] = config;
  } else {
    current['KUA'] = config;
    current['MIN'] = config;
    current['MTsN & MAN'] = config;
  }
  saveStoredCategoryAspekConfig(current);
}

/**
 * Memeriksa apakah suatu aspek penilaian tertentu berstatus aktif
 * Dapat menerima config flat Record<number, boolean> atau nama KategoriUnit
 */
export function isAspekActive(
  aspekId: number,
  configOrCategory?: Record<number, boolean> | KategoriUnit
): boolean {
  if (typeof configOrCategory === 'string') {
    const config = getStoredAspekConfig(configOrCategory);
    return config[aspekId] !== false;
  }
  if (configOrCategory && typeof configOrCategory === 'object') {
    return configOrCategory[aspekId] !== false;
  }
  const currentConfig = getStoredAspekConfig('KUA');
  return currentConfig[aspekId] !== false;
}

/**
 * Mendapatkan daftar aspek yang aktif untuk config atau kategori tertentu
 */
export function getActiveAspekList(
  configOrCategory?: Record<number, boolean> | KategoriUnit
): AspekInfo[] {
  let resolvedConfig: Record<number, boolean>;
  if (typeof configOrCategory === 'string') {
    resolvedConfig = getStoredAspekConfig(configOrCategory);
  } else if (configOrCategory && typeof configOrCategory === 'object') {
    resolvedConfig = configOrCategory;
  } else {
    resolvedConfig = getStoredAspekConfig('KUA');
  }

  return ASPEK_LIST.filter((aspek) => isAspekActive(aspek.id, resolvedConfig));
}

/**
 * Menghitung total persentase bobot dari seluruh aspek yang aktif untuk kategori / config tertentu
 */
export function getTotalBobotAktif(
  configOrCategory?: Record<number, boolean> | KategoriUnit
): number {
  let resolvedConfig: Record<number, boolean>;
  if (typeof configOrCategory === 'string') {
    resolvedConfig = getStoredAspekConfig(configOrCategory);
  } else if (configOrCategory && typeof configOrCategory === 'object') {
    resolvedConfig = configOrCategory;
  } else {
    resolvedConfig = getStoredAspekConfig('KUA');
  }

  return ASPEK_LIST.reduce((sum, aspek) => {
    if (isAspekActive(aspek.id, resolvedConfig)) {
      return sum + aspek.bobot;
    }
    return sum;
  }, 0);
}

/**
 * Mengatur ulang seluruh aspek pada seluruh kategori ke kondisi awal (100% Aktif)
 */
export function resetCategoryAspekConfigToDefault(): CategoryAspekConfig {
  const fresh: CategoryAspekConfig = {
    'KUA': { ...DEFAULT_ASPEK_CONFIG },
    'MIN': { ...DEFAULT_ASPEK_CONFIG },
    'MTsN & MAN': { ...DEFAULT_ASPEK_CONFIG }
  };
  saveStoredCategoryAspekConfig(fresh);
  return fresh;
}

/**
 * Mengatur ulang aspek untuk kategori tertentu (atau semua) ke default
 */
export function resetAspekConfigToDefault(kategori?: KategoriUnit): Record<number, boolean> {
  const all = getStoredCategoryAspekConfig();
  const fresh = { ...DEFAULT_ASPEK_CONFIG };
  if (kategori) {
    all[kategori] = fresh;
    saveStoredCategoryAspekConfig(all);
    return fresh;
  }
  resetCategoryAspekConfigToDefault();
  return fresh;
}

/**
 * Mengonversi format CategoryAspekConfig menjadi format payload nested Google Apps Script:
 * {
 *   "KUA": { "Aspek 1": "AKTIF", "Aspek 8": "NONAKTIF", ... },
 *   "MIN": { "Aspek 1": "AKTIF", "Aspek 8": "NONAKTIF", ... },
 *   "MTsN & MAN": { "Aspek 1": "AKTIF", "Aspek 8": "AKTIF", ... }
 * }
 */
export function formatCategoryAspekConfigForServer(
  allConfig?: CategoryAspekConfig
): Record<string, Record<string, 'AKTIF' | 'NONAKTIF'>> {
  const current = allConfig || getStoredCategoryAspekConfig();
  const payload: Record<string, Record<string, 'AKTIF' | 'NONAKTIF'>> = {};

  KATEGORI_SATKER_LIST.forEach((kat) => {
    const katConfig = current[kat] || DEFAULT_ASPEK_CONFIG;
    payload[kat] = {};
    ASPEK_LIST.forEach((aspek) => {
      const active = katConfig[aspek.id] !== false;
      payload[kat][`Aspek ${aspek.id}`] = active ? 'AKTIF' : 'NONAKTIF';
    });
  });

  return payload;
}

/**
 * Kompatibilitas format flat untuk single category
 */
export function formatAspekConfigForServer(
  config?: Record<number, boolean>
): Record<string, 'AKTIF' | 'NONAKTIF'> {
  const currentConfig = config || getStoredAspekConfig('KUA');
  const serverPayload: Record<string, 'AKTIF' | 'NONAKTIF'> = {};

  ASPEK_LIST.forEach((aspek) => {
    const active = isAspekActive(aspek.id, currentConfig);
    serverPayload[`Aspek ${aspek.id}`] = active ? 'AKTIF' : 'NONAKTIF';
  });

  return serverPayload;
}

/**
 * Menafsirkan objek aspek tunggal dari server { "Aspek 1": "AKTIF", ... }
 */
export function parseServerPengaturanAspek(serverObj: any): Record<number, boolean> | null {
  if (!serverObj || typeof serverObj !== 'object') return null;

  let parsedObj = serverObj;
  if (typeof serverObj === 'string') {
    try {
      parsedObj = JSON.parse(serverObj);
    } catch {
      return null;
    }
  }

  if (typeof parsedObj !== 'object' || parsedObj === null) return null;

  const config: Record<number, boolean> = { ...DEFAULT_ASPEK_CONFIG };
  let foundValidField = false;

  ASPEK_LIST.forEach((aspek) => {
    const candidates = [
      `Aspek ${aspek.id}`,
      `aspek ${aspek.id}`,
      `Aspek${aspek.id}`,
      `aspek${aspek.id}`,
      String(aspek.id),
      aspek.id
    ];

    for (const key of candidates) {
      if (key in parsedObj) {
        const val = parsedObj[key];
        if (typeof val === 'string') {
          const upper = val.trim().toUpperCase();
          if (upper === 'AKTIF' || upper === 'ACTIVE' || upper === 'TRUE' || upper === '1') {
            config[aspek.id] = true;
            foundValidField = true;
            break;
          } else if (upper === 'NONAKTIF' || upper === 'NON-AKTIF' || upper === 'INACTIVE' || upper === 'FALSE' || upper === '0') {
            config[aspek.id] = false;
            foundValidField = true;
            break;
          }
        } else if (typeof val === 'boolean') {
          config[aspek.id] = val;
          foundValidField = true;
          break;
        } else if (typeof val === 'number') {
          config[aspek.id] = val === 1;
          foundValidField = true;
          break;
        }
      }
    }
  });

  return foundValidField ? config : null;
}

/**
 * Membaca dan menafsirkan objek pengaturan aspek per kategori dari backend Google Apps Script:
 * format nested: { "KUA": { ... }, "MIN": { ... }, "MTsN & MAN": { ... } }
 * atau format flat legacy (diaplikasikan ke seluruh kategori)
 */
export function parseServerCategoryPengaturanAspek(serverObj: any): CategoryAspekConfig | null {
  if (!serverObj) return null;

  let parsed = serverObj;
  if (typeof serverObj === 'string') {
    try {
      parsed = JSON.parse(serverObj);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const result: CategoryAspekConfig = {
    'KUA': { ...DEFAULT_ASPEK_CONFIG },
    'MIN': { ...DEFAULT_ASPEK_CONFIG },
    'MTsN & MAN': { ...DEFAULT_ASPEK_CONFIG }
  };
  let hasValid = false;

  // Coba cari nested keys per kategori
  KATEGORI_SATKER_LIST.forEach((kat) => {
    const katCandidates = [
      kat,
      kat.replace(/\s+/g, ''),
      kat.toUpperCase(),
      kat.toLowerCase(),
      kat.replace('&', '_').replace(/\s+/g, ''),
      kat.replace('&', 'and'),
      kat.replace('&', 'dan'),
      kat.replace(' & ', '_')
    ];

    for (const cand of katCandidates) {
      if (cand in parsed && parsed[cand] && typeof parsed[cand] === 'object') {
        const parsedKat = parseServerPengaturanAspek(parsed[cand]);
        if (parsedKat) {
          result[kat] = parsedKat;
          hasValid = true;
          break;
        }
      }
    }
  });

  // Jika tidak ditemukan struktur nested kategori, periksa apakah format flat
  if (!hasValid) {
    const flatParsed = parseServerPengaturanAspek(parsed);
    if (flatParsed) {
      result['KUA'] = { ...flatParsed };
      result['MIN'] = { ...flatParsed };
      result['MTsN & MAN'] = { ...flatParsed };
      hasValid = true;
    }
  }

  return hasValid ? result : null;
}

/**
 * Sinkronisasi pengaturan aspek per kategori dari server Google Sheets ke localStorage
 */
export function syncCategoryPengaturanAspekFromServer(serverObj: any): CategoryAspekConfig | null {
  const parsed = parseServerCategoryPengaturanAspek(serverObj);
  if (parsed) {
    saveStoredCategoryAspekConfig(parsed);
    return parsed;
  }
  return null;
}

/**
 * Kompatibilitas alias untuk fungsi sinkronisasi lama
 */
export function syncPengaturanAspekFromServer(serverObj: any): Record<number, boolean> | null {
  const parsedCategory = syncCategoryPengaturanAspekFromServer(serverObj);
  if (parsedCategory) {
    return parsedCategory['KUA'];
  }
  return null;
}

/**
 * Hook React untuk menyinkronkan seluruh konfigurasi aspek per kategori secara real-time
 */
export function useCategoryAspekConfig(): [CategoryAspekConfig, (newConfig: CategoryAspekConfig) => void] {
  const [config, setConfig] = useState<CategoryAspekConfig>(() => getStoredCategoryAspekConfig());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<CategoryAspekConfig>;
      if (custom.detail && typeof custom.detail === 'object') {
        setConfig(getStoredCategoryAspekConfig());
      } else {
        setConfig(getStoredCategoryAspekConfig());
      }
    };

    window.addEventListener(ASPEK_CONFIG_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ASPEK_CONFIG_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateConfig = (newConfig: CategoryAspekConfig) => {
    saveStoredCategoryAspekConfig(newConfig);
    setConfig(newConfig);
  };

  return [config, updateConfig];
}

/**
 * Hook React untuk satu kategori spesifik (default: 'KUA')
 */
export function useAspekConfig(kategori?: KategoriUnit): [Record<number, boolean>, (newConfig: Record<number, boolean>) => void] {
  const [catConfig, setCatConfig] = useCategoryAspekConfig();
  const currentKat = kategori || 'KUA';
  const currentConfig = catConfig[currentKat] || DEFAULT_ASPEK_CONFIG;

  const updateConfig = (newConfig: Record<number, boolean>) => {
    const next: CategoryAspekConfig = {
      ...catConfig,
      [currentKat]: newConfig
    };
    setCatConfig(next);
  };

  return [currentConfig, updateConfig];
}
