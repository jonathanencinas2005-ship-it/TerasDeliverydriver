// Karena bukti transfer disimpan langsung di Realtime Database (bukan Cloud
// Storage yang kini wajib Blaze), gambar WAJIB dikompresi dulu di sisi
// browser supaya ukurannya kecil (target puluhan-ratusan KB, bukan MB).
export function compressImageToBase64(file, { maxWidth = 900, quality = 0.6 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      img.onerror = () => reject(new Error('File bukan gambar yang valid.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
