// Netlify Edge Function: zet titel, omschrijving, Open Graph-tags (Facebook/WhatsApp)
// en de gekozen kleuren al in de HTML vóórdat de pagina wordt verstuurd.
// Zo zien Google, Facebook en WhatsApp de juiste titel, tekst en afbeelding.
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from '../../public/js/config.js';
import { DEFAULT_SETTINGS } from '../../public/js/defaults.js';
import { themeCss } from '../../public/js/themes.js';

const PAGE_KEYS = { '/': 'home', '/over-mij': 'over', '/aanbod': 'aanbod', '/nieuws': 'nieuws', '/contact': 'contact', '/privacy': 'privacy' };

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function sb(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

export default async (request, context) => {
  const res = await context.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;

  const url = new URL(request.url);
  const path = url.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');
  let html = await res.text();
  let status = res.status;

  try {
    let settings = structuredClone(DEFAULT_SETTINGS);
    let post = null;
    const isArticle = path.startsWith('/nieuws/');

    if (isConfigured()) {
      const now = new Date().toISOString();
      const [rows, posts] = await Promise.all([
        sb('settings?select=key,value'),
        isArticle ? sb(`posts?select=title,slug,excerpt,image_url,image_alt,seo_title,seo_description,tags,published_at,updated_at&status=eq.published&published_at=lte.${encodeURIComponent(now)}&slug=eq.${encodeURIComponent(decodeURIComponent(path.slice(8)))}&limit=1`) : Promise.resolve([]),
      ]);
      for (const { key, value } of rows) {
        if (key === 'seo') settings.seo = { ...settings.seo, ...value, pages: { ...settings.seo.pages, ...(value.pages || {}) } };
        else settings[key] = { ...(settings[key] || {}), ...value };
      }
      post = posts[0] || null;
    }

    const origin = settings.seo.siteUrl || url.origin;
    const canonical = origin + (path === '/' ? '/' : path);
    let title, description, image, type = 'website', extra = '';

    if (isArticle) {
      if (!post) {
        status = isConfigured() ? 404 : status;
        title = 'Verhaal niet gevonden – Estacia';
        extra = '<meta name="robots" content="noindex">';
      } else {
        title = post.seo_title || `${post.title} | Estacia`;
        description = post.seo_description || post.excerpt;
        image = post.image_url;
        type = 'article';
        extra = `<meta property="article:published_time" content="${esc(post.published_at)}">` +
          (post.tags || []).map((t) => `<meta property="article:tag" content="${esc(t)}">`).join('') +
          (post.tags?.length ? `<meta name="keywords" content="${esc(post.tags.join(', '))}">` : '');
      }
    } else {
      const seo = settings.seo.pages[PAGE_KEYS[path]] || {};
      title = seo.title; description = seo.description;
      if (path === '/over-mij') image = settings.about?.image?.url;
    }
    image = image || settings.seo.image;
    const abs = (u) => (u ? new URL(u, origin).href : '');

    const tags = [
      `<style id="theme-vars">${themeCss(settings.theme)}</style>`,
      description ? `<meta name="description" content="${esc(description)}">` : '',
      `<link rel="canonical" href="${esc(canonical)}">`,
      `<meta property="og:type" content="${type}">`,
      `<meta property="og:url" content="${esc(canonical)}">`,
      title ? `<meta property="og:title" content="${esc(title)}">` : '',
      description ? `<meta property="og:description" content="${esc(description)}">` : '',
      image ? `<meta property="og:image" content="${esc(abs(image))}">` : '',
      post?.image_alt ? `<meta property="og:image:alt" content="${esc(post.image_alt)}">` : '',
      '<meta name="twitter:card" content="summary_large_image">',
      extra,
    ].join('\n');

    if (title) html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
    if (description) html = html.replace(/<meta name="description"[^>]*>\n?/, '');
    html = html.replace('<!--SEO-->', tags);
  } catch (e) {
    console.error('seo edge', e);
  }

  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(html, { status, headers });
};

export const config = {
  path: '/*',
  excludedPath: ['/admin/*', '/js/*', '/css/*', '/img/*', '/vendor/*', '/sitemap.xml', '/robots.txt', '/favicon.ico'],
};
