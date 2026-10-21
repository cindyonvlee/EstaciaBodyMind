import { getSettings, looksLoggedIn, esc, formatDate } from './api.js';
import { applyTheme } from './themes.js';
import { DEVELOPER } from './config.js';
import { UI, LOTUS_MARK } from './icons.js';

const NAV = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'over', href: '/over-mij', label: 'Over mij' },
  { key: 'aanbod', href: '/aanbod', label: 'Aanbod' },
  { key: 'nieuws', href: '/nieuws', label: 'Blog' },
  { key: 'contact', href: '/contact', label: 'Contact' },
];

let _purify;
export async function sanitize(html = '') {
  if (!_purify) _purify = (await import('/vendor/purify.mjs')).default;
  return _purify.sanitize(html, { ADD_ATTR: ['target'] });
}

export const tel = (p = '') => 'tel:' + p.replace(/[^+\d]/g, '');
export const waLink = (num = '', text = '') => `https://wa.me/${num.replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;

export function setMeta({ title, description, image, url, type = 'website' }) {
  if (title) document.title = title;
  const set = (sel, attr, val) => {
    if (!val) return;
    let el = document.head.querySelector(sel);
    if (!el) { el = document.createElement('meta'); const [k, v] = sel.match(/\[(\w+)="([^"]+)"\]/).slice(1); el.setAttribute(k, v); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  set('meta[name="description"]', 'content', description);
  set('meta[property="og:title"]', 'content', title);
  set('meta[property="og:description"]', 'content', description);
  set('meta[property="og:type"]', 'content', type);
  if (image) set('meta[property="og:image"]', 'content', new URL(image, location.origin).href);
  set('meta[property="og:url"]', 'content', url || location.href);
  let canon = document.head.querySelector('link[rel="canonical"]');
  if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
  canon.href = url || location.origin + location.pathname;
}

function header(s, active) {
  return `
  <a class="skip" href="#main">Naar inhoud</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/" aria-label="${esc(s.site.title)} – home">
        <span class="brand-mark">${LOTUS_MARK}</span>
        <span class="brand-text"><span class="brand-name">${esc(s.site.title)}</span><span class="brand-sub">${esc(s.site.subtitle)}</span></span>
      </a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu">${UI.menu}</button>
      <nav id="nav" class="nav" aria-label="Hoofdmenu">
        ${NAV.map((n) => `<a href="${n.href}" ${n.key === active ? 'aria-current="page"' : ''}>${n.label}</a>`).join('')}
        <a class="btn btn-small" href="/contact#afspraak">Afspraak maken</a>
      </nav>
    </div>
  </header>`;
}

function footer(s) {
  const c = s.contact;
  const year = new Date().getFullYear();
  const devWa = waLink(DEVELOPER.whatsapp, DEVELOPER.whatsappText);
  return `
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <span class="brand-mark">${LOTUS_MARK}</span>
        <p class="footer-name">${esc(s.site.title)} <span>${esc(s.site.subtitle)}</span></p>
        <p class="footer-text">${esc(s.site.footerText)}</p>
        ${s.site.poweredBy ? `<p class="powered">${esc(s.site.poweredBy)}</p>` : ''}
      </div>
      <div>
        <h2 class="footer-h">Contact</h2>
        <ul class="footer-list">
          ${c.phone ? `<li><a href="${tel(c.phone)}">${UI.phone}<span>${esc(c.phone)}</span></a></li>` : ''}
          ${c.whatsapp ? `<li><a href="${waLink(c.whatsapp, c.whatsappText)}" target="_blank" rel="noopener">${UI.whatsapp}<span>WhatsApp</span></a></li>` : ''}
          ${c.email ? `<li><a href="mailto:${esc(c.email)}">${UI.mail}<span>${esc(c.email)}</span></a></li>` : ''}
          ${c.address ? `<li><a href="${esc(c.mapsUrl || '#')}" target="_blank" rel="noopener">${UI.pin}<span>${esc(c.address).replace(/\n/g, '<br>')}</span></a></li>` : ''}
        </ul>
      </div>
      <div>
        <h2 class="footer-h">Ontdek</h2>
        <ul class="footer-list plain">
          ${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}
        </ul>
        <div class="socials">
          ${c.facebook ? `<a href="${esc(c.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${UI.facebook}</a>` : ''}
          ${c.instagram ? `<a href="${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${UI.instagram}</a>` : ''}
        </div>
      </div>
    </div>
    <div class="wrap footer-bottom">
      <p>© ${year} ${esc(s.site.title)} ${esc(s.site.subtitle)} · <a href="/privacy">Privacy</a> · ${looksLoggedIn() ? '<a href="/admin/">Beheer</a>' : '<a href="/admin/" data-login>Inloggen</a>'}</p>
    </div>
    <div class="dev-credit">
      <div class="wrap dev-inner">
        <span class="dev-q">${DEVELOPER.label}</span>
        <a class="dev-btn" href="${devWa}" target="_blank" rel="noopener" aria-label="WhatsApp ${DEVELOPER.name}, ${DEVELOPER.phoneDisplay}">
          ${UI.whatsapp}<span><strong>${DEVELOPER.name}</strong> · ${DEVELOPER.phoneDisplay}</span>
        </a>
      </div>
    </div>
  </footer>
  <nav class="contact-bar" aria-label="Snel contact">
    ${c.phone ? `<a href="${tel(c.phone)}">${UI.phone}<span>Bellen</span></a>` : ''}
    ${c.whatsapp ? `<a href="${waLink(c.whatsapp, c.whatsappText)}" target="_blank" rel="noopener" class="wa">${UI.whatsapp}<span>WhatsApp</span></a>` : ''}
    <a href="/contact#afspraak">${UI.mail}<span>Bericht</span></a>
  </nav>
  ${c.whatsapp ? `<a class="wa-float" href="${waLink(c.whatsapp, c.whatsappText)}" target="_blank" rel="noopener" aria-label="Stuur Cindy een WhatsApp">${UI.whatsapp}</a>` : ''}`;
}

// ── Bewerken vanaf de website ──────────────────────────
// Als Cindy is ingelogd verschijnt onderaan een werkbalk. De knoppen openen de
// beheerschermen in een zijpaneel óp de website; na opslaan ververst de pagina.
export function openEditor(route = '#/', { mode = 'edit' } = {}) {
  closeEditor();
  const wrap = document.createElement('div');
  wrap.className = 'editor-drawer';
  wrap.innerHTML = `<div class="editor-backdrop"></div><div class="editor-panel" role="dialog" aria-modal="true" aria-label="Bewerken"><iframe title="Bewerken" src="/admin/?embed=1${route}"></iframe></div>`;
  document.body.appendChild(wrap);
  document.documentElement.classList.add('editor-open');
  requestAnimationFrame(() => wrap.classList.add('open'));
  wrap.querySelector('iframe').focus();
  const onMsg = (e) => {
    if (e.origin !== location.origin || !e.data?.type) return;
    const { type, path } = e.data;
    if (type === 'estacia-close') closeEditor();
    if (type === 'estacia-login' && mode === 'login') location.reload();
    if (type === 'estacia-open-admin') location.href = path || '/admin/';
    if (type === 'estacia-saved') {
      const target = new URL(path || location.pathname, location.origin);
      if (target.pathname === location.pathname && target.search === location.search) location.reload();
      else location.href = target.pathname + target.search + target.hash;
    }
  };
  addEventListener('message', onMsg);
  wrap._off = () => removeEventListener('message', onMsg);
}

export function closeEditor() {
  const d = document.querySelector('.editor-drawer');
  if (!d) return;
  d._off?.();
  d.classList.remove('open');
  document.documentElement.classList.remove('editor-open');
  setTimeout(() => d.remove(), 300);
}

export function editButton(href, label = 'Bewerk deze pagina') {
  if (!looksLoggedIn()) return;
  const route = href.includes('#') ? href.slice(href.indexOf('#')) : '#/';
  const bar = document.createElement('div');
  bar.className = 'admin-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Beheer');
  bar.innerHTML = `
    <button type="button" class="ab-main" data-r="#/nieuws/nieuw"><b>+</b><span>Nieuw verhaal</span></button>
    <button type="button" data-r="${route}">${UI.edit}<span>${label}</span></button>
    <button type="button" data-r="#/stijl" title="Kleuren & stijl"><span>🎨</span></button>
    <a href="/admin/" title="Volledig beheer"><span>⚙</span></a>`;
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (b) openEditor(b.dataset.r);
  });
  document.body.appendChild(bar);
}

export async function init(active) {
  const s = await getSettings();
  applyTheme(s.theme);
  document.body.insertAdjacentHTML('afterbegin', header(s, active));
  document.body.insertAdjacentHTML('beforeend', footer(s));
  const t = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  t.addEventListener('click', () => {
    const open = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', open);
    nav.classList.toggle('open', open);
    t.innerHTML = open ? UI.close : UI.menu;
  });
  // Inloggen vanaf de website (link in de footer)
  document.querySelector('[data-login]')?.addEventListener('click', (e) => { e.preventDefault(); openEditor('#/', { mode: 'login' }); });
  // Zwevende WhatsApp-knop verbergen zodra de footer in beeld is (daar staan de contactgegevens al)
  const fl = document.querySelector('.wa-float');
  if (fl && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => fl.classList.toggle('hide', en.isIntersecting)).observe(document.querySelector('.site-footer'));
  }
  const hdr = document.querySelector('.site-header');
  const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  return s;
}

// ── Delen ──────────────────────────────────────────────
export function shareBlock({ url, title, text, image }) {
  const u = encodeURIComponent(url);
  const wa = encodeURIComponent(`${title}\n${url}`);
  return `
  <div class="share" data-url="${esc(url)}" data-title="${esc(title)}" data-text="${esc(text || '')}" data-image="${esc(image || '')}">
    <span class="share-label">Deel dit verhaal</span>
    <a class="share-btn fb" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">${UI.facebook}<span>Facebook</span></a>
    <a class="share-btn wa" href="https://wa.me/?text=${wa}" target="_blank" rel="noopener">${UI.whatsapp}<span>WhatsApp</span></a>
    <button class="share-btn ig" type="button" data-share="instagram">${UI.instagram}<span>Instagram</span></button>
    <button class="share-btn" type="button" data-share="copy">${UI.link}<span>Kopieer link</span></button>
  </div>`;
}

export function bindShare(root = document) {
  root.querySelectorAll('.share').forEach((box) => {
    const { url, title, text, image } = box.dataset;
    box.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-share]');
      if (!btn) return;
      if (btn.dataset.share === 'copy') {
        await copy(url); toast('Link gekopieerd');
      }
      if (btn.dataset.share === 'instagram') {
        // Instagram heeft geen deel-link. Op de telefoon: systeem-deelmenu (met afbeelding), anders link kopiëren.
        try {
          if (navigator.share) {
            const data = { title, text: `${title}\n\n${text}\n\n${url}`, url };
            if (image && navigator.canShare) {
              try {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], 'estacia.' + (blob.type.split('/')[1] || 'jpg'), { type: blob.type });
                if (navigator.canShare({ files: [file] })) data.files = [file];
              } catch {}
            }
            await navigator.share(data);
            return;
          }
        } catch (err) { if (err.name === 'AbortError') return; }
        await copy(`${title}\n\n${url}`);
        toast('Tekst + link gekopieerd. Plak het in je Instagram-verhaal of bericht.');
      }
    });
  });
}

export async function copy(t) {
  try { await navigator.clipboard.writeText(t); } catch {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.role = 'status'; el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
}

export function reveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
}

export function postCard(p) {
  return `<a class="post-card reveal" href="/nieuws/${esc(p.slug)}">
    <div class="thumb">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.image_alt || '')}" ${p.image_title ? `title="${esc(p.image_title)}"` : ''} loading="lazy" decoding="async">` : ''}</div>
    <div class="body">
      <time datetime="${esc(p.published_at || '')}">${formatDate(p.published_at)}</time>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.excerpt || '')}</p>
      <span class="more">Lees verder →</span>
    </div>
  </a>`;
}

export function imgTag(img, { cls = '', sizes = '', eager = false } = {}) {
  if (!img?.url) return '';
  return `<img class="${cls}" src="${esc(img.url)}" alt="${esc(img.alt || '')}" ${img.title ? `title="${esc(img.title)}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${sizes}>`;
}
