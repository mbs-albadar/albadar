const fs = require('fs');
const path = require('path');

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

async function fetchFromSupabase() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/news?select=id,title,date,category,excerpt,image&order=created_at.desc`;
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
            return { status: 'success', data };
        }
        return { status: 'error', message: 'Invalid response format' };
    } catch (err) {
        clearTimeout(timeout);
        return { status: 'error', error: err };
    }
}

async function fetchFromNewsJson() {
    try {
        const content = await readProjectFile(path.join('assets', 'data', 'news.json'));
        const list = JSON.parse(content);
        if (Array.isArray(list)) {
            return list;
        }
        return null;
    } catch (err) {
        return null;
    }
}

function renderNewsCards(items) {
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

function replaceNewsContainer(template, cardsHtml) {
    const startMatch = template.match(/<div\b[^>]*\bid=["']news-grid-container["'][^>]*>/i);
    if (!startMatch) return template;
    const startIdx = startMatch.index;
    const openTag = startMatch[0];
    const openTagEnd = startIdx + openTag.length;

    let depth = 1;
    const divRegex = /<\/?div\b[^>]*>/gi;
    divRegex.lastIndex = openTagEnd;
    let m;
    let closeIdx = -1;
    let closeTag = '</div>';
    while ((m = divRegex.exec(template)) !== null) {
        if (m[0].startsWith('</')) {
            depth--;
            if (depth === 0) {
                closeIdx = m.index;
                closeTag = m[0];
                break;
            }
        } else {
            depth++;
        }
    }

    if (closeIdx !== -1) {
        const fullMatchedBlock = template.slice(startIdx, closeIdx + closeTag.length);
        return template.replace(fullMatchedBlock, () => `${openTag}\n${cardsHtml}\n${closeTag}`);
    }
    return template;
}

module.exports = async function handler(req, res) {
    let template;
    try {
        template = await readProjectFile('news.html');
    } catch (templateErr) {
        res.statusCode = 503;
        res.setHeader('Retry-After', '120');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Service Unavailable');
        return;
    }

    try {
        let items = null;

        const supabaseRes = await fetchFromSupabase();
        if (supabaseRes.status === 'success') {
            items = supabaseRes.data;
        } else {
            // Supabase gagal (error jaringan, timeout, atau status 5xx), coba fallback news.json
            items = await fetchFromNewsJson();
        }

        // Jika terjadi error apa pun / hasil kosong karena kegagalan fallback
        if (!items) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(template);
            return;
        }

        // Jika Supabase menjawab normal tapi daftar kosong
        if (items.length === 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
            res.end(template);
            return;
        }

        const cardsHtml = renderNewsCards(items);
        const finalHtml = replaceNewsContainer(template, cardsHtml);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        res.end(finalHtml);
    } catch (renderErr) {
        // Jika terjadi error APA PUN saat proses rendering, balas template asli apa adanya
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(template);
    }
};
