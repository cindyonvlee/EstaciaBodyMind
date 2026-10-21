import { init } from '../site.js';
import { LOTUS_MARK } from '../icons.js';

await init('');
const main = document.getElementById('main');
main.classList.remove('loading');
main.innerHTML = `
<section class="page-head" style="min-height:50vh">
  <div class="divider">${LOTUS_MARK}</div>
  <h1>Deze pagina bestaat niet (meer)</h1>
  <p>Misschien is ze verhuisd. Ga terug naar het begin en kijk rustig verder.</p>
  <p style="margin-top:28px"><a class="btn" href="/">Naar de homepage</a></p>
</section>`;
