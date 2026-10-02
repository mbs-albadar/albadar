/**
 * Supabase Storage Image Upload Helper
 * SMP MBS Al Badar Prambanan
 */

/**
 * Mengecilkan & mengompres foto secara otomatis di browser sebelum diunggah.
 * Foto diperkecil maksimal 1920px pada sisi terpanjang dan disimpan sebagai JPEG
 * kualitas 85% - cukup untuk tampilan web, jauh lebih ringan dari foto kamera asli.
 */
function compressImage(file, maxDimension = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal memproses gambar'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca gambar, format mungkin tidak didukung'));
    };

    img.src = objectUrl;
  });
}

async function uploadImageToStorage(file, folder = 'general') {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih');
  }

  // Batas kewajaran murni (bukan batas ketat) - mencegah file yang jelas bukan foto biasa
  const maxBytes = 25 * 1024 * 1024; // 25MB
  if (file.size > maxBytes) {
    throw new Error('Ukuran file terlalu besar (maksimal 25MB)');
  }

  let uploadBlob = file;
  let fileExt = file.name.split('.').pop().toLowerCase();

  try {
    uploadBlob = await compressImage(file, 1920, 0.85);
    fileExt = 'jpg';
  } catch (compressErr) {
    console.warn('Kompresi otomatis gagal, lanjut unggah file asli:', compressErr);
    uploadBlob = file;
  }

  const safeExt = fileExt.replace(/[^a-z0-9]/g, '') || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${safeExt}`;

  const { data, error } = await supabaseClient.storage
    .from('site-media')
    .upload(fileName, uploadBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: uploadBlob.type || 'image/jpeg'
    });

  if (error) throw error;

  const { data: urlData } = supabaseClient.storage
    .from('site-media')
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik dari storage');
  }

  return urlData.publicUrl;
}

function getStoragePathFromUrl(url, bucket = 'site-media') {
  if (!url) return null;
  try {
    const marker = `/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.substring(idx + marker.length));
    }
  } catch (e) {
    console.error('Error extracting storage path:', e);
  }
  return null;
}

async function uploadDocumentToStorage(file, folder = 'ppdb') {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih');
  }

  const fileExt = file.name.split('.').pop().toLowerCase();
  const allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExt.includes(fileExt)) {
    throw new Error('Format file harus PDF, JPG, PNG, atau WebP');
  }

  // Catatan: tidak ada batas ukuran file dari kode ini.
  // Supabase Storage sendiri membatasi maksimal 50MB per file di paket Free.
  const safeExt = fileExt.replace(/[^a-z0-9]/g, '');
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${safeExt}`;

  const { data, error } = await supabaseClient.storage
    .from('site-media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: urlData } = supabaseClient.storage
    .from('site-media')
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik dari storage');
  }

  return urlData.publicUrl;
}

if (typeof window !== 'undefined') {
  window.uploadImageToStorage = uploadImageToStorage;
  window.getStoragePathFromUrl = getStoragePathFromUrl;
  window.uploadDocumentToStorage = uploadDocumentToStorage;
}
