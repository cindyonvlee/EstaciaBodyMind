// ─────────────────────────────────────────────────────────────
//  Estacia – beheeromgeving (admin)
// ─────────────────────────────────────────────────────────────
import {
  db, getSettings, saveSetting, clearSettingsCache, getPosts, getPostById, savePost, deletePost,
  uploadImage, getMessages, updateMessage, deleteMessage, slugify, esc, formatDate,
} from '/js/api.js';
import { isConfigured } from '/js/config.js';
import { THEMES, COLOR_LABELS } from '/js/themes.js';
import { ICONS } from '/js/icons.js';

const DEMO = !isConfigured();
// Embed-modus: de beheerschermen openen in een zijpaneel óp de website (zie /js/site.js → openEditor)
const EMBED = new URLSearchParams(location.search).has('embed');
const tellSite = (msg) => { try { parent.postMessage(msg, location.origin); } catch {} };
if (EMBED) document.documentElement.classList.add('embed');
const initialHash = location.hash;
const app = document.getElementById('app');
let client = null;
let settings = null;
let dirty = false;
let lastHash = location.hash;
let Quill = null;

// ── Hulpjes ────────────────────────────────────────────
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toast(msg, ms = 2800) {
  const el = h(`<div class="toast" role="status">${esc(msg)}</div>`);
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, ms);
}

function markDirty() { dirty = true; }
addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

function goToSite(path) {
  dirty = false;
  if (EMBED) return tellSite({ type: 'estacia-saved', path });
  location.href = path;
}

function closeEmbed() {
  if (dirty && !confirm('Je hebt wijzigingen die nog niet zijn opgeslagen. Toch sluiten?')) return;
  dirty = false;
  tellSite({ type: 'estacia-close' });
}

if (EMBED) {
  // Links naar de website openen in het hoofdvenster, niet in het paneel
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.getAttribute('href').startsWith('#') || a.href.startsWith('mailto:') || a.href.startsWith('tel:')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    if (url.pathname.startsWith('/admin')) return tellSite({ type: 'estacia-open-admin', path: url.pathname + url.hash });
    goToSite(url.pathname + url.search + url.hash);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeEmbed(); });
}

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); } catch {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
}

function errText(e) {
  if (e?.code === '23505') return 'Deze webadres (URL) bestaat al. Kies een andere URL.';
  if (/JWT|session|auth/i.test(e?.message || '')) return 'Je bent uitgelogd. Log opnieuw in.';
  return e?.message || 'Er ging iets mis.';
}

// ── Opstarten ──────────────────────────────────────────
async function boot() {
  Quill = (await import('/vendor/quill.mjs')).default;
  if (DEMO) { settings = await getSettings(); return route(); }
  client = await db();
  client.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') renderNewPassword();
    if (event === 'SIGNED_OUT') renderLogin();
  });
  const { data } = await client.auth.getSession();
  if (initialHash.includes('type=recovery') && data.session) return renderNewPassword();
  if (!data.session) return renderLogin();
  settings = await getSettings();
  route();
}

// ── Inloggen ───────────────────────────────────────────
function renderLogin(msg = '') {
  app.innerHTML = `
  <div class="login"><div class="box">
    <h1>Estacia</h1>
    <p style="color:var(--muted);margin:0">Welkom terug! Log in om je website te beheren.</p>
    <form id="lf">
      ${msg}
      <div class="f"><label for="em">E-mailadres</label><input type="email" id="em" autocomplete="username" required></div>
      <div class="f"><label for="pw">Wachtwoord</label><input type="password" id="pw" autocomplete="current-password" required></div>
      <button class="btn" type="submit">Inloggen</button>
      <p style="text-align:center;margin:16px 0 0"><a href="#" id="forgot">Wachtwoord vergeten?</a></p>
      ${EMBED ? '<p style="text-align:center;margin:8px 0 0"><a href="#" id="xclose">Sluiten</a></p>' : '<p style="text-align:center;margin:8px 0 0"><a href="/">← Terug naar de website</a></p>'}
    </form>
  </div></div>`;
  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#lf button'); btn.disabled = true; btn.textContent = 'Bezig…';
    const { error } = await client.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    if (error) return renderLogin('<div class="err">Inloggen lukte niet. Controleer je e-mailadres en wachtwoord.</div>');
    settings = await getSettings();
    if (EMBED) tellSite({ type: 'estacia-login' });
    if (!EMBED) location.hash = '#/';
    route();
  });
  $('#xclose')?.addEventListener('click', (e) => { e.preventDefault(); closeEmbed(); });
  $('#forgot').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = $('#em').value.trim();
    if (!email) return renderLogin('<div class="err">Vul eerst je e-mailadres in en klik dan nog een keer op “Wachtwoord vergeten?”.</div>');
    await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin/' });
    renderLogin('<div class="okmsg">Check je mail: je hebt een link ontvangen om een nieuw wachtwoord in te stellen.</div>');
  });
}

function renderNewPassword() {
  app.innerHTML = `
  <div class="login"><div class="box">
    <h1>Nieuw wachtwoord</h1>
    <form id="np">
      <div class="f"><label for="p1">Nieuw wachtwoord</label><input type="password" id="p1" minlength="8" autocomplete="new-password" required><div class="help">Minimaal 8 tekens.</div></div>
      <button class="btn" type="submit">Opslaan</button>
    </form>
  </div></div>`;
  $('#np').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await client.auth.updateUser({ password: $('#p1').value });
    if (error) return toast(error.message);
    history.replaceState(null, '', '/admin/#/');
    settings = await getSettings();
    toast('Wachtwoord opgeslagen');
    route();
  });
}

// ── Router ─────────────────────────────────────────────
addEventListener('hashchange', () => {
  if (location.hash.startsWith('#access_token') || location.hash.includes('type=recovery')) return;
  if (dirty && !confirm('Je hebt wijzigingen die nog niet zijn opgeslagen. Toch weggaan?')) {
    history.replaceState(null, '', lastHash || '#/');
    return;
  }
  dirty = false;
  route();
});

const NAV = [
  ['#/', '🏠', 'Overzicht'],
  ['#/nieuws', '📝', 'Blog & nieuws'],
  ['#/paginas', '📄', 'Pagina’s'],
  ['#/stijl', '🎨', 'Kleuren & stijl'],
  ['#/berichten', '💌', 'Berichten'],
  ['#/instellingen', '⚙️', 'Instellingen'],
  ['#/hulp', '❓', 'Hulp'],
];

async function embedShell(contentFn) {
  app.innerHTML = `
  <div class="embedbar"><span class="t">✨ Bewerken</span><a class="btn sm ghost" href="/admin/">Volledig beheer</a><button type="button" class="btn sm" id="xclose">✕ Sluiten</button></div>
  <main class="main embed-main" id="view">
    ${DEMO ? '<div class="err" style="font-weight:600">Demo-modus: wijzigingen worden niet opgeslagen.</div>' : ''}
  </main>`;
  $('#xclose').addEventListener('click', closeEmbed);
  await contentFn($('#view'));
  lastHash = location.hash;
  scrollTo(0, 0);
}

async function shell(contentFn) {
  if (EMBED) return embedShell(contentFn);
  const hash = location.hash || '#/';
  const unread = await unreadCount();
  app.innerHTML = `
  <div class="topbar"><span class="t">ESTACIA</span><a href="/">Naar website</a><button id="mnu" aria-expanded="false">Menu</button></div>
  <div class="shell">
    <nav class="side" id="side" aria-label="Beheer">
      <a class="logo" href="#/">ESTACIA<small>Beheer</small></a>
      ${NAV.map(([href, ic, label]) => {
        const on = href === '#/' ? hash === '#/' || hash === '' : hash.startsWith(href) || (href === '#/paginas' && hash.startsWith('#/pagina/'));
        return `<a class="nav ${on ? 'on' : ''}" href="${href}"><span>${ic}</span>${label}${href === '#/berichten' && unread ? `<span class="badge">${unread}</span>` : ''}</a>`;
      }).join('')}
      <div class="grow"></div>
      <a class="nav site-link" href="/">← Naar mijn website</a>
      ${DEMO ? '' : '<a class="nav" href="#" id="logout">Uitloggen</a>'}
    </nav>
    <main class="main" id="view">
      ${DEMO ? '<div class="err" style="font-weight:600">Demo-modus: Supabase is nog niet ingesteld in <code>js/config.js</code>. Wijzigingen worden niet opgeslagen.</div>' : ''}
    </main>
  </div>`;
  $('#mnu').addEventListener('click', () => $('#side').classList.toggle('open'));
  $$('#side a').forEach((a) => a.addEventListener('click', () => $('#side').classList.remove('open')));
  $('#logout')?.addEventListener('click', async (e) => { e.preventDefault(); await client.auth.signOut(); location.href = '/'; });
  await contentFn($('#view'));
  lastHash = location.hash;
  scrollTo(0, 0);
}

async function unreadCount() {
  if (DEMO) return 0;
  const { count } = await client.from('messages').select('id', { count: 'exact', head: true }).eq('read', false);
  return count || 0;
}

function route() {
  const p = (location.hash || '#/').slice(1).split('/').filter(Boolean);
  if (!p.length) return shell(viewDashboard);
  if (p[0] === 'nieuws' && p[1]) return shell((v) => viewPostEditor(v, p[1] === 'nieuw' ? null : p[1]));
  if (p[0] === 'nieuws') return shell(viewNews);
  if (p[0] === 'paginas') return shell(viewPages);
  if (p[0] === 'pagina' && SCHEMAS[p[1]]) return shell((v) => viewPageEditor(v, p[1]));
  if (p[0] === 'stijl') return shell(viewTheme);
  if (p[0] === 'berichten') return shell(viewMessages);
  if (p[0] === 'instellingen') return shell(viewSettings);
  if (p[0] === 'hulp') return shell(viewHelp);
  return shell(viewDashboard);
}

// ── Overzicht ──────────────────────────────────────────
async function viewDashboard(v) {
  const unread = await unreadCount();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  v.insertAdjacentHTML('beforeend', `
  <div class="head"><div><h1>${greet} Cindy 🤍</h1><p>Wat wil je vandaag doen?</p></div></div>
  <div class="tiles">
    <a class="tile primary" href="#/nieuws/nieuw"><span class="em">✍️</span><strong>Nieuw verhaal schrijven</strong><span>Plaats een blog of nieuwsbericht</span></a>
    <a class="tile" href="#/nieuws"><span class="em">📝</span><strong>Mijn verhalen</strong><span>Bewerken, delen of verwijderen</span></a>
    <a class="tile" href="#/berichten"><span class="em">💌</span><strong>Berichten ${unread ? `<span class="badge">${unread} nieuw</span>` : ''}</strong><span>Wat mensen via het contactformulier stuurden</span></a>
    <a class="tile" href="#/pagina/home"><span class="em">🏠</span><strong>Homepagina aanpassen</strong><span>Teksten en foto bovenaan</span></a>
    <a class="tile" href="#/pagina/contact"><span class="em">📞</span><strong>Contactgegevens</strong><span>Telefoon, WhatsApp, adres, socials</span></a>
    <a class="tile" href="#/pagina/aanbod"><span class="em">🌸</span><strong>Aanbod & prijzen</strong><span>Wat je aanbiedt</span></a>
    <a class="tile" href="#/stijl"><span class="em">🎨</span><strong>Kleuren & stijl</strong><span>Kies een sfeer voor je website</span></a>
    <a class="tile" href="#/hulp"><span class="em">❓</span><strong>Hulp</strong><span>Korte uitleg over alles</span></a>
  </div>`);
}

// ── Nieuws: lijst ──────────────────────────────────────
function postStatus(p) {
  if (p.status !== 'published') return '<span class="pill draft">Concept</span>';
  if (new Date(p.published_at) > new Date()) return `<span class="pill plan">Gepland · ${formatDate(p.published_at)}</span>`;
  return '<span class="pill pub">Online</span>';
}

function shareButtons(p) {
  const url = `${location.origin}/nieuws/${p.slug}`;
  return `
    <a class="btn sm fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
    <a class="btn sm wa" href="https://wa.me/?text=${encodeURIComponent(`${p.title}\n${url}`)}" target="_blank" rel="noopener">WhatsApp</a>
    <button class="btn sm ig" type="button" data-ig="${esc(p.id)}">Instagram</button>`;
}

async function instagramShare(p) {
  const url = `${location.origin}/nieuws/${p.slug}`;
  const caption = `${p.title}\n\n${p.excerpt || ''}\n\nLees het hele verhaal via de link in mijn bio of op ${url.replace(/^https?:\/\//, '')}\n\n${(p.tags || []).map((t) => '#' + t.replace(/\s+/g, '')).join(' ')} #estacia #bodyandmindreset`;
  // Op de telefoon: deelmenu met foto + tekst; op de computer: tekst kopiëren + foto downloaden
  try {
    if (navigator.canShare && p.image_url) {
      const blob = await (await fetch(p.image_url)).blob();
      const file = new File([blob], `${p.slug}.${(blob.type.split('/')[1] || 'jpg')}`, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await copyText(caption);
        toast('Tekst gekopieerd – plak hem in Instagram');
        await navigator.share({ files: [file], text: caption });
        return;
      }
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  await copyText(caption);
  if (p.image_url) {
    const a = document.createElement('a');
    a.href = p.image_url; a.download = p.slug; a.target = '_blank';
    document.body.appendChild(a); a.click(); a.remove();
  }
  toast('Tekst gekopieerd en foto gedownload. Open Instagram, kies de foto en plak de tekst.', 5000);
}

async function viewNews(v) {
  const posts = await getPosts({ includeDrafts: true, limit: 500 });
  v.insertAdjacentHTML('beforeend', `
  <div class="head"><div><h1>Blog & nieuws</h1><p>${posts.length} verhalen</p></div><a class="btn" href="#/nieuws/nieuw">✍️ Nieuw verhaal</a></div>
  <div class="list">
    ${posts.length ? posts.map((p) => `
      <div class="item">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="">` : '<div class="noimg"></div>'}
        <div>
          <h3>${esc(p.title)}</h3>
          <div class="meta">${postStatus(p)}<span>${formatDate(p.published_at)}</span><span>/nieuws/${esc(p.slug)}</span></div>
          <div class="btns">
            <a class="btn sm" href="#/nieuws/${esc(p.id)}">Bewerken</a>
            <a class="btn sm ghost" href="/nieuws/${esc(p.slug)}">Bekijken</a>
            ${p.status === 'published' ? shareButtons(p) : ''}
            <button class="btn sm danger" type="button" data-del="${esc(p.id)}">Verwijderen</button>
          </div>
        </div>
      </div>`).join('') : '<div class="panel empty">Nog geen verhalen. Klik op “Nieuw verhaal” om te beginnen.</div>'}
  </div>`);
  v.addEventListener('click', async (e) => {
    const ig = e.target.closest('[data-ig]');
    if (ig) return instagramShare(posts.find((p) => String(p.id) === ig.dataset.ig));
    const del = e.target.closest('[data-del]');
    if (del) {
      const p = posts.find((x) => String(x.id) === del.dataset.del);
      if (!confirm(`Weet je zeker dat je “${p.title}” wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
      if (DEMO) return toast('Demo: niet verwijderd');
      try { await deletePost(p.id); toast('Verwijderd'); route(); } catch (err) { toast(errText(err)); }
    }
  });
}

// ── Componenten ────────────────────────────────────────
function textField(label, value = '', { type = 'text', help = '', multiline = false, cls = '', placeholder = '', max = 0 } = {}) {
  const id = 'f' + Math.random().toString(36).slice(2, 8);
  const el = h(`<div class="f">
    <label for="${id}">${esc(label)}${max ? `<span class="counter"></span>` : ''}</label>
    ${multiline ? `<textarea id="${id}" placeholder="${esc(placeholder)}"></textarea>` : `<input id="${id}" type="${type}" class="${cls}" placeholder="${esc(placeholder)}">`}
    ${help ? `<div class="help">${help}</div>` : ''}
  </div>`);
  const input = $('input,textarea', el);
  input.value = value ?? '';
  const counter = $('.counter', el);
  const upd = () => {
    if (!counter) return;
    const n = (input.value || input.placeholder).length;
    counter.textContent = `${n}/${max}`;
    counter.className = 'counter' + (n > max ? ' bad' : n > max * 0.9 ? ' warn' : '');
  };
  input.addEventListener('input', () => { markDirty(); upd(); }); upd();
  return { el, input, get: () => input.value.trim(), set: (v) => { input.value = v; upd(); }, refresh: upd };
}

function richField(label, html = '', { small = false, help = '' } = {}) {
  const el = h(`<div class="f ${small ? 'rich-sm' : ''}"><span class="lbl">${esc(label)}</span><div class="rq"></div>${help ? `<div class="help">${help}</div>` : ''}</div>`);
  const quill = new Quill($('.rq', el), {
    theme: 'snow',
    placeholder: 'Begin hier met schrijven…',
    modules: {
      toolbar: {
        container: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link', 'image'], ['clean']],
        handlers: {
          image() {
            pickFile(async (file) => {
              const range = quill.getSelection(true);
              toast('Foto uploaden…');
              try {
                const url = DEMO ? URL.createObjectURL(file) : await uploadImage(file, 'blog');
                quill.insertEmbed(range.index, 'image', url, 'user');
              } catch (e) { toast(errText(e)); }
            });
          },
        },
      },
    },
  });
  if (html) quill.clipboard.dangerouslyPasteHTML(html, 'silent');
  quill.on('text-change', (_, __, src) => { if (src === 'user') markDirty(); });
  return {
    el, quill,
    get: () => {
      if (quill.getText().trim() === '' && !quill.root.querySelector('img')) return '';
      return quill.getSemanticHTML().replace(/&nbsp;/g, ' ');
    },
  };
}

function pickFile(cb) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.addEventListener('change', () => inp.files[0] && cb(inp.files[0]));
  inp.click();
}

function imageField(label, img = {}, { nameHint = () => 'foto', help = '' } = {}) {
  let url = img?.url || '';
  const el = h(`<div class="f"><span class="lbl">${esc(label)}</span>
    <div class="imgpick">
      <div class="prev" tabindex="0" role="button" aria-label="Kies een foto">Klik om een foto te kiezen</div>
      <div>
        <div class="btns" style="margin-bottom:12px"><button type="button" class="btn sm" data-a="pick">📷 Kies foto</button><button type="button" class="btn sm danger" data-a="rm">Weghalen</button></div>
        <div class="f"><label>Omschrijving van de foto (alt-tekst)</label><input type="text" data-k="alt" placeholder="Bijv. Cindy glimlachend tussen paarse bloemen"><div class="help">Wat is er te zien? Belangrijk voor Google en voor mensen die slecht zien.</div></div>
        <div class="f" style="margin:0"><label>Titel van de foto</label><input type="text" data-k="title" placeholder="Korte titel"></div>
      </div>
    </div>${help ? `<div class="help">${help}</div>` : ''}</div>`);
  const prev = $('.prev', el);
  const alt = $('[data-k=alt]', el); alt.value = img?.alt || '';
  const title = $('[data-k=title]', el); title.value = img?.title || '';
  const show = () => { prev.style.backgroundImage = url ? `url("${url}")` : ''; prev.classList.toggle('has', !!url); };
  const choose = () => pickFile(async (file) => {
    prev.textContent = 'Uploaden…'; prev.classList.remove('has');
    try {
      url = DEMO ? URL.createObjectURL(file) : await uploadImage(file, title.value || nameHint());
      markDirty(); show(); prev.textContent = 'Klik om een andere foto te kiezen';
      if (!title.value) title.value = nameHint();
      alt.focus();
    } catch (e) { toast(errText(e)); prev.textContent = 'Uploaden mislukt – probeer opnieuw'; }
  });
  prev.addEventListener('click', choose);
  prev.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
  $('[data-a=pick]', el).addEventListener('click', choose);
  $('[data-a=rm]', el).addEventListener('click', () => { url = ''; markDirty(); show(); prev.textContent = 'Klik om een foto te kiezen'; });
  [alt, title].forEach((i) => i.addEventListener('input', markDirty));
  show();
  return { el, get: () => ({ url, alt: alt.value.trim(), title: title.value.trim() }) };
}

function tagsField(label, tags = []) {
  let list = [...(tags || [])];
  const el = h(`<div class="f"><label>${esc(label)}</label><div class="chips"></div><div class="help">Typ een onderwerp en druk op Enter of komma. Bijv. “loslaten”, “dankbaarheid”.</div></div>`);
  const box = $('.chips', el);
  const input = h('<input type="text" aria-label="Nieuw onderwerp" placeholder="Onderwerp toevoegen…">');
  const draw = () => {
    $$('.chip', box).forEach((c) => c.remove());
    list.forEach((t, i) => {
      const c = h(`<span class="chip">${esc(t)}<button type="button" aria-label="Verwijder ${esc(t)}">×</button></span>`);
      $('button', c).addEventListener('click', () => { list.splice(i, 1); markDirty(); draw(); });
      box.insertBefore(c, input);
    });
  };
  const add = () => {
    input.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).forEach((t) => { if (!list.includes(t)) list.push(t); });
    input.value = ''; markDirty(); draw();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input.value && list.length) { list.pop(); draw(); }
  });
  input.addEventListener('blur', () => input.value && add());
  box.appendChild(input); draw();
  return { el, get: () => { if (input.value) add(); return list; } };
}

function linesField(label, arr = [], help = '') {
  const f = textField(label, (arr || []).join('\n'), { multiline: true, help });
  return { el: f.el, get: () => f.get().split('\n').map((s) => s.trim()).filter(Boolean) };
}

function servicesField(items = []) {
  let list = structuredClone(items || []);
  const el = h('<div><div class="reps"></div><button type="button" class="btn ghost" data-add>+ Onderdeel toevoegen</button></div>');
  const wrap = $('.reps', el);
  const read = () => $$('.rep', wrap).map((r) => ({
    icon: $('input[type=radio]:checked', r)?.value || 'lotus',
    title: $('[data-k=title]', r).value.trim(),
    text: $('[data-k=text]', r).value.trim(),
    price: $('[data-k=price]', r).value.trim(),
  }));
  const draw = () => {
    wrap.innerHTML = '';
    list.forEach((it, i) => {
      const name = 'ic' + Math.random().toString(36).slice(2, 7);
      const r = h(`<div class="rep">
        <div class="rep-head"><strong>Onderdeel ${i + 1}</strong>
          <div class="btns"><button type="button" class="btn sm ghost" data-up ${i === 0 ? 'disabled' : ''} aria-label="Omhoog">↑</button><button type="button" class="btn sm ghost" data-down ${i === list.length - 1 ? 'disabled' : ''} aria-label="Omlaag">↓</button><button type="button" class="btn sm danger" data-rm>Verwijderen</button></div></div>
        <div class="f"><span class="lbl">Icoon</span><div class="icons">${Object.entries(ICONS).map(([k, svg]) => `<label title="${k}"><input type="radio" name="${name}" value="${k}" ${it.icon === k ? 'checked' : ''}><span>${svg}</span></label>`).join('')}</div></div>
        <div class="grid2"><div class="f"><label>Titel</label><input type="text" data-k="title"></div><div class="f"><label>Prijs / duur (mag leeg)</label><input type="text" data-k="price" placeholder="Bijv. € 75 · 60 minuten"></div></div>
        <div class="f" style="margin:0"><label>Korte omschrijving</label><textarea data-k="text" style="min-height:80px"></textarea></div>
      </div>`);
      $('[data-k=title]', r).value = it.title || '';
      $('[data-k=price]', r).value = it.price || '';
      $('[data-k=text]', r).value = it.text || '';
      r.addEventListener('input', markDirty);
      r.addEventListener('change', markDirty);
      $('[data-rm]', r).addEventListener('click', () => { if (confirm('Dit onderdeel verwijderen?')) { list = read(); list.splice(i, 1); markDirty(); draw(); } });
      $('[data-up]', r).addEventListener('click', () => { list = read(); [list[i - 1], list[i]] = [list[i], list[i - 1]]; markDirty(); draw(); });
      $('[data-down]', r).addEventListener('click', () => { list = read(); [list[i + 1], list[i]] = [list[i], list[i + 1]]; markDirty(); draw(); });
      wrap.appendChild(r);
    });
  };
  $('[data-add]', el).addEventListener('click', () => { list = read(); list.push({ icon: 'lotus', title: '', text: '', price: '' }); markDirty(); draw(); $$('.rep [data-k=title]', wrap).pop()?.focus(); });
  draw();
  return { el, get: () => read().filter((x) => x.title) };
}

// SEO-blok met tellers en voorbeeld van Google & Facebook
function seoPanel({ title = '', description = '' }, { fallbackTitle, fallbackDesc, path, image }) {
  const el = h(`<div class="panel"><h2>🔎 Vindbaarheid (SEO)</h2><p class="hint">Zo verschijnt deze pagina in Google en als je hem deelt. Laat leeg om automatisch de titel en samenvatting te gebruiken.</p></div>`);
  const t = textField('Titel voor Google', title, { max: 60, placeholder: fallbackTitle() });
  const d = textField('Omschrijving voor Google', description, { multiline: true, max: 160, placeholder: fallbackDesc() });
  d.input.style.minHeight = '90px';
  const prev = h(`<div><div class="f"><span class="lbl">Voorbeeld in Google</span><div class="gprev"><div class="u"></div><div class="t"></div><div class="d"></div></div></div>
    <div class="f" style="margin:0"><span class="lbl">Voorbeeld op Facebook / WhatsApp</span><div class="fbprev"><div class="im"></div><div class="tx"><div class="u"></div><div class="t"></div><div class="d"></div></div></div></div></div>`);
  el.append(t.el, d.el, prev);
  const upd = () => {
    t.input.placeholder = fallbackTitle(); d.input.placeholder = fallbackDesc(); t.refresh(); d.refresh();
    const tt = t.get() || fallbackTitle(); const dd = d.get() || fallbackDesc();
    const host = location.host;
    $('.gprev .u', prev).textContent = host + path();
    $('.gprev .t', prev).textContent = tt.length > 62 ? tt.slice(0, 60) + '…' : tt;
    $('.gprev .d', prev).textContent = dd.length > 160 ? dd.slice(0, 158) + '…' : dd;
    $('.fbprev .u', prev).textContent = host;
    $('.fbprev .t', prev).textContent = tt;
    $('.fbprev .d', prev).textContent = dd;
    const img = image();
    $('.fbprev .im', prev).style.backgroundImage = img ? `url("${img}")` : '';
    $('.fbprev .im', prev).style.display = img ? '' : 'none';
  };
  el.addEventListener('input', upd);
  upd();
  return { el, update: upd, get: () => ({ title: t.get(), description: d.get() }) };
}

function saveBar(buttons) {
  const el = h(`<div class="savebar"><span class="status">${DEMO ? 'Demo-modus' : 'Vergeet niet op te slaan'}</span></div>`);
  buttons.forEach((b) => el.appendChild(b));
  return el;
}
const button = (label, cls, onClick) => { const b = h(`<button type="button" class="btn ${cls}">${label}</button>`); b.addEventListener('click', () => onClick(b)); return b; };

async function busy(btn, fn) {
  const txt = btn.innerHTML; btn.disabled = true; btn.textContent = 'Opslaan…';
  try { await fn(); } catch (e) { console.error(e); toast(errText(e), 5000); } finally { btn.disabled = false; btn.innerHTML = txt; }
}

// ── Nieuws: bewerken ───────────────────────────────────
function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

async function viewPostEditor(v, id) {
  let post = {
    title: '', slug: '', excerpt: '', content: '', image_url: '', image_alt: '', image_title: '',
    seo_title: '', seo_description: '', tags: [], status: 'published', published_at: new Date().toISOString(),
  };
  if (id) {
    try { post = DEMO ? (await getPosts({ includeDrafts: true })).find((p) => p.id === id) : await getPostById(id); }
    catch { v.insertAdjacentHTML('beforeend', '<div class="panel empty">Dit verhaal is niet gevonden.</div>'); return; }
  }
  let slugTouched = !!post.slug;

  v.insertAdjacentHTML('beforeend', `<a class="crumb" href="#/nieuws">← Alle verhalen</a>
    <div class="head"><h1>${id ? 'Verhaal bewerken' : 'Nieuw verhaal'}</h1></div>
    <div class="editor-grid"><div class="col-main"></div><aside class="col-side"></aside></div>`);
  const main = $('.col-main', v); const side = $('.col-side', v);

  // Hoofdkolom
  const pMain = h('<div class="panel"></div>');
  const title = textField('Titel', post.title, { cls: 'big', placeholder: 'Bijv. Het is goed genoeg, hier en nu' });
  const slugEl = h(`<div class="f"><label>Webadres (URL)</label><div class="slug"><span>${esc(location.host)}/nieuws/</span><input type="text" aria-label="URL"></div><div class="help">Wordt automatisch gemaakt van de titel. Liever niet meer wijzigen als het verhaal al gedeeld is.</div></div>`);
  const slugInput = $('input', slugEl); slugInput.value = post.slug;
  const excerpt = textField('Korte samenvatting', post.excerpt, { multiline: true, help: 'Eén of twee zinnen. Wordt getoond in het overzicht en bij het delen.' });
  excerpt.input.style.minHeight = '80px';
  pMain.append(title.el, slugEl, excerpt.el);
  const content = richField('Verhaal', post.content);
  const pContent = h('<div class="panel"></div>'); pContent.append(content.el);
  const tags = tagsField('Onderwerpen (tags)', post.tags);
  pContent.append(tags.el);
  main.append(pMain, pContent);

  title.input.addEventListener('input', () => { if (!slugTouched) slugInput.value = slugify(title.input.value); seo.update(); });
  slugInput.addEventListener('input', () => { slugTouched = true; markDirty(); seo.update(); });
  slugInput.addEventListener('blur', () => { slugInput.value = slugify(slugInput.value); });
  excerpt.input.addEventListener('input', () => seo.update());

  // Zijkolom
  const pPub = h(`<div class="panel"><h2>📅 Publiceren</h2>
    <div class="f"><label for="st">Status</label><select id="st"><option value="published">Gepubliceerd (zichtbaar)</option><option value="draft">Concept (alleen voor mij)</option></select></div>
    <div class="f" style="margin:0"><label for="dt">Datum</label><input type="datetime-local" id="dt"><div class="help">Zet je een datum in de toekomst, dan verschijnt het verhaal pas op dat moment.</div></div></div>`);
  $('#st', pPub).value = post.status; $('#dt', pPub).value = toLocalInput(post.published_at);
  pPub.addEventListener('change', markDirty);
  const pImg = h('<div class="panel"><h2>🖼️ Uitgelichte foto</h2><p class="hint">Deze foto staat bovenaan het verhaal en wordt getoond bij delen op Facebook en WhatsApp. Vierkant werkt het mooist.</p></div>');
  const img = imageField('Foto', { url: post.image_url, alt: post.image_alt, title: post.image_title }, { nameHint: () => title.get() || 'blog' });
  pImg.append(img.el);
  pImg.addEventListener('click', () => setTimeout(() => seo.update(), 50));
  const seo = seoPanel({ title: post.seo_title, description: post.seo_description }, {
    fallbackTitle: () => (title.get() || 'Titel van je verhaal') + ' | Estacia',
    fallbackDesc: () => excerpt.get() || 'Korte samenvatting van je verhaal…',
    path: () => '/nieuws/' + (slugInput.value || slugify(title.get())),
    image: () => img.get().url,
  });
  side.append(pPub, pImg, seo.el);
  if (id && post.status === 'published') {
    const pShare = h(`<div class="panel"><h2>📣 Delen</h2><p class="hint">Deel dit verhaal direct.</p><div class="btns">${shareButtons(post)}</div></div>`);
    $('[data-ig]', pShare).addEventListener('click', () => instagramShare(post));
    side.append(pShare);
  }

  const collect = () => {
    const im = img.get();
    if (!title.get()) { title.input.focus(); throw new Error('Geef je verhaal eerst een titel.'); }
    const slug = slugify(slugInput.value || title.get());
    slugInput.value = slug;
    const s = seo.get();
    return {
      ...(id ? { id } : {}),
      title: title.get(), slug, excerpt: excerpt.get(), content: content.get(),
      image_url: im.url, image_alt: im.alt || (im.url ? title.get() : ''), image_title: im.title,
      seo_title: s.title, seo_description: s.description, tags: tags.get(),
      status: $('#st', pPub).value, published_at: new Date($('#dt', pPub).value || Date.now()).toISOString(),
    };
  };
  const doSave = async (view) => {
    const row = collect();
    if (DEMO) { dirty = false; toast('Demo: niet opgeslagen'); return; }
    const saved = await savePost(row);
    dirty = false;
    if (view) return goToSite('/nieuws/' + saved.slug);
    toast('Opgeslagen ✓');
    if (!id) { history.replaceState(null, '', '#/nieuws/' + saved.id); route(); }
  };
  v.append(saveBar([
    button('Opslaan & bekijken', '', (b) => busy(b, () => doSave(true))),
    button('Alleen opslaan', 'ghost', (b) => busy(b, () => doSave(false))),
    ...(id ? [button('Verwijderen', 'danger', (b) => busy(b, async () => {
      if (!confirm(`Weet je zeker dat je “${post.title}” wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
      if (DEMO) return toast('Demo: niet verwijderd');
      await deletePost(id);
      dirty = false;
      if (EMBED) return goToSite('/nieuws');
      toast('Verwijderd'); location.hash = '#/nieuws';
    }))] : []),
  ]));
  if (!id) title.input.focus();
}

// ── Pagina's ───────────────────────────────────────────
const SCHEMAS = {
  home: {
    label: 'Homepagina', key: 'home', view: '/', seo: 'home', panels: [
      { title: '✨ Bovenaan de pagina', fields: [
        ['heroEyebrow', 'Klein kopje boven de titel', 'text'],
        ['heroTitle', 'Grote titel', 'text'],
        ['heroScript', 'Sierlijke tekst (in sierletters)', 'text'],
        ['heroText', 'Introductietekst', 'textarea'],
        ['heroImage', 'Foto', 'image'],
        ['ctaPrimary', 'Tekst op de hoofdknop (naar contact)', 'text'],
        ['ctaSecondary', 'Tekst op de tweede knop (naar over mij)', 'text'],
      ] },
      { title: '🤍 Introductie', fields: [['introTitle', 'Kop', 'text'], ['introText', 'Tekst', 'rich-sm']] },
      { title: '🌀 De Creatiespiraal', hint: 'Laat de stappen leeg om dit blok te verbergen.', fields: [['spiralTitle', 'Kop', 'text'], ['spiral', 'Stappen (één per regel)', 'lines']] },
      { title: '💬 Quote', hint: 'Laat de quote leeg om dit blok te verbergen.', fields: [['quote', 'Quote', 'textarea'], ['quoteSub', 'Tweede regel (in sierletters)', 'text']] },
      { title: '📝 Blog-blok', fields: [['newsTitle', 'Kop boven je laatste verhalen', 'text']] },
    ],
  },
  over: {
    label: 'Over mij', key: 'about', view: '/over-mij', seo: 'over', panels: [
      { title: '🌸 Over mij', fields: [['title', 'Klein kopje', 'text'], ['script', 'Grote titel (sierletters)', 'text'], ['image', 'Foto', 'image'], ['content', 'Je verhaal', 'rich']] },
    ],
  },
  aanbod: {
    label: 'Aanbod', key: 'services', view: '/aanbod', seo: 'aanbod', panels: [
      { title: '🌸 Aanbod', fields: [['title', 'Titel', 'text'], ['intro', 'Introductie', 'textarea']] },
      { title: '📋 Onderdelen', hint: 'De eerste 4 worden ook op de homepagina getoond.', fields: [['items', '', 'services']] },
      { title: '👉 Onderaan', fields: [['ctaText', 'Tekst bij de contactknop', 'textarea']] },
    ],
  },
  contact: {
    label: 'Contact', key: 'contact', view: '/contact', seo: 'contact', panels: [
      { title: '📞 Contactgegevens', hint: 'Deze gegevens staan op de contactpagina, onderaan elke pagina én in de belknoppen op de telefoon. Laat een veld leeg om het te verbergen.', fields: [
        ['phone', 'Telefoonnummer (zoals mensen het zien)', 'text', 'Bijv. +31 6 53546242'],
        ['whatsapp', 'WhatsApp-nummer', 'text', 'Alleen cijfers, beginnend met 31 en zonder de 0. Bijv. 31653546242'],
        ['whatsappText', 'Begintekst van een WhatsApp-bericht', 'text', 'Deze tekst staat alvast klaar als iemand op de WhatsApp-knop drukt.'],
        ['email', 'E-mailadres', 'text'],
        ['address', 'Adres', 'textarea'],
        ['mapsUrl', 'Link naar Google Maps', 'text'],
        ['hours', 'Openingstijden / beschikbaarheid', 'textarea'],
      ] },
      { title: '📱 Social media', fields: [['facebook', 'Facebook-pagina (link)', 'text'], ['instagram', 'Instagram (link)', 'text']] },
      { title: '✉️ Pagina & formulier', fields: [['title', 'Titel', 'text'], ['intro', 'Introductie', 'textarea'], ['formIntro', 'Tekst boven het formulier', 'textarea'], ['thankYou', 'Bedankt-tekst na versturen', 'textarea']] },
    ],
  },
  privacy: {
    label: 'Privacy', key: 'privacy', view: '/privacy', seo: 'privacy', panels: [
      { title: '🔒 Privacyverklaring', fields: [['title', 'Titel', 'text'], ['content', 'Tekst', 'rich']] },
    ],
  },
};

async function viewPages(v) {
  v.insertAdjacentHTML('beforeend', `<div class="head"><div><h1>Pagina’s</h1><p>Kies welke pagina je wilt aanpassen.</p></div></div>
  <div class="tiles">
    ${Object.entries(SCHEMAS).map(([k, s]) => `<a class="tile" href="#/pagina/${k}"><strong>${esc(s.label)}</strong><span>${esc(location.host + s.view)}</span></a>`).join('')}
    <a class="tile" href="#/nieuws"><strong>Blog & nieuws</strong><span>Verhalen schrijven en beheren</span></a>
  </div>`);
}

async function viewPageEditor(v, name) {
  const schema = SCHEMAS[name];
  const data = structuredClone(settings[schema.key] || {});
  v.insertAdjacentHTML('beforeend', `<a class="crumb" href="#/paginas">← Pagina’s</a><div class="head"><div><h1>${esc(schema.label)}</h1><p>${esc(location.host + schema.view)}</p></div><a class="btn ghost" href="${schema.view}">Bekijk pagina</a></div>`);
  const getters = {};
  let firstImage = () => '';
  for (const panel of schema.panels) {
    const p = h(`<div class="panel"><h2>${panel.title}</h2>${panel.hint ? `<p class="hint">${panel.hint}</p>` : ''}</div>`);
    for (const [k, label, type, help] of panel.fields) {
      let f;
      if (type === 'text') f = textField(label, data[k], { help: help || '' });
      else if (type === 'textarea') f = textField(label, data[k], { multiline: true, help: help || '' });
      else if (type === 'rich' || type === 'rich-sm') f = richField(label, data[k], { small: type === 'rich-sm' });
      else if (type === 'image') { f = imageField(label, data[k], { nameHint: () => 'estacia-' + name }); const ff = f; firstImage = () => ff.get().url; }
      else if (type === 'lines') f = linesField(label, data[k], help || '');
      else if (type === 'services') f = servicesField(data[k]);
      p.append(f.el);
      getters[k] = f.get;
    }
    v.append(p);
  }
  const pageSeo = settings.seo.pages[schema.seo] || {};
  const seo = seoPanel(pageSeo, {
    fallbackTitle: () => 'Estacia Body & Mind Reset',
    fallbackDesc: () => 'Omschrijving van deze pagina…',
    path: () => schema.view,
    image: () => firstImage() || settings.seo.image,
  });
  v.append(seo.el);

  const doSave = async (view) => {
    const out = { ...data };
    for (const [k, get] of Object.entries(getters)) out[k] = get();
    if (DEMO) { dirty = false; toast('Demo: niet opgeslagen'); return; }
    const seoVal = structuredClone(settings.seo);
    seoVal.pages[schema.seo] = seo.get();
    await saveSetting(schema.key, out);
    await saveSetting('seo', seoVal);
    clearSettingsCache(); settings = await getSettings();
    dirty = false;
    if (view) return goToSite(schema.view);
    toast('Opgeslagen ✓');
  };
  v.append(saveBar([
    button('Opslaan & bekijken', '', (b) => busy(b, () => doSave(true))),
    button('Alleen opslaan', 'ghost', (b) => busy(b, () => doSave(false))),
  ]));
}

// ── Kleuren & stijl ────────────────────────────────────
async function viewTheme(v) {
  let theme = structuredClone(settings.theme || { preset: 'zonsopgang', custom: {} });
  theme.custom ||= {};
  v.insertAdjacentHTML('beforeend', `<div class="head"><div><h1>Kleuren & stijl</h1><p>Kies een sfeer. Je kunt daarna eventueel losse kleuren aanpassen.</p></div></div>
    <div class="panel"><h2>1. Kies een stijl</h2><div class="themes"></div></div>
    <div class="panel"><h2>2. Voorbeeld</h2><div class="livebox"></div></div>
    <details class="panel"><summary>3. Losse kleuren aanpassen (optioneel)</summary><p class="hint" style="margin-top:12px">Tip: blijf dicht bij de gekozen stijl. Met “standaard” zet je een kleur terug.</p><div class="colors"></div><p style="margin:16px 0 0"><button type="button" class="btn sm ghost" id="resetc">Alle eigen kleuren wissen</button></p></details>`);
  const colorsOf = () => ({ ...THEMES[theme.preset].colors, ...theme.custom });

  const drawThemes = () => {
    $('.themes', v).innerHTML = Object.entries(THEMES).map(([k, t]) => `
      <button type="button" class="theme ${theme.preset === k ? 'on' : ''}" data-k="${k}" aria-pressed="${theme.preset === k}">
        <div class="demo" style="background:${t.colors.bg};color:${t.colors.text}">
          <div class="h" style="color:${t.colors.primary}">Estacia</div>
          <div style="font-size:.85rem;color:${t.colors.muted}">Body &amp; Mind Reset</div>
          <span class="b" style="background:${t.colors.primary};color:${t.colors.primaryInk}">Afspraak maken</span>
        </div>
        <div class="sw">${['primary', 'accent', 'soft', 'bgAlt', 'text'].map((c) => `<i style="background:${t.colors[c]}"></i>`).join('')}</div>
        <div class="nm">${esc(t.name)}<small>${esc(t.note)}</small></div>
      </button>`).join('');
  };
  const drawLive = () => {
    const c = colorsOf();
    $('.livebox', v).innerHTML = `
      <div style="background:${c.bg};color:${c.text};padding:28px;font-family:var(--sans)">
        <div style="font:700 .7rem var(--sans);letter-spacing:.2em;text-transform:uppercase;color:${c.accent}">Intuïtieve coaching · Reiki</div>
        <div style="font:600 2rem/1.1 var(--serif);color:${c.primary};margin:8px 0">Ben jij klaar voor jouw <span style="color:${c.accent};font-style:italic">wederopstanding?</span></div>
        <p style="color:${c.muted};margin:0 0 16px">Intuïtieve coaching voor vrouwen die hun energie willen herstellen.</p>
        <span style="display:inline-block;background:${c.primary};color:${c.primaryInk};border-radius:999px;padding:10px 18px;font-weight:800;font-size:.9rem">Plan een kennismaking</span>
        <div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">
          <div style="background:${c.surface};border:1px solid ${c.soft};border-radius:14px;padding:14px;flex:1;min-width:160px"><b style="color:${c.primary}">Kaartje</b><div style="color:${c.muted};font-size:.9rem">Op een vlak</div></div>
          <div style="background:${c.bgAlt};border-radius:14px;padding:14px;flex:1;min-width:160px"><b style="color:${c.primary}">Afwisselend blok</b><div style="color:${c.muted};font-size:.9rem">Tweede achtergrond</div></div>
        </div>
      </div>
      <div style="background:${c.primary};color:${c.primaryInk};padding:18px 28px;font:500 1.3rem var(--serif)">“Het is goed zoals het is” <span style="color:${c.accent}">· footer & quote</span></div>`;
  };
  const drawColors = () => {
    const c = colorsOf();
    $('.colors', v).innerHTML = Object.entries(COLOR_LABELS).map(([k, label]) => `
      <label class="color"><input type="color" data-c="${k}" value="${c[k]}"><span>${esc(label)}</span>${theme.custom[k] ? `<button type="button" data-reset="${k}">standaard</button>` : ''}</label>`).join('');
  };
  const drawAll = () => { drawThemes(); drawLive(); drawColors(); };

  $('.themes', v).addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    if (Object.keys(theme.custom).length && !confirm('Je hebt eigen kleuren ingesteld. Die worden gewist als je een andere stijl kiest. Doorgaan?')) return;
    theme = { preset: b.dataset.k, custom: {} }; markDirty(); drawAll();
  });
  $('.colors', v).addEventListener('input', (e) => {
    const k = e.target.dataset.c; if (!k) return;
    theme.custom[k] = e.target.value; markDirty(); drawLive();
  });
  $('.colors', v).addEventListener('change', drawColors);
  $('.colors', v).addEventListener('click', (e) => {
    const k = e.target.dataset.reset; if (!k) return;
    e.preventDefault(); delete theme.custom[k]; markDirty(); drawAll();
  });
  $('#resetc', v).addEventListener('click', () => { theme.custom = {}; markDirty(); drawAll(); });
  drawAll();

  const doSave = async (view) => {
    if (DEMO) { dirty = false; toast('Demo: niet opgeslagen'); return; }
    await saveSetting('theme', theme);
    settings.theme = theme; dirty = false;
    try { localStorage.removeItem('estacia-theme-css'); } catch {}
    if (view) return goToSite('/');
    toast('Opgeslagen ✓');
  };
  v.append(saveBar([
    button('Opslaan & bekijken', '', (b) => busy(b, () => doSave(true))),
    button('Alleen opslaan', 'ghost', (b) => busy(b, () => doSave(false))),
  ]));
}

// ── Berichten ──────────────────────────────────────────
async function viewMessages(v) {
  v.insertAdjacentHTML('beforeend', '<div class="head"><div><h1>Berichten</h1><p>Berichten via het contactformulier op je website.</p></div></div>');
  if (DEMO) { v.insertAdjacentHTML('beforeend', '<div class="panel empty">In demo-modus zijn er geen berichten.</div>'); return; }
  let msgs = [];
  try { msgs = await getMessages(); } catch (e) { v.insertAdjacentHTML('beforeend', `<div class="err">${esc(errText(e))}</div>`); return; }
  if (!msgs.length) { v.insertAdjacentHTML('beforeend', '<div class="panel empty">Nog geen berichten. Ze verschijnen hier zodra iemand het formulier invult.</div>'); return; }
  const list = h('<div class="list"></div>');
  for (const m of msgs) {
    const wa = (m.phone || '').replace(/\D/g, '').replace(/^0/, '31');
    const first = (m.name || '').split(' ')[0];
    const el = h(`<div class="msg ${m.read ? '' : 'unread'}">
      <div class="top"><strong>${esc(m.name)}</strong><small>${new Date(m.created_at).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })}</small>${m.preference ? `<span class="pill plan">Voorkeur: ${esc(m.preference)}</span>` : ''}${m.read ? '' : '<span class="pill draft">Nieuw</span>'}</div>
      <p>${esc(m.message)}</p>
      <div class="meta" style="color:var(--muted);font-size:.9rem;margin-bottom:12px">${esc(m.email || '')}${m.phone ? ' · ' + esc(m.phone) : ''}</div>
      <div class="btns">
        ${wa ? `<a class="btn sm wa" href="https://wa.me/${wa}?text=${encodeURIComponent(`Hoi ${first}, dankjewel voor je bericht! `)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        ${m.phone ? `<a class="btn sm" href="tel:${esc(m.phone.replace(/[^+\d]/g, ''))}">Bellen</a>` : ''}
        ${m.email ? `<a class="btn sm ghost" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: je bericht aan Estacia')}">Mailen</a>` : ''}
        <button type="button" class="btn sm ghost" data-read>${m.read ? 'Markeer als nieuw' : 'Markeer als gelezen'}</button>
        <button type="button" class="btn sm danger" data-del>Verwijderen</button>
      </div></div>`);
    $('[data-read]', el).addEventListener('click', async () => { await updateMessage(m.id, { read: !m.read }); route(); });
    $('[data-del]', el).addEventListener('click', async () => { if (confirm('Dit bericht verwijderen?')) { await deleteMessage(m.id); route(); } });
    list.append(el);
  }
  v.append(list);
}

// ── Instellingen ───────────────────────────────────────
async function viewSettings(v) {
  const site = structuredClone(settings.site);
  const seoAll = structuredClone(settings.seo);
  v.insertAdjacentHTML('beforeend', '<div class="head"><div><h1>Instellingen</h1><p>Algemene teksten en vindbaarheid.</p></div></div>');
  const p1 = h('<div class="panel"><h2>🏷️ Naam & teksten</h2></div>');
  const f = {
    title: textField('Naam', site.title),
    subtitle: textField('Ondertitel', site.subtitle),
    tagline: textField('Slogan', site.tagline, { help: 'Staat op de homepagina onder de knoppen.' }),
    footerText: textField('Tekst onderaan elke pagina', site.footerText, { multiline: true }),
    poweredBy: textField('Extra regel onderaan (mag leeg)', site.poweredBy),
  };
  Object.values(f).forEach((x) => p1.append(x.el));

  const p2 = h('<div class="panel"><h2>🔎 Vindbaarheid</h2><p class="hint">De SEO per pagina stel je in onderaan elke pagina (bij Pagina’s) en bij elk verhaal.</p></div>');
  const siteUrl = textField('Webadres van de site', seoAll.siteUrl, { type: 'url', placeholder: 'https://www.estacia.nl', help: 'Je eigen domein. Wordt gebruikt voor Google (sitemap) en bij delen.' });
  const shareImg = imageField('Standaard deel-afbeelding', { url: seoAll.image }, { nameHint: () => 'estacia-delen', help: 'Wordt getoond als iemand een pagina zonder eigen foto deelt.' });
  const blogSeo = seoPanel(seoAll.pages.nieuws || {}, {
    fallbackTitle: () => 'Blog – Estacia', fallbackDesc: () => 'Omschrijving van je blogoverzicht…', path: () => '/nieuws', image: () => shareImg.get().url,
  });
  $('h2', blogSeo.el).textContent = '🔎 Blogoverzicht (/nieuws)';
  p2.append(siteUrl.el, shareImg.el);

  const p3 = h(`<div class="panel"><h2>🔑 Wachtwoord wijzigen</h2>
    <div class="f"><label for="npw">Nieuw wachtwoord</label><input type="password" id="npw" minlength="8" autocomplete="new-password"></div>
    <button type="button" class="btn ghost" id="cpw">Wachtwoord wijzigen</button></div>`);
  $('#cpw', p3).addEventListener('click', async () => {
    const pw = $('#npw', p3).value;
    if (pw.length < 8) return toast('Minimaal 8 tekens');
    if (DEMO) return toast('Demo');
    const { error } = await client.auth.updateUser({ password: pw });
    toast(error ? error.message : 'Wachtwoord gewijzigd ✓');
    $('#npw', p3).value = '';
  });
  v.append(p1, p2, blogSeo.el, p3);

  const doSave = async (view) => {
    const out = { ...site };
    for (const [k, x] of Object.entries(f)) out[k] = x.get();
    seoAll.siteUrl = siteUrl.get().replace(/\/$/, '');
    seoAll.image = shareImg.get().url;
    seoAll.pages.nieuws = blogSeo.get();
    if (DEMO) { dirty = false; toast('Demo: niet opgeslagen'); return; }
    await saveSetting('site', out); await saveSetting('seo', seoAll);
    clearSettingsCache(); settings = await getSettings(); dirty = false;
    if (view) return goToSite('/');
    toast('Opgeslagen ✓');
  };
  v.append(saveBar([
    button('Opslaan & bekijken', '', (b) => busy(b, () => doSave(true))),
    button('Alleen opslaan', 'ghost', (b) => busy(b, () => doSave(false))),
  ]));
}

// ── Hulp ───────────────────────────────────────────────
async function viewHelp(v) {
  v.insertAdjacentHTML('beforeend', `<div class="head"><div><h1>Hulp</h1><p>Alles wat je moet weten, kort en simpel.</p></div></div>
  <div class="panel help-article">
    <h2 style="margin-top:0">✍️ Een verhaal plaatsen</h2>
    <ol>
      <li>Klik op <strong>Nieuw verhaal</strong>.</li>
      <li>Vul een <strong>titel</strong> in. Het webadres maakt de website zelf.</li>
      <li>Schrijf een <strong>korte samenvatting</strong> (1-2 zinnen) en daarna je <strong>verhaal</strong>. Kopiëren uit Facebook of Word mag gewoon.</li>
      <li>Kies een <strong>foto</strong> en beschrijf in een paar woorden wat erop staat.</li>
      <li>Voeg een paar <strong>onderwerpen</strong> toe, zoals “loslaten” of “dankbaarheid”.</li>
      <li>Klik op <strong>Opslaan & bekijken</strong>. Je ziet meteen hoe het eruitziet.</li>
    </ol>
    <h2>📣 Delen op Facebook, WhatsApp en Instagram</h2>
    <ul>
      <li>Bij <strong>Blog & nieuws</strong> staan onder elk verhaal knoppen om te delen.</li>
      <li><strong>Facebook</strong> en <strong>WhatsApp</strong> openen direct met de link, de foto en de titel.</li>
      <li><strong>Instagram</strong> kan geen links delen. Op je telefoon opent het deelmenu met de foto en staat de tekst al gekopieerd. Op de computer wordt de foto gedownload en de tekst gekopieerd.</li>
      <li>Bezoekers kunnen elk verhaal ook zelf delen. De knoppen staan onder het verhaal.</li>
    </ul>
    <h2>✏️ Iets aanpassen op je website</h2>
    <ul>
      <li>Ben je ingelogd en kijk je op je website? Dan zie je onderaan een <strong>werkbalk</strong>: <strong>+ Nieuw verhaal</strong>, <strong>Bewerk deze pagina</strong> (of <em>Bewerk dit verhaal</em>), 🎨 kleuren en ⚙ volledig beheer.</li>
      <li>Die knoppen openen een paneel óp je website. Na <strong>Opslaan & bekijken</strong> sluit het paneel en zie je meteen het resultaat.</li>
      <li>Inloggen kan ook direct vanaf je website: klik helemaal onderaan op <strong>Inloggen</strong>.</li>
      <li>Via <strong>Pagina’s</strong> pas je teksten en foto’s aan van Home, Over mij, Aanbod, Contact en Privacy.</li>
      <li>Je telefoonnummer en WhatsApp pas je aan bij <strong>Pagina’s → Contact</strong>. Die worden overal op de site gebruikt.</li>
    </ul>
    <h2>🎨 Kleuren</h2>
    <p>Bij <strong>Kleuren & stijl</strong> kies je een sfeer. Klik erop, kijk naar het voorbeeld en klik op <strong>Opslaan & bekijken</strong>.</p>
    <h2>🔎 Gevonden worden in Google (SEO)</h2>
    <ul>
      <li>Onderaan elk verhaal en elke pagina zie je hoe het in Google verschijnt.</li>
      <li>Laat je de velden leeg, dan gebruikt de site automatisch je titel en samenvatting. Dat is prima.</li>
      <li>Gebruik woorden waar mensen op zoeken, zoals “Reiki Utrecht” of “intuïtieve coaching”.</li>
      <li>Geef elke foto een omschrijving. Google leest die ook.</li>
    </ul>
    <h2>💌 Berichten</h2>
    <p>Als iemand het contactformulier invult, zie je dat bij <strong>Berichten</strong>. Met één klik reageer je via WhatsApp, bel je of stuur je een mail.</p>
    <h2>🔑 Wachtwoord vergeten?</h2>
    <p>Klik op het inlogscherm op <strong>Wachtwoord vergeten?</strong>. Je krijgt dan een mail met een link.</p>
  </div>`);
}

boot().catch((e) => { console.error(e); app.innerHTML = `<div class="login"><div class="box"><h1>Oeps</h1><p>${esc(e.message)}</p></div></div>`; });
