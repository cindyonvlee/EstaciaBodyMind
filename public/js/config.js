// ─────────────────────────────────────────────────────────────
//  Estacia Body & Mind Reset – technische configuratie
//  Dit bestand wordt NIET via de admin beheerd.
// ─────────────────────────────────────────────────────────────

// Supabase project → Project Settings → API Keys.
// Gebruik de **Publishable key** (begint met `sb_publishable_...`). Die mag publiek zijn;
// de beveiliging zit in de Row Level Security regels (zie supabase/schema.sql).
// (De oude "anon" key onder "Legacy API keys" werkt ook.)
// ⚠️ NOOIT de Secret key (sb_secret_...) of service_role key hier zetten!
export const SUPABASE_URL = 'https://JOUW-PROJECT.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_JOUW-KEY';

// Opslag-bucket voor afbeeldingen
export const MEDIA_BUCKET = 'media';

// Credit van de websitebouwer – vast in de footer (rechtsonder), niet aanpasbaar in de admin.
export const DEVELOPER = {
  name: 'Jobe United Solutions',
  phoneDisplay: '06-17039432',
  whatsapp: '31617039432',
  whatsappText: 'Hallo, Ik ben op zoek naar een mooie website of iets dergelijks...',
  label: 'Ook zo’n website? Neem contact op met de websitebeheerder',
};

export const isConfigured = () =>
  !SUPABASE_URL.includes('https://cquapjalgqaegzhxdqqj.supabase.co') && !SUPABASE_KEY.includes('sb_publishable_rtF4cxnp5yeB45bNvuZvtA_7-UhGmv2');

if (/^sb_secret_|service_role/.test(SUPABASE_KEY)) {
  console.error('config.js: gebruik de PUBLISHABLE key, niet de secret key!');
}
