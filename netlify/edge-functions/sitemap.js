// Netlify Edge Function: /sitemap.xml en /robots.txt (automatisch bijgewerkt met nieuwe verhalen)
import { SUPABASE_URL, SUPABASE_KEY, isConfigured } from '../../public/js/config.js';
import { hasPage } from '../../public/js/services.js';

export default async (request) => {
  const url = new URL(request.url);
  let origin = url.origin;
  let posts = [];
  let services = [];
  if (isConfigured()) {
    const h = { apikey: SUPABASE_KEY };
    try {
      const rows = await (await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value&key=in.(seo,services)`, { headers: h })).json();
      const seo = rows.find((r) => r.key === 'seo');
      if (seo?.value?.siteUrl) origin = seo.value.siteUrl.replace(/\/$/, '');
      services = (rows.find((r) => r.key === 'services')?.value?.items || []).filter(hasPage);
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
${services.map((it) => `  <url><loc>${origin}/aanbod/${encodeURIComponent(it.slug)}</loc></url>`).join('\n')}
${(Array.isArray(posts) ? posts : []).map((p) => `  <url><loc>${origin}/nieuws/${encodeURIComponent(p.slug)}</loc><lastmod>${(p.updated_at || p.published_at || '').slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};

export const config = { path: ['/sitemap.xml', '/robots.txt'] };
