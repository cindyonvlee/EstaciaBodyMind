// Vooraf gedefinieerde kleurstijlen. Cindy kiest er één in de admin
// en kan daarna eventueel losse kleuren aanpassen.
export const THEMES = {
  zonsopgang: {
    name: 'Gouden Zonsopgang',
    note: 'Crème, goud en diep pruimpaars – de huidige Estacia-stijl',
    colors: { bg: '#fbf6ee', bgAlt: '#f4e9d8', surface: '#fffdf9', text: '#3a2433', muted: '#7a6470', primary: '#4a2140', primaryInk: '#fff8ee', accent: '#c19a4b', soft: '#ead9e6' },
  },
  lavendel: {
    name: 'Lavendel Avond',
    note: 'Zacht lila met zilvergoud',
    colors: { bg: '#f7f3fa', bgAlt: '#ebe2f3', surface: '#ffffff', text: '#2f2440', muted: '#6c6180', primary: '#5b3a85', primaryInk: '#fbf8ff', accent: '#b89a5e', soft: '#ddd0ec' },
  },
  rozentuin: {
    name: 'Rozentuin',
    note: 'Blush-roze met warm goud',
    colors: { bg: '#fdf5f4', bgAlt: '#f8e4e3', surface: '#fffbfa', text: '#40252b', muted: '#86656b', primary: '#8c3a5a', primaryInk: '#fff7f8', accent: '#c9a052', soft: '#f3d3d9' },
  },
  aarde: {
    name: 'Aarde & Honing',
    note: 'Warm bruin, honinggeel en zand',
    colors: { bg: '#faf5ec', bgAlt: '#efe3cf', surface: '#fffcf6', text: '#3b2a1e', muted: '#7d6a58', primary: '#6b4226', primaryInk: '#fff8ec', accent: '#d4a338', soft: '#ead8bd' },
  },
  maanlicht: {
    name: 'Maanlicht',
    note: 'Donker pruimpaars met gouden accenten',
    colors: { bg: '#241520', bgAlt: '#2f1d2a', surface: '#352230', text: '#f5e9dc', muted: '#c8b2bf', primary: '#e3c27a', primaryInk: '#241520', accent: '#e3c27a', soft: '#4a2f44' },
  },
  zonnebloem: {
    name: 'Zonnebloem',
    note: 'Licht en zonnig geel met aubergine',
    colors: { bg: '#fffaea', bgAlt: '#fbefc8', surface: '#ffffff', text: '#33212e', muted: '#7a6672', primary: '#5a2a4e', primaryInk: '#fffaea', accent: '#e0a91f', soft: '#f6e3a8' },
  },
};

export const COLOR_LABELS = {
  bg: 'Achtergrond',
  bgAlt: 'Achtergrond (afwisselend blok)',
  surface: 'Kaarten / vlakken',
  text: 'Tekst',
  muted: 'Rustige tekst',
  primary: 'Hoofdkleur (knoppen, koppen)',
  primaryInk: 'Tekst op hoofdkleur',
  accent: 'Accent (goud)',
  soft: 'Zachte tint',
};

export function themeCss(theme) {
  const preset = THEMES[theme?.preset] || THEMES.zonsopgang;
  const c = { ...preset.colors, ...(theme?.custom || {}) };
  return `:root{--bg:${c.bg};--bg-alt:${c.bgAlt};--surface:${c.surface};--text:${c.text};--muted:${c.muted};--primary:${c.primary};--primary-ink:${c.primaryInk};--accent:${c.accent};--soft:${c.soft};}`;
}

export function applyTheme(theme) {
  let el = document.getElementById('theme-vars');
  if (!el) { el = document.createElement('style'); el.id = 'theme-vars'; document.head.appendChild(el); }
  el.textContent = themeCss(theme);
  try { localStorage.setItem('estacia-theme-css', el.textContent); } catch {}
}
