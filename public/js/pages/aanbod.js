import { init, editButton, reveal, setMeta, waLink } from '../site.js';
import { esc } from '../api.js';
import { icon, LOTUS_MARK } from '../icons.js';

const s = await init('aanbod');
const sv = s.services;
const seo = s.seo.pages.aanbod;
setMeta({ title: seo.title, description: seo.description, image: s.seo.image });

// Meerdere tarieven per behandeling (oude data met één "price" blijft werken)
const priceList = (it) => {
  const rows = it.prices?.length ? it.prices : it.price ? [{ label: '', price: it.price }] : [];
  if (!rows.length) return '';
  return `<dl class="prices">${rows.map((p) => `<div class="price-line"><dt>${esc(p.label || '')}</dt><dd>${esc(p.price)}</dd></div>`).join('')}</dl>`;
};

const main = document.getElementById('main');
main.classList.remove('loading');
main.innerHTML = `
<section class="page-head">
  ${sv.eyebrow ? `<p class="eyebrow">${esc(sv.eyebrow)}</p>` : ''}
  <h1>${esc(sv.title)}</h1>
  <p>${esc(sv.intro)}</p>
  <div class="divider">${LOTUS_MARK}</div>
</section>
<section style="padding-top:0">
  <div class="wrap">
    <div class="cards">
      ${sv.items.map((it) => `
        <article class="card reveal">
          <div class="ic">${icon(it.icon)}</div>
          <h2 style="font-size:1.55rem">${esc(it.title)}</h2>
          <p>${esc(it.text)}</p>
          ${priceList(it)}
        </article>`).join('')}
    </div>
  </div>
</section>
<section class="cta alt">
  <div class="wrap">
    <div class="cta-box reveal">
      <h2>${esc(sv.ctaTitle)}</h2>
      <p class="muted">${esc(sv.ctaText)}</p>
      <div class="btn-row">
        <a class="btn" href="/contact#afspraak">Neem contact op</a>
        ${s.contact.whatsapp ? `<a class="btn btn-wa" href="${waLink(s.contact.whatsapp, s.contact.whatsappText)}" target="_blank" rel="noopener">WhatsApp mij</a>` : ''}
      </div>
    </div>
  </div>
</section>`;
reveal();
editButton('/admin/#/pagina/aanbod');
