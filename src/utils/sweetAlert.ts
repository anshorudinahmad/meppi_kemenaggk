// Helper Utility untuk SweetAlert2 (CDN: https://cdn.jsdelivr.net/npm/sweetalert2@11)

declare global {
  interface Window {
    Swal?: any;
    confetti?: any;
  }
}

export const showConfirmDialog = async (options: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: 'warning' | 'question' | 'info';
}): Promise<boolean> => {
  if (typeof window !== 'undefined' && window.Swal) {
    const result = await window.Swal.fire({
      icon: options.icon || 'warning',
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonColor: '#047857', // Emerald 700
      cancelButtonColor: '#64748b',  // Slate 500
      confirmButtonText: options.confirmButtonText || 'Ya, Lanjutkan',
      cancelButtonText: options.cancelButtonText || 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans border border-slate-200',
        title: 'text-slate-900 font-extrabold text-lg',
        htmlContainer: 'text-slate-600 text-xs leading-relaxed',
        confirmButton: 'rounded-xl font-bold px-5 py-2.5 shadow-md',
        cancelButton: 'rounded-xl font-bold px-4 py-2.5'
      }
    });
    return !!result.isConfirmed;
  }
  return window.confirm(`${options.title}\n\n${options.text}`);
};

export const showSuccessAlert = async (title: string, text?: string) => {
  if (typeof window !== 'undefined' && window.Swal) {
    return window.Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#047857',
      confirmButtonText: 'OK, Mengerti',
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans border border-emerald-200',
        title: 'text-emerald-950 font-extrabold text-lg',
        htmlContainer: 'text-slate-600 text-xs leading-relaxed',
        confirmButton: 'rounded-xl font-bold px-5 py-2.5 shadow-md'
      }
    });
  }
};

export const showErrorAlert = async (title: string, text?: string) => {
  if (typeof window !== 'undefined' && window.Swal) {
    return window.Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#047857',
      confirmButtonText: 'Tutup',
      customClass: {
        popup: 'rounded-3xl shadow-2xl font-sans border border-rose-200',
        title: 'text-rose-950 font-extrabold text-lg',
        htmlContainer: 'text-slate-600 text-xs leading-relaxed',
        confirmButton: 'rounded-xl font-bold px-5 py-2.5 shadow-md'
      }
    });
  }
};
