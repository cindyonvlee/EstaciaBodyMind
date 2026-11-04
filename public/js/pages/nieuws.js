import { init, editButton, reveal, setMeta, postCard, openEditor } from '../site.js';
import { getPosts, esc, looksLoggedIn } from '../api.js';
import { LOTUS_MARK } from '../icons.js';

const s = await init('nieuws');
const seo = s.seo.pages.nieuws;
setMeta({ title: seo.title, description: seo.description, image: s.seo.image });

const posts = await getPosts({ limit: 200 });
const tag = new URLSearchParams(location.search).get('tag');
// Onderwerpen tellen; de meest gebruikte eerst
const counts = {};
posts.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
const allTags = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, 'nl'));
const TOP = 12;
const tagLink = (t) => `<a href="/nieuws?tag=${encodeURIComponent(t)}" class="${t === tag ? 'on' : ''}">#${esc(t)} <small>${counts[t]}</small></a>`;
const list = tag ? posts.filter((p) => (p.tags || []).includes(tag)) : posts;

const main = document.getElementById('main');
main.classList.remove('loading');
main.innerHTML = `
<section class="page-head">
  <p class="eyebrow">Blog</p>
  <h1>${esc(s.home.newsTitle)}</h1>
  ${s.blog.intro ? `<p>${esc(s.blog.intro)}</p>` : ''}
  <div class="divider">${LOTUS_MARK}</div>
  ${looksLoggedIn() ? '<p style="margin-top:8px"><button type="button" class="btn" id="newpost">+ Nieuw verhaal toevoegen</button></p>' : ''}
</section>
<section style="padding-top:0">
  <div class="wrap">
    ${tag ? `<p class="tag-active">Verhalen over <strong>#${esc(tag)}</strong> (${list.length}) · <a href="/nieuws">× Toon alle verhalen</a></p>` : ''}
    ${list.length ? `<div class="posts">${list.map(postCard).join('')}</div>` : '<p class="empty">Er zijn nog geen verhalen geplaatst.</p>'}
  </div>
</section>
${allTags.length ? `
<section class="alt tag-cloud-wrap">
  <div class="wrap">
    <h2 class="tag-h">Zoek op onderwerp</h2>
    <nav class="tag-cloud" aria-label="Onderwerpen">
      ${allTags.slice(0, TOP).map(tagLink).join('')}
    </nav>
    ${allTags.length > TOP ? `<details class="tag-more"><summary>Alle ${allTags.length} onderwerpen</summary><nav class="tag-cloud" aria-label="Alle onderwerpen">${allTags.slice(TOP).map(tagLink).join('')}</nav></details>` : ''}
  </div>
</section>` : ''}`;
document.getElementById('newpost')?.addEventListener('click', () => openEditor('#/nieuws/nieuw'));
reveal();
editButton('/admin/#/pagina/blog', 'Bewerk blogpagina');
