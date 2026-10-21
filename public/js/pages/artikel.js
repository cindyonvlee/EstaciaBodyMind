import { init, editButton, reveal, setMeta, sanitize, shareBlock, bindShare, postCard } from '../site.js';
import { getPost, getPosts, esc, formatDate } from '../api.js';
import { LOTUS_MARK } from '../icons.js';

const s = await init('nieuws');
const slug = decodeURIComponent(location.pathname.replace(/^\/nieuws\//, '').replace(/\/$/, ''));
if (!slug) location.replace('/nieuws');
const post = await getPost(slug);
const main = document.getElementById('main');
main.classList.remove('loading');

if (!post) {
  document.title = 'Verhaal niet gevonden – Estacia';
  main.innerHTML = `<section class="page-head"><h1>Verhaal niet gevonden</h1><p>Dit verhaal bestaat niet (meer).</p><p style="margin-top:24px"><a class="btn" href="/nieuws">Naar alle verhalen</a></p></section>`;
} else {
  const url = location.origin + '/nieuws/' + post.slug;
  setMeta({ title: post.seo_title || `${post.title} | Estacia`, description: post.seo_description || post.excerpt, image: post.image_url, url, type: 'article' });
  const others = (await getPosts({ limit: 4 })).filter((p) => p.id !== post.id).slice(0, 3);
  const isDraft = post.status !== 'published' || new Date(post.published_at) > new Date();

  main.innerHTML = `
  ${isDraft ? '<p style="background:#1f1720;color:#fff;text-align:center;padding:10px;margin:0">Dit is een <strong>concept</strong> en alleen zichtbaar voor jou. Zet het op “Gepubliceerd” om het te delen.</p>' : ''}
  <article>
    <header class="article-head narrow">
      <time datetime="${esc(post.published_at)}">${formatDate(post.published_at)}</time>
      <h1>${esc(post.title)}</h1>
      ${post.excerpt ? `<p class="lead">${esc(post.excerpt)}</p>` : ''}
      <div class="divider">${LOTUS_MARK}</div>
    </header>
    ${post.image_url ? `<figure class="article-img"><img src="${esc(post.image_url)}" alt="${esc(post.image_alt || '')}" ${post.image_title ? `title="${esc(post.image_title)}"` : ''} fetchpriority="high"></figure>` : ''}
    <div class="narrow prose">
      ${await sanitize(post.content)}
      <p class="signature">Estacia</p>
      <div class="article-foot">
        ${post.tags?.length ? `<ul class="tags">${post.tags.map((t) => `<li><a href="/nieuws?tag=${encodeURIComponent(t)}">#${esc(t)}</a></li>`).join('')}</ul>` : ''}
        ${shareBlock({ url, title: post.title, text: post.excerpt, image: post.image_url })}
      </div>
    </div>
  </article>
  <section class="cta" style="padding-bottom:40px">
    <div class="wrap"><div class="cta-box reveal">
      <h2>Herken je jezelf hierin?</h2>
      <p class="muted">Je hoeft het niet alleen uit te zoeken. Neem gerust contact op voor een vrijblijvende kennismaking.</p>
      <div class="btn-row"><a class="btn" href="/contact#afspraak">Neem contact op</a></div>
    </div></div>
  </section>
  ${others.length ? `<section class="alt"><div class="wrap"><div class="section-head"><h2>Meer verhalen</h2></div><div class="posts">${others.map(postCard).join('')}</div></div></section>` : ''}`;

  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.seo_description || post.excerpt,
    image: post.image_url ? new URL(post.image_url, location.origin).href : undefined, datePublished: post.published_at, dateModified: post.updated_at || post.published_at,
    author: { '@type': 'Person', name: 'Cindy Onvlee' }, publisher: { '@type': 'Organization', name: 'Estacia Body & Mind Reset' }, keywords: (post.tags || []).join(', '), mainEntityOfPage: url,
  });
  document.head.appendChild(ld);
  bindShare(main);
  editButton(`/admin/#/nieuws/${post.id}`, 'Bewerk dit verhaal');
}
reveal();
