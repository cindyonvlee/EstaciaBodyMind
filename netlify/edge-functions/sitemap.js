// Netlify Edge Function: /sitemap.xml en /robots.txt (automatisch bijgewerkt met nieuwe verhalen)
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from '../../public/js/config.js';

export default async (request) => {
  const url = new URL(request.url);
  let origin = url.origin;
  let posts = [];
  if (isConfigured()) {
    const h = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
    try {
      const [seo] = await (await fetch(`${SUPABASE_URL}/rest/v1/settings?select=value&key=eq.seo`, { headers: h })).json();
      if (seo?.value?.siteUrl) origin = seo.value.siteUrl.replace(/\/$/, '');
      posts = await (await fetch(`${SUPABASE_URL}/rest/v1/posts?select=slug,updated_at,published_at&status=eq.published&published_at=lte.${encodeURIComponent(new Date().toISOString())}&order=published_at.desc`, { headers: h })).json();
    } catch (e) { console.error(e); }
  }

  if (url.pathname === '/robots.txt') {
    return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const pages = ['/', '/over-mij', '/aanbod', '/nieuws', '/contact', '/privacy'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n')}
${(Array.isArray(posts) ? posts : []).map((p) => `  <url><loc>${origin}/nieuws/${encodeURIComponent(p.slug)}</loc><lastmod>${(p.updated_at || p.published_at || '').slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};

export const config = { path: ['/sitemap.xml', '/robots.txt'] };
