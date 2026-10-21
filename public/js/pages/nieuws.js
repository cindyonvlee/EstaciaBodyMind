import { init, editButton, reveal, setMeta, postCard, openEditor } from '../site.js';
import { getPosts, esc, looksLoggedIn } from '../api.js';
import { LOTUS_MARK } from '../icons.js';

const s = await init('nieuws');
const seo = s.seo.pages.nieuws;
setMeta({ title: seo.title, description: seo.description, image: s.seo.image });

const posts = await getPosts({ limit: 200 });
const tag = new URLSearchParams(location.search).get('tag');
const allTags = [...new Set(posts.flatMap((p) => p.tags || []))].sort();
const list = tag ? posts.filter((p) => (p.tags || []).includes(tag)) : posts;

const main = document.getElementById('main');
main.classList.remove('loading');
main.innerHTML = `
<section class="page-head">
  <p class="eyebrow">Blog</p>
  <h1>${esc(s.home.newsTitle)}</h1>
  <p>Persoonlijke verhalen, inzichten en kleine oefeningen om dichter bij jezelf te komen.</p>
  <div class="divider">${LOTUS_MARK}</div>
  ${looksLoggedIn() ? '<p style="margin-top:8px"><button type="button" class="btn" id="newpost">+ Nieuw verhaal toevoegen</button></p>' : ''}
</section>
<section style="padding-top:0">
  <div class="wrap">
    ${allTags.length ? `<nav class="filter" aria-label="Filter op onderwerp">
      <a href="/nieuws" class="${!tag ? 'on' : ''}">Alles</a>
      ${allTags.map((t) => `<a href="/nieuws?tag=${encodeURIComponent(t)}" class="${t === tag ? 'on' : ''}">${esc(t)}</a>`).join('')}
    </nav>` : ''}
    ${list.length ? `<div class="posts">${list.map(postCard).join('')}</div>` : '<p class="empty">Er zijn nog geen verhalen geplaatst.</p>'}
  </div>
</section>`;
document.getElementById('newpost')?.addEventListener('click', () => openEditor('#/nieuws/nieuw'));
reveal();
editButton('/admin/#/nieuws', 'Alle verhalen beheren');
