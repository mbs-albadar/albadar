const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

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

function generateSlug(title) {
    if (!title) return '';
    const normalized = String(title)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
    let slug = normalized.slice(0, 60);
    return slug.replace(/-+$/, '');
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
    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/news?id=eq.${encodeURIComponent(id)}&select=*`;
        const res = await fetch(endpoint, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        return null;
    } catch (err) {
        return null;
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

module.exports = async function handler(req, res) {
    try {
        const query = req.query || {};
        let id = query.id;
        let slug = query.slug;

        if (!id && req.url) {
            const urlObj = new URL(req.url, 'http://localhost');
            id = urlObj.searchParams.get('id');
            if (!slug) slug = urlObj.searchParams.get('slug');
        }

        id = id ? String(id).trim() : '';
        slug = slug ? decodeURIComponent(String(slug).trim()) : '';

        const template = await readProjectFile('berita-detail.html');

        if (!id) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.end(renderNotFoundPage(template));
        }

        let item = await fetchFromSupabase(id);
        if (!item) {
            item = await fetchFromNewsJson(id);
        }

        if (!item) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.end(renderNotFoundPage(template));
        }

        const correctSlug = generateSlug(item.title);
        const canonicalUrl = correctSlug
            ? `https://smpalbadar.sch.id/berita/${encodeURIComponent(item.id)}/${correctSlug}`
            : `https://smpalbadar.sch.id/berita/${encodeURIComponent(item.id)}`;

        if (slug !== correctSlug) {
            res.statusCode = 301;
            res.setHeader('Location', canonicalUrl);
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
