// ─────────────────────────────────────────────────────────────
//  Estacia Body & Mind Reset – technische configuratie
//  Dit bestand wordt NIET via de admin beheerd.
// ─────────────────────────────────────────────────────────────

// Supabase project (Project Settings → API). De "anon/public" key mag publiek zijn;
// de beveiliging zit in de Row Level Security regels (zie supabase/schema.sql).
export const SUPABASE_URL = 'https://JOUW-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'JOUW-ANON-PUBLIC-KEY';

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
  !SUPABASE_URL.includes('JOUW-PROJECT') && !SUPABASE_ANON_KEY.includes('JOUW-');
