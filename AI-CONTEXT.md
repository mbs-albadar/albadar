# AI Context & Technical Guidelines: SMP MBS Al Badar Prambanan

Dokumentasi arsitektur, filosofi desain, struktur file, dan pedoman konten resmi untuk pengembangan website **SMP MBS Al Badar Prambanan**.

> **Catatan untuk asisten AI**: dokumen ini bisa saja tertinggal dari kondisi kode sungguhan. Sebelum mengasumsikan sesuatu dari sini, **grep/cek langsung ke kode** — jangan percaya dokumen ini 100% tanpa verifikasi, persis seperti update terakhir ini sendiri ditemukan lewat pengecekan langsung, bukan diasumsikan.

---

## 1. Project Overview & Tech Stack

- **Frontend**: Static Web (HTML5 Semantic, Pure Vanilla CSS3, Vanilla JavaScript ES6+) — **tidak ada framework/build tool**.
- **Hosting**: **Vercel** (project `albadar`, team `mbs-albadar`). URL produksi: `https://albadar-psi.vercel.app`. Auto-deploy dari push ke branch `main`.
- **Repo**: `github.com/mbs-albadar/albadar` (GitHub Organization `mbs-albadar`).
- **Backend — SUDAH LIVE, bukan rencana masa depan**: **Supabase** (Postgres + Auth + Storage), project `albadar-cms`. Diakses langsung dari browser via `@supabase/supabase-js` CDN, konfigurasi di `assets/js/supabase-config.js`. Ada **dashboard admin** (`/admin/login.html`, `/admin/dashboard.html`) untuk kelola berita, prestasi, data guru/siswa, dan media — SPA sederhana dengan hash routing.
- **Design Philosophy**: **Premium, Luxury, Institutional, Islamic**. Menghadirkan citra pesantren modern yang berwibawa, elegan, tertib, dan berstandar internasional. **Hindari pola template generik AI** (label eyebrow all-caps, panah di akhir tombol, animasi scroll-reveal seragam tanpa variasi) — tapi juga jangan overcorrect ke nol animasi; motion dipakai selektif dan harus punya alasan (bukan dekorasi kosong).

---

## 2. File Structure & Core Assets (Current)

### A. Active Public HTML Pages (12 File)
1. `index.html` — Beranda: hero dengan foto (parallax halus + glow kursor, desktop only), stats real-time dari Supabase, editorial intro, prestasi, berita dinamis, alur PPDB, CTA.
2. `about.html` — Profil sekolah, Sejarah, Visi & Misi, Nilai-nilai, Fasilitas, GTK. Foto "Lingkungan Sekolah" tersambung ke `site_images` (Supabase).
3. `programs.html` — Program Boarding vs Full Day, 2 struktur kurikulum, keunggulan (Koding & AI, STEM, Bahasa).
4. `student-life.html` — Kehidupan santri. Section "Ritme Harian" (nama section boleh berbeda dari judul tampil — cek H2 aktual di kode) berupa **2 jam analog CSS murni (AM/PM, tanpa WebGL)** dengan cincin warna jadwal + akordeon 5 jadwal (termasuk 2 baris Maghrib/Isya bertanda "±" karena mengikuti matahari, bukan jam tetap). Ekstrakurikuler, fasilitas.
5. `ppdb.html` — Info PPDB, sistem *2 Week Service*, biaya, syarat, portal PSB.
6. `news.html` — Daftar berita, render dinamis via `main.js` (fallback berlapis: Supabase → `news.json` → hardcode).
7. `berita-detail.html` — **Halaman detail generik** satu artikel penuh, baca ID dari query string `?id=`, fetch dari Supabase. Satu file untuk semua artikel (bukan file HTML per artikel).
8. `achievements.html` — Daftar prestasi, render dinamis dari Supabase (badge, ikon, foto).
9. `faq.html` — Tanya jawab interaktif (accordion).
10. `contact.html` — Kontak, peta, form (form membangun pesan WhatsApp otomatis dari isian).
11. `privacy-policy.html` — Kebijakan privasi.
12. `404.html` — Halaman error kustom.

> `gallery.html` **sudah dihapus** (fitur galeri dibatalkan, dokumentasi foto kegiatan cukup lewat medsos) — jangan buat ulang tanpa diminta eksplisit.

### B. Admin System (`/admin/`)
- `login.html` — Supabase Auth.
- `dashboard.html` — SPA hash-routing, modul: Beranda (stat+grafik), Berita (CRUD+upload), Prestasi (CRUD+upload+ikon), Kelola Gambar Situs (super_admin), Data Siswa (super_admin, kelas dihitung otomatis berbasis tahun ajaran mulai Juli), Data Guru (super_admin), Setting (super_admin: role admin, school_settings).

### C. Core Documentation & Assets
- `SCHOOL_FACTS.md` — **Single Source of Truth** mutlak untuk data, target tahfidz, jumlah GTK/santri, kebijakan sekolah. Jangan mengarang angka di luar ini.
- `assets/css/style.css` — Master stylesheet: CSS Custom Properties (`:root`), layout modular, breakpoints (utama: `1024px`, `768px`; ada juga query berbasis **tinggi** seperti `max-height: 500px` untuk kasus layar landscape pendek — lihat §3.D).
- `assets/js/main.js` — Logika Vanilla JS: dynamic news loader, search autocomplete, mega menu & mobile drawer dropdown, scroll reveal (`IntersectionObserver`), FAQ accordion, lightbox, analytics klik (Supabase: `page_view`, `click_wa`, `click_ppdb`, `click_brosur`), form → WhatsApp bridge (`contact.html`, `ppdb.html`).
- `assets/js/supabase-config.js`, `assets/js/site-images.js` — Koneksi & helper Supabase.
- `assets/js/upload-helper.js` — Upload foto ke Storage bucket `site-media` (sub-folder `berita/`, `prestasi/`, `guru/`, `situs/`).
- `assets/js/achievement-icons.js` — 6 ikon duotone preset untuk prestasi.
- `sitemap.xml`, `robots.txt` — SEO.

---
## 3. Design System & UI/UX Guidelines

### A. Palet Warna (CSS Variables di `:root`)
| Variabel CSS | Hex Code | Deskripsi & Penggunaan |
| :--- | :--- | :--- |
| `--color-primary` | `#04473A` | Hijau tua — identitas utama, header, button primary |
| `--color-secondary` | `#11366E` | Biru tua — aksen sekunder, tag, sub-elemen |
| `--lux-gold` | `#D4B582` | Emas — border aksen, highlight, hover glow |
| `--lux-bg` | `#F8F8F8` | Warm Ivory — latar bersih |
| `--lux-dark` | `#050505` | Heading & kontras tinggi |
| `--color-text-muted` | `#555555` | Body text — kontras terhadap `--lux-bg` sudah dicek **7.6:1** (lolos WCAG AAA) |

### B. Skala Radius & Shadow (WAJIB dipakai, jangan angka custom baru)
- Radius: `--radius-sm: 8px`, `--radius-md: 16px`, `--radius-lg: 24px`, `--radius-pill: 999px`.
- Shadow: `--shadow-sm/md/lg`, basis warna `rgba(4, 71, 58, x)` (bukan abu-abu netral) — kecuali foto di lightbox/modal viewer yang sengaja pakai shadow netral gelap.
- Foto upload admin (rasio bervariasi): **`object-fit: contain`** + background gradient brand tipis, supaya foto utuh tanpa terpotong — bukan `object-fit: cover`.

### C. Tipografi
- Headings: `'Fraunces'` (serif). Body: `'Inter'` (sans-serif). Font loading pakai `preconnect` + `display=swap` (sudah dicek benar, jangan diubah tanpa alasan kuat).

### D. Interaksi, Motion & Aksesibilitas
- **Scroll reveal**: dua sistem class coexist — `.fade-in` (opacity saja) / `.fade-stagger` (translateY 10px + stagger 70ms, per-elemen bukan per-container) adalah sistem **utama/terbaru**; `.reveal`/`.reveal-stagger` juga masih dipakai di beberapa halaman (lebih lama). Saat menambah section baru, ikuti `.fade-in`/`.fade-stagger`.
- **Custom cursor sudah DIHAPUS** (risiko aksesibilitas, menyembunyikan cursor asli) — **jangan ditambahkan kembali** meski ada dokumentasi lama yang menyebutnya.
- **Focus state**: `:focus-visible` global (outline emas 2px) sudah ada, jangan dihapus.
- **Skip-to-content**: link `.skip-link` di semua halaman (setelah `<body>`, target `#main-content` yang punya `tabindex="-1"`) — jangan dihapus, ini standar aksesibilitas dasar.
- **Hero index.html**: parallax halus (`background-attachment: fixed`) + glow mengikuti kursor (`--mx`/`--my` via JS `mousemove`) — **keduanya di-scope `@media (hover: hover) and (pointer: fine)`** (desktop-only by design, JANGAN dihapus scoping-nya — `background-attachment: fixed` buggy di Safari iOS, dan parallax di touchscreen boros baterai tanpa manfaat).
- **`prefers-reduced-motion: reduce`**: WAJIB di-guard untuk setiap animasi/motion baru (banyak contoh existing di file, ikuti polanya) — termasuk `scroll-behavior`.
- **WhatsApp**: SEMUA link `wa.me` di situs (tombol mengambang, ikon header, nomor footer, CTA konteks-spesifik di tiap halaman) sudah punya `?text=` pre-filled sesuai konteks halaman — kalau menambah tombol WA baru, ikuti pola ini, jangan biarkan kosong.
- **Iconography**: SVG stroke-based (`stroke-width: 1.5-2px`), bukan emoji di komponen kartu resmi.

---

## 4. Komponen Khusus yang Perlu Diketahui

- **Jam analog Ritme Harian** (`student-life.html`): dibangun murni CSS (`conic-gradient` untuk cincin warna jadwal, tanpa `mask`/WebGL — versi awal yang pakai CSS `mask` gagal render di browser nyata, jangan diulangi). Ada teks tersembunyi kalau strukturnya salah — pastikan `.ritme-clock-face-wrap` (ukuran tetap) terpisah dari `.ritme-clock` (flex column, auto-height) supaya label AM/PM tidak numpuk ke dalam lingkaran.
- **Dropdown navbar mobile**: sempat ada bug submenu tidak kelihatan di HP **landscape** (bukan soal lebar, tapi **tinggi layar pendek**). Fix: JS `scrollIntoView` saat dropdown dibuka + CSS `@media (max-width: 1024px) and (max-height: 500px)` memadatkan drawer. Kalau ada laporan bug serupa, cek dulu tinggi viewport, bukan cuma lebar/orientasi.

---

## 5. Key Content Rules (Rujukan Wajib dari SCHOOL_FACTS.md)

1. **Sejarah & Afiliasi**: Berdiri **2019** sebagai PPM TahfizhMu Al Badar; **2026** berafiliasi dengan MBS Yogyakarta jadi SMP MBS Al Badar Prambanan.
2. **2 Program**: Boarding (15 Juz, 3 tahun) vs Full Day (4 Juz, 3 tahun). **Tidak ada** target 5 Juz.
3. **2 Kurikulum**: Diniyah (Aqidah, Fiqih, Qur'an Hadits, Tahfidz, Bahasa Arab, ISMUBA) + Terpadu Nasional/Diknas (Kurikulum Merdeka + Koding & AI + STEM).
4. **Adab Digital**: Zero Personal Smartphone untuk santri; Chromebook sekolah dengan DNS Filtering.
5. **PPDB**: TA 2027/2028, sistem *2 Week Service*, portal `https://psb.mbs.sch.id`.

---

## 6. Developer & AI Assistant Working Guidelines

- **Baca kode dulu, jangan asumsi dari dokumen ini atau deskripsi user** — dokumen ini sendiri baru saja ditemukan usang lewat pengecekan langsung (`grep`), bukan dipercaya mentah-mentah.
- **Waspada CSS specificity & class mati (unstyled classes)**: pernah ditemukan class HTML (`gold-border`, `blue-border`, `timeline-list`, dst) yang dipakai di markup tapi **tidak pernah punya CSS sama sekali** — merender sebagai elemen polos tanpa disadari. Selalu `grep` nama class di `style.css` untuk pastikan benar-benar ada sebelum menyimpulkan sesuatu "sudah didesain".
- **Uji bug berbasis viewport-height di device fisik**, bukan cuma DevTools resize — DevTools responsive mode tidak selalu akurat meniru address bar browser HP asli (sumber bug dropdown landscape di atas).
- **CSS `mask`/`-webkit-mask` berisiko gagal silent** — kalau butuh efek "cincin"/annulus, lebih aman pakai teknik tumpuk 2 lingkaran biasa (elemen solid + elemen lebih kecil di atasnya) daripada `mask` dengan radial-gradient, yang terbukti tidak konsisten render di browser nyata pada proyek ini.
- **Non-Destructive Modifications**: perubahan CSS/HTML wajib mempertahankan struktur responsif dan token desain `:root`.
- **Content Integrity**: dilarang mengarang/mengubah angka target tahfidz, jumlah GTK, atau data legalitas di luar `SCHOOL_FACTS.md`.
- **Alur kerja perubahan**: diagnosa dulu (baca kode asli), baru kasih patch/instruksi presisi untuk CLI; SELALU minta user tes & verifikasi dulu sebelum commit — jangan langsung commit tanpa konfirmasi.
