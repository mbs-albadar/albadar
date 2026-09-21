/**
 * Supabase Storage Image Upload Helper
 * SMP MBS Al Badar Prambanan
 */

async function uploadImageToStorage(file, folder = 'general') {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih');
  }

  // Max size check: 2MB
  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Ukuran foto maksimal 2MB, silakan kompres dulu');
  }

  const fileExt = file.name.split('.').pop().toLowerCase();
  const safeExt = fileExt.replace(/[^a-z0-9]/g, '') || 'jpg';
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
