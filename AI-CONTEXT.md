# AI Context & Technical Guidelines: SMP MBS Al Badar Prambanan

Dokumentasi arsitektur, filosofi desain, struktur file, dan pedoman konten resmi untuk pengembangan website **SMP MBS Al Badar Prambanan**.

---

## 1. Project Overview & Tech Stack

- **Platform**: Static Web (HTML5 Semantic, Pure Vanilla CSS3, Vanilla JavaScript ES6+) di-hosting via **GitHub Pages**.
- **URL Produksi**: `https://albadar-psi.vercel.app`
- **Future Readiness**: Terstruktur modular dan siap untuk migrasi masa depan ke Headless CMS atau Fullstack Backend framework (seperti Laravel atau Next.js).
- **Design Philosophy**: **Premium, Luxury, Institutional, Islamic**. Menghadirkan citra pesantren modern yang berwibawa, elegan, tertib, dan berstandar internasional.

---

## 2. File Structure & Core Assets (Current)

### A. Active HTML Pages (Total 12 Files)
1. `index.html` — Beranda utama (Hero sinematik, Floating stats bar, Editorial intro, Pilar pendidikan, Prestasi, Berita dinamis dengan pattern Islami, Marquee afiliasi MBS, Alur PPDB, CTA).
2. `about.html` — Profil sekolah, Sejarah (2019-2026), Visi & Misi, Nilai-nilai, Fasilitas, dan GTK.
3. `programs.html` — Program Boarding (15 Juz) vs Full Day (4 Juz), 2 Struktur Kurikulum (Diniyah & Diknas), Keunggulan (Koding & AI, STEM, Bahasa).
4. `student-life.html` — Kehidupan santri, Jadwal harian terpadu, Kegiatan periodik (Muhadhoroh, Muhadatsah, Kajian Tematik), Ekstrakurikuler (HW, Tapak Suci, dll), Fasilitas.
5. `ppdb.html` — Informasi Penerimaan Peserta Didik Baru (PPDB 2027/2028), Sistem *2 Week Service*, Rincian biaya, Persyaratan, dan Portal PSB MBS.
6. `news.html` — Portal berita resmi, agenda sekolah, dan pengumuman.
7. `achievements.html` — Rekam jejak prestasi santri di bidang akademik, tahfidz, dan sains.
8. `faq.html` — Tanya jawab interaktif seputar boarding, kurikulum, biaya, dan kebijakan sekolah.
9. `contact.html` — Informasi kontak, lokasi Jamusan Bokoharjo Prambanan, peta Google Maps, dan form narahubung.
10. `privacy-policy.html` — Kebijakan privasi & perlindungan data santri/wali santri.
11. `404.html` — Halaman penanganan error 404 berdesain luxury institusional.
12. `gallery.html` — Galeri dokumentasi aktivitas (*unlisted / utility page*).

### B. Core Documentation & Assets
- `SCHOOL_FACTS.md` — **Single Source of Truth (SSOT)** mutlak untuk seluruh data, fakta, target tahfidz, jumlah GTK/santri, dan kebijakan sekolah.
- `assets/css/style.css` — Master stylesheet tersentralisasi: CSS Custom Properties (`:root`), modular layout, responsive breakpoints, dan komponen UI luxury.
- `assets/js/main.js` — Logika interaksi Vanilla JS: Dynamic news loader (auto-rotation 5s), Search bar autocomplete & Google Site Search, Mega menu & mobile drawer dropdown, Reveal on scroll (`IntersectionObserver`), Custom cursor desktop, FAQ accordion, dan Lightbox modal.
- `assets/img/` — Aset gambar, logo resmi berformat SVG/PNG, dan web icon.
- `sitemap.xml` & `robots.txt` — Pengaturan indexing mesin pencari (SEO).

---

## 3. Design System & UI/UX Guidelines

### A. Palet Warna (CSS Variables di `:root`)
| Variabel CSS | Hex Code | Deskripsi & Penggunaan |
| :--- | :--- | :--- |
| `--color-primary` | `#04473A` | **Hijau Muhammadiyah Tua** — Warna identitas utama, header, button primary, hero subpage |
| `--color-secondary` | `#11366E` | **Biru Muhammadiyah Tua** — Aksen sekunder mewah, pilar section, tag, sub-elemen |
| `--lux-gold` | `#D4B582` | **Emas Mewah (Lux Gold)** — Border aksen, eyebrow title, icon highlight, hover glow |
| `--lux-bg` | `#F8F8F8` | **Warm Ivory / Sand** — Latar belakang halaman bersih dan section kartu |
| `--lux-dark` | `#050505` | **Hitam Luxury** — Heading teks (`h1`, `h2`, `h3`) dan stats bar kontras |
| `--color-text-muted` | `#555555` | **Muted Slate** — Deskripsi teks dan paragraf body |

### B. Tipografi
- **Headings (`h1` - `h4`, Title)**: `'Fraunces'`, serif (klasik, megah, institusional).
- **Body & UI Elements**: `'Inter'`, sans-serif (bersih, modern, highly legible).

### C. UI Components & Layout Standard
- **Dark Page Hero (Subpages)**: `min-height: 70vh` dengan latar belakang `--color-primary`, border-bottom emas tipis, dan tipografi terpusat.
- **Bento Grid Lux & Feature Cards**: Card berdesain clean `#ffffff` dengan border radius `16px`, subtle border `rgba(0,0,0,0.05)`, dan soft box shadow.
- **News Section Pattern**: Background geometric pattern Islami (Rub el Hizb 8-pointed star) dengan overlay `rgba(248, 248, 248, 0.92)` untuk kontras dan keterbacaan tinggi.
- **Horizontal Timeline**: Step alur dengan dashed border separator elegan.
- **Iconography**: Selalu gunakan **SVG Icons** bernuansa luxury (stroke width 1.5 - 2px, warna emas/navy). **Dilarang menggunakan emoji kasual** di dalam komponen kartu resmi.
- **Section Spacing**: Konsisten `5rem 0` (desktop) dan `3.5rem 0` / `.compact-section` `4rem 0` untuk kerapatan visual yang proporsional.

### D. Navigasi & Interaktivitas
- **Header & CSS Logo**: Header sticky dengan transisi background saat di-scroll (`.scrolled`). Logo teks CSS 3-baris rapi: *SEKOLAH MENENGAH PERTAMA* / *MBS AL BADAR* / *PRAMBANAN*.
- **Dropdown Logic**: Berfungsi ganda: buka saat hover (desktop) dan toggle klik dengan `preventDefault` pada trigger link utama.
- **Expandable Search Bar**: Input pencarian overlay dengan live autocomplete suggestions berbasis kata kunci serta opsi pencarian Google fallback.
- **Reveal on Scroll**: Animasi fade & slide up menggunakan `IntersectionObserver` (`.reveal`, `.reveal-stagger`).
- **Dynamic News Loader**: Rotasi kartu berita otomatis setiap 5 detik dengan transisi fade berurutan.

---

## 4. Key Content Rules (Rujukan Wajib dari SCHOOL_FACTS.md)

1. **Sejarah & Afiliasi**:
   - Berdiri tahun **2019** sebagai **PPM TahfizhMu Al Badar**.
   - Tahun **2026** berafiliasi resmi dengan **MBS (Muhammadiyah Boarding School) Yogyakarta** dan bertransformasi menjadi **SMP MBS Al Badar Prambanan**.
2. **2 Program Pendidikan**:
   - **Boarding (Mukim)**: Target Tahfidz **15 Juz** (3 Tahun).
   - **Full Day (Non-Boarding)**: Target Tahfidz **4 Juz** (3 Tahun).
   - *(PENTING: Tidak ada target 5 Juz; seluruh referensi lama telah dihapus).*
3. **2 Struktur Kurikulum Utama**:
   - **Kurikulum Diniyah**: Aqidah/Tauhid, Fiqih, Qur'an Hadits, Tahfidz, Bahasa Arab aktif, ISMUBA, dan Fiqih Informasi.
   - **Kurikulum Terpadu Nasional (Diknas)**: Kurikulum Merdeka (Matematika, IPA, IPS, Bahasa Indonesia, Bahasa Inggris, Pendidikan Pancasila, Koding & AI / KKA, STEM).
4. **Kebijakan Digital (Adab Digital)**:
   - **Zero Personal Smartphone**: Santri dilarang membawa smartphone/HP pribadi ke lingkungan sekolah/asrama.
   - **Fiqih Informasi & Chromebook**: Pembelajaran digital terfasilitasi melalui perangkat Chromebook sekolah dengan pengawasan DNS Filtering dan penanaman Cyber-Akhlaq.
5. **PPDB & Sistem Pendaftaran**:
   - Pendaftaran dibuka untuk TA **2027/2028**.
   - Menggunakan sistem **2 Week Service** (proses seleksi & penerimaan langsung tanpa menunggu gelombang penutupan).
   - Portal resmi PSB: `https://psb.mbs.sch.id`.

---

## 5. Developer & AI Assistant Working Guidelines

- **Non-Destructive Modifications**: Setiap perubahan CSS atau HTML wajib mempertahankan struktur responsif dan konsistensi token desain `:root`.
- **Content Integrity**: Dilarang mengarang atau mengubah angka target tahfidz, jumlah GTK, atau data legalitas di luar apa yang tercantum pada `SCHOOL_FACTS.md`.
- **Accessibility & Performance**: Pertahankan atribut ARIA (`aria-expanded`, `aria-label`), alt text pada gambar (`<img>`), serta validitas markup semantik.
