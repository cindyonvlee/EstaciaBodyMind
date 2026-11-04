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

// ── Tarieven ───────────────────────────────────────────
// Een onderdeel heeft een lijst `prices: [{ label, price }]`.
// Oude data had één tekstveld `price`, bijv. "30 minuten - 45 euro / 60 minuten - 75 euro / Trajecten".
// Dat wordt hier automatisch opgeknipt in losse regels.
export function parsePriceText(text = '') {
  return String(text).split(/\s*(?:\/|\||\n|;)\s*/).map((part) => part.trim()).filter(Boolean).map((part) => {
    // splits op het laatste streepje of dubbelepunt: "30 minuten - 45 euro" → label "30 minuten", prijs "€ 45"
    const m = part.match(/^(.*\S)\s*(?:[-–—:]|·)\s*(\S.*)$/);
    let label = m ? m[1] : part;
    let price = m ? m[2] : '';
    if (!m && /\d/.test(part) && /€|euro/i.test(part)) { label = ''; price = part; }
    if (m && !/\d|aanvraag|gratis/i.test(price)) { label = part; price = ''; }
    return { label: label.trim(), price: tidyPrice(price) };
  });
}

export function tidyPrice(p = '') {
  const t = String(p).trim();
  const m = t.match(/^(?:€\s*)?(\d+(?:[.,]\d{1,2})?)(?:,-)?\s*(?:euro|eur)?$/i);
  return m ? `€ ${m[1]}` : t;
}

export function servicePrices(it = {}) {
  if (Array.isArray(it.prices) && it.prices.length) return it.prices.filter((p) => p && (p.label || p.price));
  return it.price ? parsePriceText(it.price) : [];
}
