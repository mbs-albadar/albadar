# HANDOVER - Website SMP MBS Al Badar Prambanan

Dokumen serah terima untuk orang yang melanjutkan pengelolaan website sekolah.
Terakhir diperbarui: 8 Oktober 2026.

> **PENTING:** repo ini bersifat **publik**. Jangan menulis password, kode OTP,
> atau email pribadi di file ini. Simpan data akun di dokumen internal sekolah
> atau pengelola password milik sekolah.

---

## 1. Ringkasan

- Website informasi dan berita sekolah, ditambah dashboard admin untuk mengelola konten.
- Tidak ada pembayaran atau pendaftaran online di website ini. Tombol PPDB mengarah ke
  sistem PSB eksternal: `https://psb.mbs.sch.id` (milik pihak lain, bukan bagian dari repo ini).
- Teknologi: halaman HTML statis + `assets/css/style.css` + `assets/js/main.js`.
  Dashboard admin ada di folder `admin/` dan memakai Supabase.

## 2. Alamat utama (JANGAN DIUBAH TANPA MEMBACA BAGIAN INI)

**Alamat utama: `https://smpalbadar.sch.id` (tanpa www).**

- Semua canonical, og:url, og:image, `sitemap.xml`, `robots.txt`, dan JSON-LD memakai alamat ini.
- `www.smpalbadar.sch.id` dan `albadar-psi.vercel.app` dialihkan (308) ke alamat utama.
- Pengalihan ini diatur di **Vercel -> project albadar -> Settings -> Domains**,
  bukan di kode atau `vercel.json`.
- Jika suatu hari alamat utama ingin diganti, semuanya harus diubah serentak:
  1. semua alamat di file `.html`, `sitemap.xml`, `robots.txt`;
  2. pengaturan Domains di Vercel (Vercel melarang pengalihan berantai, ubah satu per satu);
  3. properti baru di Google Search Console;
  4. link website di Google Business Profile.
- Backup kondisi sebelum penghapusan www: tag Git `backup-sebelum-hapus-www`.

## 3. Struktur repo

| Lokasi | Fungsi |
|---|---|
| `index.html`, `about.html`, `programs.html`, `student-life.html`, `achievements.html`, `news.html`, `berita-detail.html`, `faq.html`, `contact.html`, `ppdb.html`, `privacy-policy.html`, `404.html` | Halaman publik |
| `assets/` | CSS, JavaScript, gambar |
| `admin/` | Dashboard admin (login, kelola konten) |
| `vercel.json` | Pengalihan `.html` ke URL bersih (contoh `/about.html` -> `/sekolah-kami`) dan pemetaan URL bersih ke file |
| `sitemap.xml`, `robots.txt` | Untuk mesin pencari |
| `AI-CONTEXT.md`, `SCHOOL_FACTS.md`, `IMAGE_REPLACEMENT_GUIDE.md` | Catatan konteks, fakta sekolah, panduan ganti gambar |

## 4. Cara deploy

1. Ubah file di repo (misalnya lewat VS Code), lalu commit dan push ke branch `main`.
2. Vercel memproses otomatis. Pantau di **Vercel -> albadar -> Deployments** sampai status **Ready**.
3. Jika ada masalah setelah deploy, buka Deployments dan pilih deployment sebelumnya,
   lalu **Promote to Production** (atau Instant Rollback) untuk mengembalikan versi lama.

## 5. Layanan dan akun

Isi kolom pemilik di dokumen internal sekolah, bukan di sini.

| Layanan | Fungsi | Lokasi | Catatan |
|---|---|---|---|
| GitHub | Menyimpan kode | `github.com/mbs-albadar/albadar` | Pastikan minimal 2 pemilik (owner) |
| Vercel | Hosting dan domain | Team `mbs-albadar`, project `albadar` | Paket Hobby. Pastikan ketentuan penggunaannya sesuai untuk institusi |
| Supabase | Database dan login admin | URL project ada di `admin/supabase-config.js` | Login admin memakai email dan password lewat Supabase Auth |
| Domain `smpalbadar.sch.id` | Alamat website | Pengelola domain sch.id (isi nama penyedia) | Catat tanggal kedaluwarsa dan kontak pengelola |
| Google Search Console | Pantau pengindeksan Google | Properti utama: `https://smpalbadar.sch.id/` | Properti `https://www.smpalbadar.sch.id/` juga ada dan boleh diabaikan |
| Google Business Profile | Profil sekolah di Google Maps/Search | Status: terverifikasi | Link website harus `https://smpalbadar.sch.id` |

**Checklist keamanan akun (wajib sebelum serah terima selesai):**
- [ ] GitHub, Vercel, Supabase, Search Console, dan Business Profile masing-masing punya 2 pemilik atau pengelola.
- [ ] Semua akun memakai email milik sekolah, bukan email pribadi.
- [ ] Password tersimpan di pengelola password sekolah.
- [ ] Verifikasi dua langkah aktif di akun pemilik utama.
- [ ] Kontak pengelola domain dan tanggal kedaluwarsa tercatat.

## 6. Dashboard admin

- Alamat: `/admin/` (halaman admin ditandai `noindex`, tidak muncul di Google).
- Login memakai email dan password yang dibuat di Supabase -> Authentication -> Users.
- Setelah login, pengguna diarahkan ke `/admin/dashboard.html`.
- Jika kelak memakai fitur reset password lewat email, isi **Site URL** di
  Supabase -> Authentication -> URL Configuration dengan `https://smpalbadar.sch.id`.

## 7. SEO dan Google (ringkas)

- Sitemap: `https://smpalbadar.sch.id/sitemap.xml` (10 halaman publik).
- Jika menambah halaman baru: tambahkan ke `sitemap.xml`, isi canonical dan og:url
  dengan alamat tanpa www, lalu minta pengindeksan di Search Console (Inspeksi URL).
- Alamat sekolah di mana pun harus seragam:
  `Jamusan, Bokoharjo, Kec. Prambanan, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55572`.
- Nama resmi yang dipakai di profil dan website: **SMP MBS Al Badar Prambanan**.

## 8. Hal yang sering salah

- Mengganti alamat www/tanpa www di satu tempat saja. Hasilnya canonical dan alamat yang tampil tidak cocok.
- Mengedit nama file `.html` tanpa memperbarui `vercel.json`. URL bersih bisa rusak.
- Menaruh password atau kunci rahasia di repo publik ini.
- Hanya satu orang yang memegang akun. Jika orang itu pergi, akses hilang.

## 9. Kontak dan riwayat

- Pengelola sebelumnya: (isi nama dan kontak resmi)
- Penanggung jawab dari pihak sekolah: (isi nama dan jabatan)
- Riwayat perubahan penting:
  - 8 Okt 2026: alamat utama diubah menjadi tanpa www (domain, kode, dan redirect Vercel).
