// Eigen pagina per aanbod-onderdeel: /aanbod/<slug>
import { init, editButton, reveal, setMeta, sanitize, imgTag, waLink, serviceCard, shareBlock, bindShare, priceList } from '../site.js';
import { esc, looksLoggedIn } from '../api.js';
import { LOTUS_MARK, icon } from '../icons.js';
import { findService, hasPage } from '../services.js';

const s = await init('aanbod');
const slug = decodeURIComponent(location.pathname.replace(/^\/aanbod\/?/, '').replace(/\/$/, ''));
if (!slug) location.replace('/aanbod');
const it = findService(s, slug);
const main = document.getElementById('main');
main.classList.remove('loading');

// Tekst met witregels → alinea's (voor de antwoorden bij "Meer uitleg")
const paras = (t = '') => String(t).split(/\n\s*\n/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');

if (!it || !hasPage(it, { preview: looksLoggedIn() })) {
  document.title = 'Pagina niet gevonden – Estacia';
  main.innerHTML = `<section class="page-head"><h1>Deze pagina bestaat (nog) niet</h1><p>Misschien is de naam veranderd. Bekijk het hele aanbod.</p><p style="margin-top:24px"><a class="btn" href="/aanbod">Naar het aanbod</a></p></section>`;
  if (it) editButton(`/admin/#/aanbod/${encodeURIComponent(it.slug)}`, 'Uitleg toevoegen');
} else {
  const url = location.origin + '/aanbod/' + encodeURIComponent(it.slug);
  setMeta({ title: it.seo_title || `${it.title} | Estacia`, description: it.seo_description || it.text, image: it.image?.url || s.seo.image, url });
  const faq = (it.faq || []).filter((f) => f.q);
  const others = s.services.items.filter((o) => o.slug !== it.slug).slice(0, 3);
  const c = s.contact;
  const waText = `Hallo Cindy, ik wil graag meer weten over ${it.title}.`;

  main.innerHTML = `
  ${it.draft ? '<p style="background:#1f1720;color:#fff;text-align:center;padding:10px;margin:0">Deze pagina is een <strong>concept</strong> en alleen zichtbaar voor jou. Zet hem op “Zichtbaar voor iedereen” om hem te delen.</p>' : ''}
  <article class="service-page">
    <header class="article-head narrow">
      <a class="back-link" href="/aanbod">← Alle aanbod</a>
      <div class="service-ic">${icon(it.icon)}</div>
      <h1>${esc(it.title)}</h1>
      ${it.text ? `<p class="lead">${esc(it.text)}</p>` : ''}
      ${priceList(it) ? `<div class="service-prices">${priceList(it)}</div>` : ''}
      <div class="divider">${LOTUS_MARK}</div>
    </header>
    ${it.image?.url ? `<figure class="article-img">${imgTag(it.image, { eager: true })}${it.image.title ? `<figcaption>${esc(it.image.title)}</figcaption>` : ''}</figure>` : ''}
    <div class="narrow prose">${await sanitize(it.content || '')}</div>
    ${faq.length ? `
    <section class="narrow faq" aria-labelledby="faq-h">
      <h2 id="faq-h">${esc(it.faqTitle || 'Meer uitleg')}</h2>
      ${faq.map((f, i) => `<details class="faq-item"${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><div class="faq-a">${paras(f.a)}</div></details>`).join('')}
    </section>` : ''}
    <div class="narrow">${shareBlock({ url, title: it.title, text: it.text, image: it.image?.url })}</div>
  </article>
  <section class="cta" style="padding-bottom:40px">
    <div class="wrap"><div class="cta-box reveal">
      <h2>Past ${esc(it.title.charAt(0).toLowerCase() + it.title.slice(1))} bij jou?</h2>
      <p class="muted">${esc(s.services.ctaText)}</p>
      <div class="btn-row">
        <a class="btn" href="/contact#afspraak">Neem contact op</a>
        ${c.whatsapp ? `<a class="btn btn-wa" href="${waLink(c.whatsapp, waText)}" target="_blank" rel="noopener">WhatsApp mij</a>` : ''}
      </div>
    </div></div>
  </section>
  ${others.length ? `<section class="alt"><div class="wrap"><div class="section-head"><h2>Ander aanbod</h2></div><div class="cards">${others.map((o) => serviceCard(o)).join('')}</div></div></section>` : ''}`;

  // Gestructureerde gegevens voor Google (dienst + veelgestelde vragen)
  const ld = [{
    '@context': 'https://schema.org', '@type': 'Service', name: it.title, description: it.seo_description || it.text, url,
    image: it.image?.url ? new URL(it.image.url, location.origin).href : undefined,
    provider: { '@type': 'Organization', name: 'Estacia Body & Mind Reset', telephone: c.phone || undefined, address: c.address ? c.address.replace(/\n/g, ', ') : undefined },
  }];
  if (faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(ld);
  document.head.appendChild(tag);

  bindShare(main);
  const label = main.querySelector('.share-label');
  if (label) label.textContent = 'Deel deze pagina';
  editButton(`/admin/#/aanbod/${encodeURIComponent(it.slug)}`, 'Bewerk deze pagina');
}
reveal();
