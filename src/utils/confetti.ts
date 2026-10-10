// Helper Utility Canvas Confetti untuk Perayaan Juara SI-EPP Kemenag Gunungkidul

export const getStatusPengumumanJuara = (): 'AKTIF' | 'NONAKTIF' => {
  try {
    const val = localStorage.getItem('SIEPP_STATUS_PENGUMUMAN_JUARA');
    // Default AKTIF untuk perayaan juara
    return val === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';
  } catch {
    return 'AKTIF';
  }
};

export const setStatusPengumumanJuara = (status: 'AKTIF' | 'NONAKTIF') => {
  try {
    localStorage.setItem('SIEPP_STATUS_PENGUMUMAN_JUARA', status);
  } catch {}
};

/**
 * Menjalankan animasi confetti warna institusi Kemenag (Emerald, Gold, Putih)
 * selama durasi tertentu (default 3 detik).
 */
export const triggerChampionConfetti = (durationMs = 3000) => {
  if (typeof window === 'undefined' || !window.confetti) return;

  const animationEnd = Date.now() + durationMs;
  // Warna bernuansa institusi: Hijau emerald, Emas, Putih
  const colors = ['#047857', '#10b981', '#f59e0b', '#d97706', '#ffffff', '#34d399'];

  const frame = () => {
    if (typeof window === 'undefined' || !window.confetti) return;

    window.confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors
    });
    window.confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};
