/*
 * Pemuat foto situs.
 * Elemen dengan atribut data-site-image="kunci" diisi dari tabel site_images
 * (dikelola lewat dashboard: Kelola Gambar Situs). Selama belum ada foto,
 * elemen yang berstatus hidden tetap tersembunyi dan tampilan bawaan dipakai.
 *
 *   <img data-site-image="lingkungan-sekolah" hidden>            -> mengisi src
 *   <div data-site-image="hero-beranda" data-site-image-mode="background"> -> mengisi background-image
 *
 * Atribut data-site-image-wrap pada induk: induk ikut ditampilkan saat foto tersedia.
 * Daftar kunci yang valid ada di admin/dashboard.html (SITE_IMAGE_SLOTS).
 */
(function () {
    function reveal(el) {
        el.hidden = false;
        const wrap = el.closest('[data-site-image-wrap]');
        if (wrap) {
            wrap.hidden = false;
            wrap.classList.add('is-visible');
        }
    }

    function conceal(el) {
        el.hidden = true;
        const wrap = el.closest('[data-site-image-wrap]');
        if (wrap) wrap.hidden = true;
    }

    async function loadSiteImages() {
        const els = Array.prototype.slice.call(document.querySelectorAll('[data-site-image]'));
        if (!els.length || typeof supabaseClient === 'undefined') return;

        const keys = Array.from(new Set(els.map(function (el) { return el.getAttribute('data-site-image'); })));

        try {
            const result = await supabaseClient
                .from('site_images')
                .select('key, image_url')
                .in('key', keys);

            if (result.error || !result.data) return;

            const urls = {};
            result.data.forEach(function (row) {
                if (row.key && row.image_url) urls[row.key] = row.image_url;
            });

            els.forEach(function (el) {
                const url = urls[el.getAttribute('data-site-image')];
                if (!url) return;

                if (el.getAttribute('data-site-image-mode') === 'background') {
                    el.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
                    return;
                }

                el.addEventListener('error', function () { conceal(el); }, { once: true });
                reveal(el);
                el.src = url;
            });
        } catch (err) {
            console.warn('Gagal memuat foto situs:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSiteImages);
    } else {
        loadSiteImages();
    }
})();
