import { init, sanitize, editButton, imgTag, reveal, postCard, setMeta, openEditor } from '../site.js';
import { getPosts, esc, looksLoggedIn } from '../api.js';
import { icon, LOTUS_MARK } from '../icons.js';

const s = await init('home');
const h = s.home;
const [posts, intro] = await Promise.all([getPosts({ limit: 3 }), sanitize(h.introText)]);
const seo = s.seo.pages.home;
setMeta({ title: seo.title, description: seo.description, image: s.seo.image });

const main = document.getElementById('main');
main.classList.remove('loading');
main.innerHTML = `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">${esc(h.heroEyebrow)}</p>
      <h1>${esc(h.heroTitle)} <span class="script">${esc(h.heroScript)}</span></h1>
      <p class="hero-lead">${esc(h.heroText)}</p>
      <div class="btn-row">
        <a class="btn" href="/contact#afspraak">${esc(h.ctaPrimary)}</a>
        <a class="btn btn-ghost" href="/over-mij">${esc(h.ctaSecondary)}</a>
      </div>
      ${s.site.tagline ? `<p class="tagline">${esc(s.site.tagline)}</p>` : ''}
    </div>
    <div class="hero-media"><div class="arch">${imgTag(h.heroImage, { eager: true })}</div></div>
  </div>
</section>

<section class="alt">
  <div class="narrow center reveal">
    <div class="divider">${LOTUS_MARK}</div>
    <h2>${esc(h.introTitle)}</h2>
    <div class="prose">${intro}</div>
    <a class="btn btn-ghost" href="/over-mij">Meer over mij</a>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow">Waar ik je mee help</p>
      <h2>${esc(s.services.title)}</h2>
      <p>${esc(s.services.intro)}</p>
    </div>
    <div class="cards">
      ${s.services.items.slice(0, 4).map((it) => `
        <article class="card reveal">
          <div class="ic">${icon(it.icon)}</div>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.text)}</p>
        </article>`).join('')}
    </div>
    <p class="center" style="margin-top:36px"><a class="btn btn-ghost" href="/aanbod">Bekijk het hele aanbod</a></p>
  </div>
</section>

${h.spiral?.length ? `
<section class="alt">
  <div class="wrap center reveal">
    <p class="eyebrow">Het proces</p>
    <h2>${esc(h.spiralTitle)}</h2>
    <div class="divider">${LOTUS_MARK}</div>
    <ol class="spiral">${h.spiral.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
  </div>
</section>` : ''}

${h.quote ? `
<section class="quote-band">
  <div class="narrow reveal">
    ${LOTUS_MARK}
    <blockquote>${esc(h.quote)}</blockquote>
    ${h.quoteSub ? `<p class="script">${esc(h.quoteSub)}</p>` : ''}
  </div>
</section>` : ''}

${posts.length ? `
<section>
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow">Blog</p>
      <h2>${esc(h.newsTitle)}</h2>
      ${looksLoggedIn() ? '<button type="button" class="btn" id="newpost">+ Nieuw verhaal toevoegen</button>' : ''}
    </div>
    <div class="posts">${posts.map(postCard).join('')}</div>
    <p class="center" style="margin-top:36px"><a class="btn btn-ghost" href="/nieuws">Alle verhalen</a></p>
  </div>
</section>` : ''}

<section class="cta alt">
  <div class="wrap">
    <div class="cta-box reveal">
      <h2>Zullen we kennismaken?</h2>
      <p class="muted">${esc(s.contact.intro)}</p>
      <div class="btn-row">
        <a class="btn" href="/contact#afspraak">Stuur een bericht</a>
        ${s.contact.whatsapp ? `<a class="btn btn-wa" href="https://wa.me/${esc(s.contact.whatsapp)}?text=${encodeURIComponent(s.contact.whatsappText || '')}" target="_blank" rel="noopener">WhatsApp mij</a>` : ''}
      </div>
    </div>
  </div>
</section>`;

document.getElementById('newpost')?.addEventListener('click', () => openEditor('#/nieuws/nieuw'));
reveal();
editButton('/admin/#/pagina/home');
