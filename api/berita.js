const fs = require('fs');
const path = require('path');

let sanitizeHtmlFn = null;
async function getSanitizeHtml() {
    if (sanitizeHtmlFn) return sanitizeHtmlFn;
    try {
        const htmlparser = await import('htmlparser2');
        const resolved = require.resolve('htmlparser2');
        require.cache[resolved] = {
            id: resolved,
            filename: resolved,
            loaded: true,
            exports: htmlparser
        };
    } catch (e) {
        // htmlparser2 might already be CJS or handled
    }
    sanitizeHtmlFn = require('sanitize-html');
    return sanitizeHtmlFn;
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lnrhpocorltzctjnsdfj.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucmhwb2Nvcmx0emN0am5zZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDg4NTAsImV4cCI6MjEwNTE4NDg1MH0.1zFpGG-xyiWpkRxaI4TCLqoRgLV1JztJ5SBcspK2o7s';

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function newsImage(url) {
    return (!url || /images\.unsplash\.com/i.test(url)) ? '/assets/img/placeholder.svg' : url;
}

function getAbsoluteImageUrl(image) {
    const img = newsImage(image);
    if (img === '/assets/img/placeholder.svg') {
        return 'https://smpalbadar.sch.id/assets/img/og-image.jpg';
    }
    if (/^https?:\/\//i.test(img)) {
        return img;
    }
    const cleanPath = img.startsWith('/') ? img : '/' + img;
    return 'https://smpalbadar.sch.id' + cleanPath;
}

function getIsoDate(item) {
    const candidates = [item.created_at, item.updated_at, item.date_published, item.published_at];
    for (const c of candidates) {
        if (typeof c === 'string' && /^\d{4}-\d{2}-\d{2}/.test(c) && !isNaN(Date.parse(c))) {
            return new Date(c).toISOString();
        }
    }
    return null;
}

async function readProjectFile(relativePath) {
    const candidates = [
        path.join(process.cwd(), relativePath),
        path.join(__dirname, '..', relativePath),
        path.join(__dirname, relativePath)
    ];
    for (const p of candidates) {
        try {
            return await fs.promises.readFile(p, 'utf8');
        } catch (e) {
            // try next candidate
        }
    }
    throw new Error(`File not found: ${relativePath}`);
}

async function fetchFromSupabase(id) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/news?id=eq.${encodeURIComponent(id)}&select=*`;
        const res = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return { status: 'error', statusCode: res.status };
        }

        const data = await res.json();
        if (Array.isArray(data)) {
            if (data.length > 0) {
                return { status: 'found', data: data[0] };
            }
            return { status: 'not_found' };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (err) {
        clearTimeout(timeout);
        return { status: 'error', error: err };
    }
}

async function fetchFromNewsJson(id) {
    try {
        const content = await readProjectFile(path.join('assets', 'data', 'news.json'));
        const list = JSON.parse(content);
        if (Array.isArray(list)) {
            return list.find(item => item && String(item.id) === String(id)) || null;
        }
        return null;
    } catch (err) {
        return null;
    }
}

function renderNotFoundPage(template) {
    const notFoundBody =
        '<div class="article-not-found">' +
            '<p>Berita yang kamu cari tidak ditemukan atau sudah dihapus.</p>' +
            '<a href="/berita" class="btn btn-outline btn-sm" style="margin-top: 1rem; display: inline-block;">Kembali ke Semua Berita</a>' +
        '</div>';

    let html = template;
    html = html.replace(/<title>[^<]*<\/title>/i, () => '<title>Berita Tidak Ditemukan | SMP MBS Al Badar Prambanan</title>');
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => '<meta name="description" content="Berita tidak ditemukan">');
    html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, () => '<meta name="robots" content="noindex, follow">');
    html = html.replace(/<div\s+class="article-detail-wrap"\s+id="berita-detail-container"[^>]*>[\s\S]*?<\/div>/i,
        () => `<div class="article-detail-wrap" id="berita-detail-container" data-prerendered="1">${notFoundBody}</div>`
    );
    return html;
}

function renderServiceUnavailablePage(template) {
    const errorBody =
        '<div class="article-not-found">' +
            '<p>Layanan sedang mengalami gangguan sementara. Silakan coba beberapa saat lagi.</p>' +
            '<a href="/berita" class="btn btn-outline btn-sm" style="margin-top: 1rem; display: inline-block;">Kembali ke Semua Berita</a>' +
        '</div>';

    let html = template;
    html = html.replace(/<title>[^<]*<\/title>/i, () => '<title>Layanan Tidak Tersedia | SMP MBS Al Badar Prambanan</title>');
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => '<meta name="description" content="Layanan sedang mengalami gangguan sementara.">');
    html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, () => '<meta name="robots" content="noindex, nofollow">');
    html = html.replace(/<div\s+class="article-detail-wrap"\s+id="berita-detail-container"[^>]*>[\s\S]*?<\/div>/i,
        () => `<div class="article-detail-wrap" id="berita-detail-container" data-prerendered="1">${errorBody}</div>`
    );
    return html;
}

module.exports = async function handler(req, res) {
    try {
        const query = req.query || {};
        const urlObj = req.url ? new URL(req.url, 'http://localhost') : null;

        let rawLegacy = query.legacy;
        let rawId = query.id;
        let rawSlug = query.slug;

        if (urlObj) {
            if (!rawLegacy) rawLegacy = urlObj.searchParams.get('legacy');
            if (!rawId) rawId = urlObj.searchParams.get('id');
            if (!rawSlug) rawSlug = urlObj.searchParams.get('slug');
        }

        const legacy = Array.isArray(rawLegacy) ? rawLegacy[0] : rawLegacy;
        const idVal = Array.isArray(rawId) ? rawId[0] : rawId;
        const id = idVal ? String(idVal).trim() : '';
        const slug = rawSlug ? decodeURIComponent(String(Array.isArray(rawSlug) ? rawSlug[0] : rawSlug).trim()) : '';

        // 1. Jika query legacy bernilai "1":
        // Validasi id: hanya huruf, angka, tanda minus, titik, dan underscore.
        // Jika tidak valid atau kosong: balas 404 (halaman tidak ditemukan).
        // Jika valid: balas redirect 301 ke "/berita/" + encodeURIComponent(id).
        if (legacy === '1' || legacy === 1) {
            const isValidId = /^[a-zA-Z0-9._-]+$/.test(id);
            if (!id || !isValidId) {
                const template = await readProjectFile('berita-detail.html');
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'no-store');
                return res.end(renderNotFoundPage(template));
            }
            res.statusCode = 301;
            res.setHeader('Location', `/berita/${encodeURIComponent(id)}`);
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
            return res.end();
        }

        // 2. Tambahan: jika request ke /berita/{id} membawa query string "id" yang sama persis
        // dengan id di path (sisa dari redirect lama), balas 301 ke /berita/{id} bersih.
        const allIds = urlObj ? urlObj.searchParams.getAll('id') : [];
        if (Array.isArray(query.id)) {
            for (const v of query.id) {
                if (!allIds.includes(v)) allIds.push(v);
            }
        }
        const clientUri = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.headers['x-original-url'] || '';
        let clientHasQueryId = false;
        if (clientUri) {
            try {
                const parsedClientUri = new URL(clientUri, 'http://localhost');
                if (parsedClientUri.searchParams.get('id') === id) {
                    clientHasQueryId = true;
                }
            } catch (e) {}
        }
        const hasDuplicateQueryId = allIds.length > 1 && allIds.some(v => String(v).trim() === id);

        if (id && (clientHasQueryId || hasDuplicateQueryId)) {
            res.statusCode = 301;
            res.setHeader('Location', `/berita/${encodeURIComponent(id)}`);
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
            return res.end();
        }

        const template = await readProjectFile('berita-detail.html');

        if (!id) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.end(renderNotFoundPage(template));
        }

        let item = null;
        let supabaseSuccess = false;

        const sbResult = await fetchFromSupabase(id);
        if (sbResult.status === 'found') {
            item = sbResult.data;
            supabaseSuccess = true;
        } else if (sbResult.status === 'not_found') {
            supabaseSuccess = true;
        } else {
            supabaseSuccess = false;
        }

        if (!item) {
            item = await fetchFromNewsJson(id);
        }

        if (!item) {
            if (supabaseSuccess) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Cache-Control', 'no-store');
                return res.end(renderNotFoundPage(template));
            } else {
                res.statusCode = 503;
                res.setHeader('Retry-After', '120');
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.end(renderServiceUnavailablePage(template));
            }
        }

        const canonicalUrl = `https://smpalbadar.sch.id/berita/${encodeURIComponent(item.id)}`;

        if (slug) {
            res.statusCode = 301;
            res.setHeader('Location', `/berita/${encodeURIComponent(item.id)}`);
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
            return res.end();
        }

        const titleText = escapeHtml(item.title || '');
        const excerptText = escapeHtml(item.excerpt || item.title || '');
        const canonicalAttr = escapeHtml(canonicalUrl);
        const absoluteImageUrl = getAbsoluteImageUrl(item.image);
        const imageAttr = escapeHtml(absoluteImageUrl);

        const rawContent = String(item.content || item.excerpt || '');
        const isRichHtml = /<[a-z][\s\S]*>/i.test(rawContent);
        let bodyHtml;
        if (isRichHtml) {
            const sanitizeHtml = await getSanitizeHtml();
            bodyHtml = sanitizeHtml(rawContent, {
                allowedTags: [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
                    'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote',
                    'a', 'img', 'figure', 'figcaption'
                ],
                allowedAttributes: {
                    'a': ['href'],
                    'img': ['src', 'alt']
                }
            });
        } else {
            bodyHtml = rawContent
                .split(/\n+/)
                .map(p => p.trim())
                .filter(Boolean)
                .map(p => '<p>' + escapeHtml(p) + '</p>')
                .join('');
        }

        const articleHtml =
            '<div class="article-meta">' +
                '<span class="news-tag-lux">' + escapeHtml(item.category || '') + '</span>' +
                '<span class="news-date" style="color: var(--color-text-muted); font-size: 0.8rem; font-weight: 500;">' + escapeHtml(item.date || '') + '</span>' +
            '</div>' +
            '<h1 class="article-title">' + titleText + '</h1>' +
            '<div class="article-cover">' +
                '<img src="' + escapeHtml(newsImage(item.image)) + '" alt="' + titleText + '" onerror="this.onerror=null;this.src=\'/assets/img/placeholder.svg\';">' +
            '</div>' +
            '<div class="article-body">' + bodyHtml + '</div>';

        const schema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": String(item.title || ''),
            "description": String(item.excerpt || item.title || ''),
            "image": [ absoluteImageUrl ],
            "mainEntityOfPage": canonicalUrl,
            "author": {
                "@type": "Organization",
                "name": "SMP MBS Al Badar Prambanan"
            },
            "publisher": {
                "@type": "Organization",
                "name": "SMP MBS Al Badar Prambanan",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://smpalbadar.sch.id/assets/img/logo.png"
                }
            }
        };

        const isoDate = getIsoDate(item);
        if (isoDate) {
            schema.datePublished = isoDate;
        }

        const jsonLdSafe = JSON.stringify(schema).replace(/</g, '\\u003c');
        const jsonLdScript = `    <script type="application/ld+json">${jsonLdSafe}</script>\n`;

        let html = template;
        html = html.replace(/<title>[^<]*<\/title>/i, () => `<title>${titleText} | SMP MBS Al Badar Prambanan</title>`);
        html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="description" content="${excerptText}">`);
        html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, () => `<link rel="canonical" href="${canonicalAttr}">`);
        html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, () => `<meta property="og:url" content="${canonicalAttr}">`);
        html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, () => `<meta property="og:title" content="${titleText}">`);
        html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, () => `<meta property="og:description" content="${excerptText}">`);
        html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, () => `<meta property="og:image" content="${imageAttr}">`);
        html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:title" content="${titleText}">`);
        html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:description" content="${excerptText}">`);
        html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:image" content="${imageAttr}">`);

        html = html.replace(/<div\s+class="article-detail-wrap"\s+id="berita-detail-container"[^>]*>[\s\S]*?<\/div>/i,
            () => `<div class="article-detail-wrap" id="berita-detail-container" data-prerendered="1">${articleHtml}</div>`
        );

        html = html.replace(/<\/head>/i, () => `${jsonLdScript}</head>`);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        res.end(html);
    } catch (err) {
        console.error('Error handling /api/berita:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
    }
};
