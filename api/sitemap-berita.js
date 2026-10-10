const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lnrhpocorltzctjnsdfj.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucmhwb2Nvcmx0emN0am5zZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDg4NTAsImV4cCI6MjEwNTE4NDg1MH0.1zFpGG-xyiWpkRxaI4TCLqoRgLV1JztJ5SBcspK2o7s';

function escapeXml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
    const candidates = [item.updated_at, item.created_at, item.date_published, item.published_at];
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

async function fetchAllNews() {
    try {
        const endpoint = `${SUPABASE_URL}/rest/v1/news?select=*&order=created_at.desc`;
        const res = await fetch(endpoint, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
        }
    } catch (err) {
        // Fallback to local news.json
    }

    try {
        const content = await readProjectFile(path.join('assets', 'data', 'news.json'));
        const data = JSON.parse(content);
        if (Array.isArray(data)) return data;
    } catch (err) {
        // Fallback empty
    }

    return [];
}

module.exports = async function handler(req, res) {
    try {
        const newsList = await fetchAllNews();

        let urlsXml = '';
        for (const item of newsList) {
            if (!item || !item.id) continue;
            const slug = generateSlug(item.title);
            const canonicalUrl = slug
                ? `https://smpalbadar.sch.id/berita/${encodeURIComponent(item.id)}/${slug}`
                : `https://smpalbadar.sch.id/berita/${encodeURIComponent(item.id)}`;

            const isoDate = getIsoDate(item);
            urlsXml += '  <url>\n';
            urlsXml += `    <loc>${escapeXml(canonicalUrl)}</loc>\n`;
            if (isoDate) {
                urlsXml += `    <lastmod>${isoDate}</lastmod>\n`;
            }
            urlsXml += '  </url>\n';
        }

        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            urlsXml +
            '</urlset>\n';

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600');
        res.end(xml);
    } catch (err) {
        console.error('Error generating /api/sitemap-berita:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
    }
};
