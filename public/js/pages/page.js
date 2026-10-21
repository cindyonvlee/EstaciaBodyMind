import { init, sanitize, editButton, imgTag, reveal, setMeta } from '../site.js';
import { esc } from '../api.js';
import { LOTUS_MARK } from '../icons.js';

const key = location.pathname.startsWith('/privacy') ? 'privacy' : 'over';
const s = await init(key);
const main = document.getElementById('main');
main.classList.remove('loading');
const seo = s.seo.pages[key] || {};

if (key === 'over') {
  const a = s.about;
  setMeta({ title: seo.title, description: seo.description, image: a.image?.url || s.seo.image });
  main.innerHTML = `
  <section class="page-head">
    <p class="eyebrow">${esc(a.title)}</p>
    <h1><span class="script">${esc(a.script)}</span></h1>
    <div class="divider">${LOTUS_MARK}</div>
  </section>
  <section style="padding-top:0">
    <div class="wrap about-grid">
      <div class="arch">${imgTag(a.image, { eager: true })}</div>
      <div class="prose reveal">${await sanitize(a.content)}
        <div class="btn-row" style="margin-top:28px">
          <a class="btn" href="/contact#afspraak">Plan een kennismaking</a>
          <a class="btn btn-ghost" href="/aanbod">Bekijk het aanbod</a>
        </div>
      </div>
    </div>
  </section>`;
  editButton('/admin/#/pagina/over');
} else {
  const p = s.privacy;
  setMeta({ title: seo.title, description: seo.description });
  main.innerHTML = `
  <section class="page-head"><h1>${esc(p.title)}</h1><div class="divider">${LOTUS_MARK}</div></section>
  <section style="padding-top:0"><div class="narrow prose">${await sanitize(p.content)}</div></section>`;
  editButton('/admin/#/pagina/privacy');
}
reveal();
