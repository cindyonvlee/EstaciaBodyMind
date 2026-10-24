// Hulpjes voor de aanbod-onderdelen en hun eigen pagina (/aanbod/<slug>).
// Wordt gebruikt door de website, de beheeromgeving én de Netlify edge functions,
// dus hier geen browser-specifieke dingen.

const plain = (html = '') => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();

export function slugifyService(str = '') {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// Een onderdeel krijgt pas een eigen pagina als er uitleg in staat.
// Een concept (draft) is alleen te zien met { preview: true } (als Cindy is ingelogd).
export function hasPage(it, { preview = false } = {}) {
  if (!it?.slug) return false;
  if (it.draft && !preview) return false;
  const faq = (it.faq || []).filter((f) => f?.q);
  return !!plain(it.content) || /<img/i.test(it.content || '') || faq.length > 0;
}

export const servicePath = (it) => '/aanbod/' + encodeURIComponent(it.slug);

export function findService(settings, slug) {
  return (settings?.services?.items || []).find((it) => it.slug === slug) || null;
}

// Geeft elk onderdeel een uniek webadres (bestaande adressen blijven staan).
export function ensureSlugs(items = []) {
  const used = new Set();
  return items.map((it) => {
    let base = it.slug || slugifyService(it.title) || 'aanbod';
    let slug = base; let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return { ...it, slug };
  });
}
