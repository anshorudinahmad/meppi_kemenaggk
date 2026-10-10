/**
 * Sistem Proteksi PIN / Password untuk Unit Kerja dan Tim Panel Juri (Dinamis / Tak Terbatas)
 */

export interface JuriAccount {
  id: string; // 'JURI-1' | 'JURI-2' | 'JURI-3' ...
  pin: string; // 'JURI1-GK26' | 'JURI2-GK26' ...
  defaultName: string;
  roleTitle: string;
  isActive?: boolean;
}

export const DEFAULT_JURI_ACCOUNTS: JuriAccount[] = [
  { id: 'JURI-1', pin: 'JURI1-GK26', defaultName: 'Dr. H. Mukotip, S.Ag., M.Pd.I', roleTitle: 'Verifikator 1', isActive: true },
  { id: 'JURI-2', pin: 'JURI2-GK26', defaultName: 'H. Faqih Shomadi, S.Ag., M.Pd.I', roleTitle: 'Verifikator 2', isActive: true },
  { id: 'JURI-3', pin: 'JURI3-GK26', defaultName: 'H. Zuhdan Aris, S.Ag., M.A.', roleTitle: 'Verifikator 3', isActive: true },
  { id: 'JURI-4', pin: 'JURI4-GK26', defaultName: 'H. Supriyanto, S.Ag., M.S.I', roleTitle: 'Verifikator 4', isActive: true },
  { id: 'JURI-5', pin: 'JURI5-GK26', defaultName: 'H. Harsono, S.Ag., M.S.I', roleTitle: 'Verifikator 5', isActive: true }
];

export const JURI_DEFAULT_PIN = "JURI1-GK26";
export const LEGACY_JURI_PIN = "JURI-GK2026";
export const JURI_STORAGE_KEY = "SIEPP_DYNAMIC_JURI_ACCOUNTS";
export const JURI_CUSTOM_NAMES_STORAGE_KEY = "SIEPP_CUSTOM_JURI_NAMES";

/**
 * Mendapatkan daftar nama juri yang telah dimodifikasi (disimpan permanen di localStorage)
 */
export function getCustomJuriNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(JURI_CUSTOM_NAMES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Gagal membaca nama juri custom dari localStorage", err);
  }
  return {};
}

/**
 * Menyimpan nama kustom untuk salah satu akun juri secara permanen
 */
export function saveCustomJuriName(juriId: string, newName: string): void {
  try {
    const current = getCustomJuriNames();
    current[juriId] = newName.trim();
    localStorage.setItem(JURI_CUSTOM_NAMES_STORAGE_KEY, JSON.stringify(current));

    // Sinkronkan juga ke dynamic juri storage
    const accounts = getStoredJuriAccounts();
    const idx = accounts.findIndex(a => a.id === juriId);
    if (idx !== -1) {
      accounts[idx].defaultName = newName.trim();
      saveStoredJuriAccounts(accounts);
    }
  } catch (err) {
    console.error("Gagal menyimpan nama juri kustom ke localStorage", err);
  }
}

/**
 * Mendapatkan seluruh daftar akun Juri tersimpan (Dinamis)
 */
export function getStoredJuriAccounts(): JuriAccount[] {
  try {
    const raw = localStorage.getItem(JURI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customNames = getCustomJuriNames();
        return parsed.map((acc: any) => ({
          id: String(acc.id || 'JURI-1'),
          pin: String(acc.pin || 'JURI1-GK26'),
          defaultName: customNames[acc.id] || String(acc.defaultName || acc.nama || acc.name || `Verifikator ${acc.id}`),
          roleTitle: String(acc.roleTitle || acc.role || `Verifikator ${acc.id}`),
          isActive: acc.isActive !== false
        }));
      }
    }
  } catch (err) {
    console.error("Gagal membaca akun juri dinamis dari localStorage", err);
  }

  // Inisialisasi default
  const customNames = getCustomJuriNames();
  return DEFAULT_JURI_ACCOUNTS.map(acc => ({
    ...acc,
    defaultName: customNames[acc.id] || acc.defaultName
  }));
}

/**
 * Menyimpan seluruh daftar akun juri ke localStorage
 */
export function saveStoredJuriAccounts(accounts: JuriAccount[]): void {
  try {
    localStorage.setItem(JURI_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error("Gagal menyimpan akun juri ke localStorage", err);
  }
}

/**
 * Mengembalikan daftar akun JURI yang aktif
 */
export function getActiveJuriAccounts(): JuriAccount[] {
  const all = getStoredJuriAccounts();
  return all.filter(a => a.isActive !== false);
}

/**
 * Sinkronisasi daftar juri aktif dari respon Google Sheets (daftarJuriAktif)
 */
export function syncDaftarJuriAktif(daftarServer: any[]): JuriAccount[] {
  if (!Array.isArray(daftarServer) || daftarServer.length === 0) {
    return getActiveJuriAccounts();
  }

  const existingAccounts = getStoredJuriAccounts();
  const accountMap = new Map<string, JuriAccount>();

  existingAccounts.forEach(acc => accountMap.set(acc.id, acc));

  daftarServer.forEach((item, index) => {
    let id = item.id || item.idJuri || item.juriId;
    if (!id && typeof item === 'string' && item.startsWith('JURI-')) {
      id = item;
    } else if (!id) {
      id = `JURI-${index + 1}`;
    }

    const defaultName = item.defaultName || item.labelJuri || item.nama || item.name || (typeof item === 'string' ? item : `Verifikator ${id}`);
    const cleanIdNum = id.replace(/\D/g, '') || String(index + 1);
    const pin = item.pin || `JURI${cleanIdNum}-GK26`;
    const roleTitle = item.roleTitle || item.role || item.jabatan || `Verifikator ${cleanIdNum}`;
    const isActive = item.isActive !== false;

    accountMap.set(id, {
      id,
      pin,
      defaultName,
      roleTitle,
      isActive
    });
  });

  const updatedList = Array.from(accountMap.values());
  saveStoredJuriAccounts(updatedList);
  return updatedList;
}

/**
 * Menambahkan Juri baru ke sistem (Offline / Simulasi)
 */
export function addDynamicJuriAccount(account: JuriAccount): JuriAccount[] {
  const accounts = getStoredJuriAccounts();
  const exists = accounts.some(a => a.id === account.id);
  let next: JuriAccount[];
  if (exists) {
    next = accounts.map(a => a.id === account.id ? { ...account, isActive: true } : a);
  } else {
    next = [...accounts, { ...account, isActive: true }];
  }
  saveStoredJuriAccounts(next);
  return next;
}

/**
 * Memperbarui data akun Juri
 */
export function updateDynamicJuriAccount(account: JuriAccount): JuriAccount[] {
  const accounts = getStoredJuriAccounts();
  const next = accounts.map(a => a.id === account.id ? account : a);
  saveStoredJuriAccounts(next);
  return next;
}

/**
 * Menghapus akun Juri
 */
export function deleteDynamicJuriAccount(juriId: string): JuriAccount[] {
  const accounts = getStoredJuriAccounts();
  const next = accounts.filter(a => a.id !== juriId);
  saveStoredJuriAccounts(next);
  return next;
}

/**
 * Mengubah status aktif/nonaktif akun Juri
 */
export function toggleDynamicJuriActive(juriId: string): JuriAccount[] {
  const accounts = getStoredJuriAccounts();
  const next = accounts.map(a => a.id === juriId ? { ...a, isActive: !a.isActive } : a);
  saveStoredJuriAccounts(next);
  return next;
}

/**
 * Reset akun juri ke default 5 Juri
 */
export function resetJuriAccountsToDefault(): JuriAccount[] {
  saveStoredJuriAccounts(DEFAULT_JURI_ACCOUNTS);
  return DEFAULT_JURI_ACCOUNTS;
}

/**
 * Cari akun Juri berdasarkan PIN yang dimasukkan
 */
export function findJuriAccountByPin(inputPin: string): JuriAccount | null {
  if (!inputPin) return null;
  const clean = inputPin.trim().toUpperCase();
  const accounts = getStoredJuriAccounts(); // cek seluruh juri terdaftar

  if (clean === LEGACY_JURI_PIN.toUpperCase()) {
    return accounts[0] || DEFAULT_JURI_ACCOUNTS[0];
  }

  return accounts.find((acc) => acc.pin.toUpperCase() === clean) || null;
}

/**
 * Cari akun Juri berdasarkan ID ('JURI-1', dst)
 */
export function getJuriAccountById(id: string): JuriAccount | undefined {
  const accounts = getStoredJuriAccounts();
  return accounts.find((acc) => acc.id === id);
}

/**
 * Reset seluruh nama juri kustom kembali ke default sistem
 */
export function resetCustomJuriNames(): void {
  try {
    localStorage.removeItem(JURI_CUSTOM_NAMES_STORAGE_KEY);
    resetJuriAccountsToDefault();
  } catch (err) {
    console.error("Gagal mereset nama juri kustom", err);
  }
}

/**
 * Validasi PIN Juri
 */
export function validateJuriPin(inputPin: string): boolean {
  return findJuriAccountByPin(inputPin) !== null;
}

/**
 * Menghasilkan PIN default untuk Satker berdasarkan ID
 * Contoh: "KUA-01" -> "KUA01-GK", "MAD-13" -> "MAD13-GK"
 */
export function getExpectedSatkerPin(unitId: string): string {
  if (!unitId) return "";
  const cleanId = unitId.replace('-', '').toUpperCase();
  return `${cleanId}-GK`;
}

/**
 * Validasi PIN Satker
 */
export function validateSatkerPin(unitId: string, inputPin: string): boolean {
  if (!inputPin || !unitId) return false;
  const expected = getExpectedSatkerPin(unitId);
  return inputPin.trim().toUpperCase() === expected.toUpperCase();
}

/**
 * Autentikasi Khusus Administrator untuk Menu Opsi & Pengaturan Aspek Penilaian
 */
export const ADMIN_PIN = "ADMIN-GK26";
export const ADMIN_PASSWORD = "pr4k0m";
export const ADMIN_AUTH_SESSION_KEY = "SIEPP_ADMIN_AUTH";

export function validateAdminPassword(password: string): boolean {
  if (!password) return false;
  const clean = password.trim();
  return clean === ADMIN_PIN || clean === ADMIN_PASSWORD || clean.toUpperCase() === ADMIN_PIN;
}

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(authenticated: boolean): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    }
  } catch {}
}
