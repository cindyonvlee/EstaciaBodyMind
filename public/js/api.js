import { SUPABASE_URL, SUPABASE_KEY, MEDIA_BUCKET, isConfigured } from './config.js';
import { DEFAULT_SETTINGS, DEFAULT_POSTS } from './defaults.js';

let _client;
export async function db() {
  if (!isConfigured()) return null;
  if (!_client) {
    const { createClient } = await import('/vendor/supabase.mjs');
    _client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'estacia-auth' } });
  }
  return _client;
}

function mergeSettings(rows) {
  const out = structuredClone(DEFAULT_SETTINGS);
  for (const { key, value } of rows || []) {
    if (!value || typeof value !== 'object') continue;
    if (key === 'seo') {
      out.seo = { ...out.seo, ...value, pages: { ...out.seo.pages } };
      for (const [p, v] of Object.entries(value.pages || {})) out.seo.pages[p] = { ...(out.seo.pages[p] || {}), ...v };
    } else {
      out[key] = { ...(out[key] || {}), ...value };
    }
  }
  return out;
}

let _settings;
export async function getSettings() {
  if (_settings) return _settings;
  const c = await db();
  if (!c) return (_settings = structuredClone(DEFAULT_SETTINGS));
  const { data, error } = await c.from('settings').select('key,value');
  if (error) console.warn('settings', error);
  return (_settings = mergeSettings(data));
}
export function clearSettingsCache() { _settings = null; }

export async function saveSetting(key, value) {
  const c = await db();
  const { error } = await c.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  clearSettingsCache();
}

// ── Nieuws ─────────────────────────────────────────────
export async function getPosts({ limit = 50, includeDrafts = false } = {}) {
  const c = await db();
  if (!c) return DEFAULT_POSTS.slice(0, limit);
  let q = c.from('posts').select('*').order('published_at', { ascending: false }).limit(limit);
  if (!includeDrafts) q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  const { data, error } = await q;
  if (error) { console.warn(error); return []; }
  return data;
}

export async function getPost(slug) {
  const c = await db();
  if (!c) return DEFAULT_POSTS.find((p) => p.slug === slug) || null;
  const { data } = await c.from('posts').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function getPostById(id) {
  const c = await db();
  const { data, error } = await c.from('posts').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function savePost(post) {
  const c = await db();
  const row = { ...post, updated_at: new Date().toISOString() };
  if (!row.id) delete row.id;
  const { data, error } = await c.from('posts').upsert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(id) {
  const c = await db();
  const { error } = await c.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ── Afbeeldingen ───────────────────────────────────────
// Verkleint de foto in de browser (max 1600px, webp) zodat de site snel blijft.
export async function resizeImage(file, max = 1600, quality = 0.84) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  return blob || file;
}

export async function uploadImage(file, nameHint = 'afbeelding') {
  const c = await db();
  const blob = await resizeImage(file);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base = slugify(nameHint || file.name.replace(/\.[^.]+$/, '')) || 'afbeelding';
  const path = `${new Date().getFullYear()}/${base}-${Date.now().toString(36)}.${ext}`;
  const { error } = await c.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' });
  if (error) throw error;
  return c.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ── Berichten ──────────────────────────────────────────
export async function sendMessage(msg) {
  const c = await db();
  if (!c) throw new Error('Database niet ingesteld');
  const { error } = await c.from('messages').insert(msg);
  if (error) throw error;
}
export async function getMessages() {
  const c = await db();
  const { data, error } = await c.from('messages').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data;
}
export async function updateMessage(id, patch) {
  const c = await db();
  const { error } = await c.from('messages').update(patch).eq('id', id);
  if (error) throw error;
}
export async function deleteMessage(id) {
  const c = await db();
  const { error } = await c.from('messages').delete().eq('id', id);
  if (error) throw error;
}

// ── Auth ───────────────────────────────────────────────
export async function getSession() {
  const c = await db();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session;
}

// Snelle check zonder Supabase te laden (voor de "Bewerk"-knop op de site)
export function looksLoggedIn() {
  try { return !!localStorage.getItem('estacia-auth'); } catch { return false; }
}

// ── Hulpjes ────────────────────────────────────────────
export function slugify(str = '') {
  return str.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function esc(str = '') {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}
