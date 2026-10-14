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

const INDO_MONTHS = {
    'januari': 1,
    'februari': 2,
    'maret': 3,
    'april': 4,
    'mei': 5,
    'juni': 6,
    'juli': 7,
    'agustus': 8,
    'september': 9,
    'oktober': 10,
    'november': 11,
    'nopember': 11,
    'desember': 12
};

function isValidDate(year, month, day) {
    if (year < 2000 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return utcDate.getUTCFullYear() === year &&
           utcDate.getUTCMonth() === month - 1 &&
           utcDate.getUTCDate() === day;
}

function formatYmd(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseTextDate(dateStr) {
    if (typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // 1. Format ISO: "2026-07-13"
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10);
        const d = parseInt(isoMatch[3], 10);
        if (isValidDate(y, m, d)) {
            return formatYmd(y, m, d);
        }
        return null;
    }

    // 2. Format Indonesia: "13 Juli 2026" / "  5   agustus 2026 "
    const indoMatch = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
    if (indoMatch) {
        const d = parseInt(indoMatch[1], 10);
        const monthKey = indoMatch[2].toLowerCase();
        const y = parseInt(indoMatch[3], 10);
        const m = INDO_MONTHS[monthKey];
        if (m && isValidDate(y, m, d)) {
            return formatYmd(y, m, d);
        }
        return null;
    }

    return null;
}

function getDatePublished(item) {
    if (!item) return null;
    // a. Jika kolom "date" (teks) dapat dibaca sebagai tanggal, pakai itu.
    const textDate = parseTextDate(item.date);
    if (textDate) {
        return textDate;
    }

    // b. Jika tidak bisa dibaca, pakai logika yang sudah ada (created_at dst).
    const candidates = [item.created_at, item.updated_at, item.date_published, item.published_at];
    for (const c of candidates) {
        if (typeof c === 'string' && /^\d{4}-\d{2}-\d{2}/.test(c) && !isNaN(Date.parse(c))) {
            return new Date(c).toISOString();
        }
    }

    // c. Jika keduanya tidak ada, jangan menulis datePublished.
    return null;
}

function getDateModified(item, datePublished) {
    if (!item || !datePublished) return null;
    const updatedAt = item.updated_at;
    if (typeof updatedAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(updatedAt) && !isNaN(Date.parse(updatedAt))) {
        const modTime = Date.parse(updatedAt);
        const pubTime = Date.parse(datePublished);
        if (!isNaN(modTime) && !isNaN(pubTime) && modTime >= pubTime) {
            return new Date(updatedAt).toISOString();
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

async function fetchRelated(currentId) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/news?id=neq.${encodeURIComponent(currentId)}&select=id,title,date,category,excerpt,image&order=created_at.desc&limit=12`;
        const res = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
            return data;
        }
        return null;
    } catch (err) {
        clearTimeout(timeout);
        return null;
    }
}

function renderRelatedNewsCards(items) {
    return items.map(function(item) {
        const id = encodeURIComponent(String(item.id || ''));
        const title = escapeHtml(item.title || '');
        const image = escapeHtml(newsImage(item.image));
        const category = escapeHtml(item.category || '');
        const date = escapeHtml(item.date || '');
        const excerpt = escapeHtml(item.excerpt || '');

        return '<a href="/berita/' + id + '" class="news-card-lux lux-img-zoom">' +
            '<div class="news-img-wrap">' +
                '<img src="' + image + '" alt="' + title + '" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/img/placeholder.svg\';">' +
            '</div>' +
            '<div class="news-content-lux">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">' +
                    '<span class="news-tag-lux">' + category + '</span>' +
                    '<span class="news-date" style="color: var(--color-text-muted); font-size: 0.75rem; font-weight: 500;">' + date + '</span>' +
                '</div>' +
                '<h3 class="news-title-lux">' + title + '</h3>' +
                '<p class="news-excerpt-lux">' + excerpt + '</p>' +
                '<span class="news-read-lux">Baca Selengkapnya</span>' +
            '</div>' +
        '</a>';
    }).join('\n');
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
        let rawHasQueryId = query.hasqueryid;
        let rawQueryId = query.queryid;
        let rawId = query.id;
        let rawSlug = query.slug;

        if (urlObj) {
            if (!rawLegacy) rawLegacy = urlObj.searchParams.get('legacy');
            if (!rawHasQueryId) rawHasQueryId = urlObj.searchParams.get('hasqueryid');
            if (!rawQueryId) rawQueryId = urlObj.searchParams.get('queryid');
            if (!rawId) rawId = urlObj.searchParams.get('id');
            if (!rawSlug) rawSlug = urlObj.searchParams.get('slug');
        }

        const legacy = Array.isArray(rawLegacy) ? rawLegacy[0] : rawLegacy;
        const hasQueryId = Array.isArray(rawHasQueryId) ? rawHasQueryId[0] : rawHasQueryId;
        const queryId = Array.isArray(rawQueryId) ? rawQueryId[0] : rawQueryId;
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
        const isResidualQueryId = (hasQueryId === '1' || hasQueryId === 1) && String(queryId).trim() === id;

        if (id && isResidualQueryId) {
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
        let isFromSupabase = false;
        const sbPromise = fetchFromSupabase(id);
        const relatedPromise = fetchRelated(id);
        const sbResult = await sbPromise;

        if (sbResult.status === 'found') {
            item = sbResult.data;
            isFromSupabase = true;
        } else if (sbResult.status === 'not_found') {
            // Supabase menjawab normal dan id tidak ada ("not_found")
            // Balas 404 (no-store) TANPA membuka news.json
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.end(renderNotFoundPage(template));
        } else {
            // Permintaan ke Supabase GAGAL (error jaringan, timeout, atau status 5xx)
            // assets/data/news.json HANYA dipakai jika permintaan ke Supabase GAGAL
            item = await fetchFromNewsJson(id);
            if (!item) {
                // Supabase gagal DAN id tidak ada di news.json -> 503 dengan Retry-After: 120 dan no-store
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

        let relatedHtml = '';
        if (isFromSupabase) {
            const relatedData = await relatedPromise;
            if (Array.isArray(relatedData) && relatedData.length > 0) {
                const candidates = relatedData.filter(r => r && String(r.id) !== String(item.id));
                const currentCat = (item.category || '').trim().toLowerCase();
                const sameCategory = [];
                const otherCategory = [];
                for (const r of candidates) {
                    const cat = (r.category || '').trim().toLowerCase();
                    if (currentCat && cat === currentCat) {
                        sameCategory.push(r);
                    } else {
                        otherCategory.push(r);
                    }
                }
                const selectedRelated = [...sameCategory, ...otherCategory].slice(0, 3);
                if (selectedRelated.length > 0) {
                    const cardsHtml = renderRelatedNewsCards(selectedRelated);
                    relatedHtml =
                        '\n<section class="related-news-section" aria-labelledby="relatedNewsTitle">' +
                            '<h2 class="section-title-lux section-title-sm" id="relatedNewsTitle">Baca Juga</h2>' +
                            '<div class="news-grid-lux">\n' + cardsHtml + '\n</div>' +
                        '</section>';
                }
            }
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

        const shareWaHref = 'https://api.whatsapp.com/send?text=' + escapeHtml(encodeURIComponent((item.title || '') + ' ' + canonicalUrl));
        const shareFbHref = 'https://www.facebook.com/sharer/sharer.php?u=' + escapeHtml(encodeURIComponent(canonicalUrl));

        const shareHtml =
            '<div class="article-share" data-share-url="' + canonicalAttr + '">' +
                '<span class="article-share-label">Bagikan:</span>' +
                '<a class="share-btn" href="' + shareWaHref + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
                '<a class="share-btn" href="' + shareFbHref + '" target="_blank" rel="noopener noreferrer">Facebook</a>' +
                '<button type="button" class="share-btn share-copy">Salin tautan</button>' +
                '<span class="share-feedback" role="status" aria-live="polite"></span>' +
            '</div>' +
            '<script>' +
            '(function(){' +
                'var shareBlock=document.querySelector(\'.article-share\');' +
                'if(!shareBlock)return;' +
                'var copyBtn=shareBlock.querySelector(\'.share-copy\');' +
                'var feedback=shareBlock.querySelector(\'.share-feedback\');' +
                'if(!copyBtn)return;' +
                'var timer=null;' +
                'function showFeedback(msg){' +
                    'if(!feedback)return;' +
                    'feedback.textContent=msg;' +
                    'if(timer)clearTimeout(timer);' +
                    'timer=setTimeout(function(){feedback.textContent=\'\';},2000);' +
                '}' +
                'function fallbackCopy(text){' +
                    'var success=false;' +
                    'try{' +
                        'var ta=document.createElement(\'textarea\');' +
                        'ta.value=text;' +
                        'ta.setAttribute(\'readonly\',\'\');' +
                        'ta.style.position=\'fixed\';' +
                        'ta.style.top=\'-9999px\';' +
                        'ta.style.left=\'-9999px\';' +
                        'ta.style.opacity=\'0\';' +
                        'document.body.appendChild(ta);' +
                        'ta.focus();' +
                        'ta.select();' +
                        'success=document.execCommand(\'copy\');' +
                        'document.body.removeChild(ta);' +
                    '}catch(e){success=false;}' +
                    'if(success){showFeedback(\'Tautan disalin\');}' +
                    'else{showFeedback(\'Gagal menyalin\');}' +
                '}' +
                'copyBtn.addEventListener(\'click\',function(){' +
                    'var url=shareBlock.getAttribute(\'data-share-url\')||window.location.href;' +
                    'if(navigator.clipboard&&window.isSecureContext){' +
                        'navigator.clipboard.writeText(url).then(function(){' +
                            'showFeedback(\'Tautan disalin\');' +
                        '}).catch(function(){' +
                            'fallbackCopy(url);' +
                        '});' +
                    '}else{' +
                        'fallbackCopy(url);' +
                    '}' +
                '});' +
            '})();' +
            '</script>';

        const articleHtml =
            '<div class="article-meta">' +
                '<span class="news-tag-lux">' + escapeHtml(item.category || '') + '</span>' +
                '<span class="news-date" style="color: var(--color-text-muted); font-size: 0.8rem; font-weight: 500;">' + escapeHtml(item.date || '') + '</span>' +
            '</div>' +
            '<h1 class="article-title">' + titleText + '</h1>' +
            '<div class="article-cover">' +
                '<img src="' + escapeHtml(newsImage(item.image)) + '" alt="' + titleText + '" onerror="this.onerror=null;this.src=\'/assets/img/placeholder.svg\';">' +
            '</div>' +
            '<div class="article-body">' + bodyHtml + '</div>' +
            shareHtml;

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

        const datePublished = getDatePublished(item);
        if (datePublished) {
            schema.datePublished = datePublished;
        }

        const dateModified = getDateModified(item, datePublished);
        if (dateModified) {
            schema.dateModified = dateModified;
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
            () => `<div class="article-detail-wrap" id="berita-detail-container" data-prerendered="1">${articleHtml}</div>${relatedHtml}`
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

module.exports.parseTextDate = parseTextDate;
module.exports.getDatePublished = getDatePublished;
module.exports.getDateModified = getDateModified;
module.exports.fetchFromSupabase = fetchFromSupabase;
module.exports.fetchFromNewsJson = fetchFromNewsJson;
module.exports.fetchRelated = fetchRelated;
