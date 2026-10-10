import { SatkerEvaluation } from '../types';
import { ADMIN_PIN, syncDaftarJuriAktif } from './security';
import {
  CategoryAspekConfig,
  formatCategoryAspekConfigForServer,
  syncCategoryPengaturanAspekFromServer
} from './aspekConfig';

export const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz4Rn-f1A5lFu0Pl_BW_FubB_glYRCoZy2-b0v8PwqbfImD_utru6up13U53Oh0oXQa/exec";

export const SCRIPT_URL_STORAGE_KEY = "SIEPP_GOOGLE_SCRIPT_URL";

export function getScriptUrl(): string {
  try {
    const custom = localStorage.getItem(SCRIPT_URL_STORAGE_KEY);
    if (custom && custom.trim() !== "") {
      return custom.trim();
    }
  } catch (err) {
    console.error("Gagal membaca script URL dari localStorage", err);
  }
  return DEFAULT_SCRIPT_URL;
}

export function setScriptUrl(url: string): void {
  try {
    if (!url || url.trim() === "") {
      localStorage.removeItem(SCRIPT_URL_STORAGE_KEY);
    } else {
      localStorage.setItem(SCRIPT_URL_STORAGE_KEY, url.trim());
    }
  } catch (err) {
    console.error("Gagal menyimpan script URL ke localStorage", err);
  }
}

/**
 * Normalizes raw data received from Google Sheets / Apps Script into Record<string, SatkerEvaluation>
 */
export function normalizeServerData(rawData: any): Record<string, SatkerEvaluation> {
  const result: Record<string, SatkerEvaluation> = {};

  if (!rawData) return result;

  // Case 1: Data is already an object keyed by ID
  if (typeof rawData === 'object' && !Array.isArray(rawData)) {
    Object.entries(rawData).forEach(([id, item]: [string, any]) => {
      if (item && typeof item === 'object') {
        let multiJuriMap: any = undefined;
        if (item.verifikasiJuri && typeof item.verifikasiJuri === 'object') {
          // If keys are like JURI-1, JURI-2, etc.
          const hasJuriKeys = Object.keys(item.verifikasiJuri).some(k => k.startsWith('JURI-'));
          if (hasJuriKeys) {
            multiJuriMap = item.verifikasiJuri;
          }
        }

        // Parse buktiDukung if exists
        let buktiDukungParsed = item.buktiDukung || item.isianSatker?.buktiDukung;
        if (typeof buktiDukungParsed === 'string') {
          try {
            buktiDukungParsed = JSON.parse(buktiDukungParsed);
          } catch {}
        }

        result[id] = {
          status: item.status === 'Sudah Submit' || item.status === 'SUBMITTED'
            ? 'SUBMITTED'
            : item.status === 'Sudah Diverifikasi' || item.status === 'VERIFIED'
            ? 'VERIFIED'
            : item.status === 'Draft' || item.status === 'DRAFT'
            ? 'DRAFT'
            : 'BELUM_ISI',
          responses: item.responses || item.isianSatker?.responses || item.isianSatker || {},
          links: item.links || item.isianSatker?.links || {},
          buktiDukung: (buktiDukungParsed && typeof buktiDukungParsed === 'object') ? buktiDukungParsed : undefined,
          videoUrl: item.videoUrl || item.linkVideo || '',
          videoDeskripsi: item.videoDeskripsi || item.deskripsiVideo || '',
          verifScores: item.verifScores || item.verifikasiJuri?.scores || (multiJuriMap ? {} : item.verifikasiJuri) || {},
          verifNotes: item.verifNotes || item.verifikasiJuri?.notes || {},
          verifikasiJuri: multiJuriMap,
          submittedAt: item.submittedAt || '',
          verifiedAt: item.verifiedAt || '',
          verifiedBy: item.verifiedBy || item.namaVerifikator || ''
        };
      }
    });
    return result;
  }

  // Case 2: Data is an array of records (e.g. from Sheet rows)
  if (Array.isArray(rawData)) {
    rawData.forEach((row: any) => {
      const id = row.id || row.idSatker || row.satkerId;
      if (id) {
        let parsedResponses: Record<string, number> = {};
        let parsedLinks: Record<string, string> = {};
        let parsedBuktiDukung: Record<string, any> = {};
        let parsedVerifScores: Record<string, number> = {};
        let parsedVerifNotes: Record<string, string> = {};
        let multiJuriMap: any = undefined;

        try {
          if (typeof row.isianSatker === 'string') {
            const parsed = JSON.parse(row.isianSatker);
            parsedResponses = parsed.responses || parsed;
            parsedLinks = parsed.links || {};
            parsedBuktiDukung = parsed.buktiDukung || {};
          } else if (typeof row.isianSatker === 'object' && row.isianSatker !== null) {
            parsedResponses = row.isianSatker.responses || row.isianSatker;
            parsedLinks = row.isianSatker.links || {};
            parsedBuktiDukung = row.isianSatker.buktiDukung || {};
          }
        } catch {
          // fallback
        }

        try {
          if (row.buktiDukung) {
            if (typeof row.buktiDukung === 'string') {
              parsedBuktiDukung = JSON.parse(row.buktiDukung);
            } else if (typeof row.buktiDukung === 'object') {
              parsedBuktiDukung = row.buktiDukung;
            }
          }
        } catch {}

        try {
          if (typeof row.verifikasiJuri === 'string') {
            const parsed = JSON.parse(row.verifikasiJuri);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).some(k => k.startsWith('JURI-'))) {
              multiJuriMap = parsed;
            } else {
              parsedVerifScores = parsed.scores || parsed;
              parsedVerifNotes = parsed.notes || {};
            }
          } else if (typeof row.verifikasiJuri === 'object' && row.verifikasiJuri !== null) {
            if (Object.keys(row.verifikasiJuri).some(k => k.startsWith('JURI-'))) {
              multiJuriMap = row.verifikasiJuri;
            } else {
              parsedVerifScores = row.verifikasiJuri.scores || row.verifikasiJuri;
              parsedVerifNotes = row.verifikasiJuri.notes || {};
            }
          }
        } catch {
          // fallback
        }

        const rawStatus = row.status || '';
        result[id] = {
          status: rawStatus === 'Sudah Submit' || rawStatus === 'SUBMITTED'
            ? 'SUBMITTED'
            : rawStatus === 'Sudah Diverifikasi' || rawStatus === 'VERIFIED'
            ? 'VERIFIED'
            : rawStatus === 'Draft' || rawStatus === 'DRAFT'
            ? 'DRAFT'
            : 'BELUM_ISI',
          responses: Object.keys(parsedResponses).length > 0 ? parsedResponses : (row.responses || {}),
          links: Object.keys(parsedLinks).length > 0 ? parsedLinks : (row.links || {}),
          buktiDukung: Object.keys(parsedBuktiDukung).length > 0 ? parsedBuktiDukung : (row.buktiDukung || undefined),
          videoUrl: row.linkVideo || row.videoUrl || '',
          videoDeskripsi: row.deskripsiVideo || row.videoDeskripsi || '',
          verifScores: Object.keys(parsedVerifScores).length > 0 ? parsedVerifScores : (row.verifScores || {}),
          verifNotes: Object.keys(parsedVerifNotes).length > 0 ? parsedVerifNotes : (row.verifNotes || {}),
          verifikasiJuri: multiJuriMap,
          submittedAt: row.submittedAt || '',
          verifiedAt: row.verifiedAt || '',
          verifiedBy: row.namaVerifikator || row.verifiedBy || ''
        };
      }
    });
  }

  return result;
}

/**
 * Loads data from Google Apps Script Web App (GET)
 */
export async function muatDataDariServer(): Promise<{
  success: boolean;
  data?: Record<string, SatkerEvaluation>;
  daftarJuriAktif?: any;
  pengaturanAspek?: any;
  message: string;
}> {
  const url = getScriptUrl();
  if (!url || url.trim() === '') {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.'
    };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Server merespon dengan status: ${response.status} ${response.statusText}`
      };
    }

    const text = await response.text();
    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Respon server Google Sheets bukan JSON yang valid.'
      };
    }

    if (result && (result.status === 'success' || result.data || Array.isArray(result))) {
      // 1. Simpan daftar juri aktif yang dikirim oleh server Google Sheets (jika ada)
      const daftarJuriServer = result.daftarJuriAktif || result.data?.daftarJuriAktif || (typeof result.data === 'object' && result.data?.daftarJuri);
      if (Array.isArray(daftarJuriServer) && daftarJuriServer.length > 0) {
        try {
          syncDaftarJuriAktif(daftarJuriServer);
          localStorage.setItem('SIEPP_ACTIVE_JURI_LIST', JSON.stringify(daftarJuriServer));
        } catch (err) {
          console.error('Gagal menyimpan daftarJuriAktif dari server:', err);
        }
      }

      // 2. Baca properti result.pengaturanAspek { "Aspek 1": "AKTIF", "Aspek 8": "NONAKTIF", ... }
      const pengaturanAspekServer =
        result.pengaturanAspek ||
        result.data?.pengaturanAspek ||
        (typeof result.data === 'object' && !Array.isArray(result.data) ? result.data?.pengaturanAspek : null);

      if (pengaturanAspekServer) {
        try {
          syncCategoryPengaturanAspekFromServer(pengaturanAspekServer);
        } catch (err) {
          console.error('Gagal menyinkronkan pengaturanAspek dari server:', err);
        }
      }

      const rawPayload = result.data !== undefined ? result.data : result;
      const normalized = normalizeServerData(rawPayload);
      return {
        success: true,
        data: normalized,
        daftarJuriAktif: daftarJuriServer,
        pengaturanAspek: pengaturanAspekServer,
        message: 'Data berhasil disinkronkan dari server Google Sheets!'
      };
    }

    return {
      success: false,
      message: result?.message || 'Server Google Sheets tidak mengembalikan data.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal terhubung ke server Google Sheets (Periksa koneksi internet).'
    };
  }
}

/**
 * Saves data to Google Apps Script Web App (POST)
 * Note: Must use Content-Type: "text/plain;charset=utf-8" to bypass CORS Preflight.
 */
export async function simpanDataKeServer(payload: any): Promise<{
  success: boolean;
  message: string;
}> {
  const url = getScriptUrl();
  if (!url || url.trim() === '') {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi. Data hanya tersimpan secara lokal.'
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: Gagal menyimpan data ke server.`
      };
    }

    const text = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(text);
    } catch {
      // Sometimes GAS returns plain text or redirect HTML
    }

    if (resJson && resJson.status === 'error') {
      return {
        success: false,
        message: resJson.message || 'Server Google Sheets melaporkan kegagalan.'
      };
    }

    return {
      success: true,
      message: 'Data berhasil disinkronkan ke Google Sheets!'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal menyinkronkan ke server Google Sheets.'
    };
  }
}

/**
 * Memverifikasi PIN Juri ke Server Google Sheets (POST action: VERIFIKASI_PIN_JURI)
 * Mengembalikan { success, idJuri, labelJuri } sesuai konfigurasi dinamis Google Sheets.
 */
export async function verifikasiPinJuriKeServer(pin: string): Promise<{
  success: boolean;
  idJuri?: string;
  labelJuri?: string;
  message?: string;
  isNetworkError?: boolean;
}> {
  const url = getScriptUrl();
  if (!url || url.trim() === '') {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.',
      isNetworkError: true
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'VERIFIKASI_PIN_JURI',
        pin: pin.trim()
      })
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: Gagal menghubungi server verifikasi PIN Juri.`,
        isNetworkError: true
      };
    }

    const text = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Respon server Google Sheets bukan format JSON yang valid.',
        isNetworkError: true
      };
    }

    if (resJson && (resJson.status === 'success' || resJson.success === true)) {
      const idJuri = resJson.idJuri || resJson.id || resJson.juriId || 'JURI-1';
      const labelJuri = resJson.labelJuri || resJson.nama || resJson.namaVerifikator || resJson.verifierName || `Verifikator ${idJuri}`;
      return {
        success: true,
        idJuri,
        labelJuri,
        message: resJson.message || 'PIN Juri berhasil diverifikasi oleh server Google Sheets!'
      };
    }

    return {
      success: false,
      message: resJson?.message || 'PIN Juri tidak valid menurut server Google Sheets.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal terhubung ke endpoint Google Sheets.',
      isNetworkError: true
    };
  }
}

/**
 * Menyimpan Pengaturan Aspek Penilaian Dinamis Spesifik per Kategori ke Google Apps Script (POST)
 * Payload format:
 * {
 *   "action": "SIMPAN_PENGATURAN_ASPEK",
 *   "pinAdmin": "ADMIN-GK26",
 *   "dataAspek": {
 *     "KUA": { "Aspek 1": "AKTIF", "Aspek 8": "NONAKTIF", ... },
 *     "MIN": { "Aspek 1": "AKTIF", "Aspek 8": "NONAKTIF", ... },
 *     "MTsN & MAN": { "Aspek 1": "AKTIF", "Aspek 8": "AKTIF", ... }
 *   }
 * }
 */
export async function simpanPengaturanAspekKeServer(
  config?: CategoryAspekConfig,
  pinAdmin: string = ADMIN_PIN
): Promise<{
  success: boolean;
  message: string;
}> {
  const dataAspek = formatCategoryAspekConfigForServer(config);
  const payload = {
    action: 'SIMPAN_PENGATURAN_ASPEK',
    pinAdmin: (pinAdmin || ADMIN_PIN).trim().toUpperCase(),
    dataAspek
  };

  return simpanDataKeServer(payload);
}

/**
 * Mengunggah file bukti dukung ke Google Apps Script (POST action: UPLOAD_FILE)
 * Payload format:
 * {
 *   action: "UPLOAD_FILE",
 *   id: idSatkerTerpilih,
 *   pin: inputPinSatker,
 *   base64: base64String,
 *   mimeType: file.type,
 *   fileName: namaFileLengkap
 * }
 */
export async function uploadFileBuktiKeServer(params: {
  id: string;
  pin: string;
  base64: string;
  mimeType: string;
  fileName: string;
}): Promise<{
  success: boolean;
  url?: string;
  message: string;
}> {
  const url = getScriptUrl();
  if (!url || url.trim() === '') {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.'
    };
  }

  try {
    const payload = {
      action: 'UPLOAD_FILE',
      id: params.id,
      pin: params.pin,
      base64: params.base64,
      mimeType: params.mimeType,
      fileName: params.fileName
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: Gagal mengunggah file ke server.`
      };
    }

    const text = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(text);
    } catch {
      // If server returned plain text URL
      if (text.startsWith('http')) {
        return {
          success: true,
          url: text.trim(),
          message: 'File berhasil diunggah!'
        };
      }
    }

    if (resJson) {
      if (resJson.status === 'error' || resJson.success === false) {
        return {
          success: false,
          message: resJson.message || 'Server menolak pengunggahan file.'
        };
      }
      const fileUrl = resJson.url || resJson.fileUrl || resJson.downloadUrl || resJson.link;
      if (fileUrl) {
        return {
          success: true,
          url: fileUrl,
          message: resJson.message || 'File berhasil diunggah!'
        };
      }
    }

    return {
      success: false,
      message: 'Server tidak mengembalikan URL file yang valid.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal terhubung ke server saat mengunggah file.'
    };
  }
}


