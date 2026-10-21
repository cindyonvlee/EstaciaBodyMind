import { init, editButton, reveal, setMeta, tel, waLink } from '../site.js';
import { sendMessage, esc } from '../api.js';
import { UI, LOTUS_MARK } from '../icons.js';

const s = await init('contact');
const c = s.contact;
const seo = s.seo.pages.contact;
setMeta({ title: seo.title, description: seo.description, image: s.seo.image });

const main = document.getElementById('main');
main.classList.remove('loading');
main.innerHTML = `
<section class="page-head">
  <p class="eyebrow">Neem contact op</p>
  <h1>${esc(c.title)}</h1>
  <p>${esc(c.intro)}</p>
  <div class="divider">${LOTUS_MARK}</div>
</section>
<section style="padding-top:0">
  <div class="wrap contact-grid">
    <div>
      <div class="quick">
        ${c.whatsapp ? `<a class="wa" href="${waLink(c.whatsapp, c.whatsappText)}" target="_blank" rel="noopener"><span class="qi">${UI.whatsapp}</span><span><strong>Stuur een WhatsApp</strong><small>Vaak het snelst</small></span></a>` : ''}
        ${c.phone ? `<a href="${tel(c.phone)}"><span class="qi">${UI.phone}</span><span><strong>${esc(c.phone)}</strong><small>Bel me gerust</small></span></a>` : ''}
        ${c.email ? `<a href="mailto:${esc(c.email)}"><span class="qi">${UI.mail}</span><span><strong>${esc(c.email)}</strong><small>Mail me</small></span></a>` : ''}
        ${c.facebook ? `<a href="${esc(c.facebook)}" target="_blank" rel="noopener"><span class="qi">${UI.facebook}</span><span><strong>Facebook</strong><small>Volg Estacia</small></span></a>` : ''}
        ${c.instagram ? `<a href="${esc(c.instagram)}" target="_blank" rel="noopener"><span class="qi">${UI.instagram}</span><span><strong>Instagram</strong><small>Volg Estacia</small></span></a>` : ''}
      </div>
      <ul class="details">
        ${c.address ? `<li>${UI.pin}<a href="${esc(c.mapsUrl || '#')}" target="_blank" rel="noopener" style="color:inherit">${esc(c.address).replace(/\n/g, '<br>')}</a></li>` : ''}
        ${c.hours ? `<li>${UI.clock}<span>${esc(c.hours).replace(/\n/g, '<br>')}</span></li>` : ''}
      </ul>
    </div>

    <form class="form reveal" id="afspraak" name="contact" novalidate>
      <h2>Stuur een bericht</h2>
      <p class="muted">${esc(c.formIntro)}</p>
      <input type="hidden" name="form-name" value="contact">
      <p class="hp"><label>Niet invullen <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="field"><label for="f-naam">Naam *</label><input id="f-naam" name="naam" autocomplete="name" required></div>
      <div class="row2">
        <div class="field"><label for="f-email">E-mail *</label><input id="f-email" type="email" name="email" autocomplete="email" inputmode="email" required></div>
        <div class="field"><label for="f-tel">Telefoon</label><input id="f-tel" type="tel" name="telefoon" autocomplete="tel" inputmode="tel"></div>
      </div>
      <fieldset class="field">
        <legend>Hoe mag ik je bereiken?</legend>
        <div class="pills">
          <label><input type="radio" name="voorkeur" value="WhatsApp" checked> WhatsApp</label>
          <label><input type="radio" name="voorkeur" value="Bellen"> Bellen</label>
          <label><input type="radio" name="voorkeur" value="E-mail"> E-mail</label>
        </div>
      </fieldset>
      <div class="field"><label for="f-bericht">Je bericht *</label><textarea id="f-bericht" name="bericht" required placeholder="Waar kan ik je mee helpen?"></textarea></div>
      <label class="check"><input type="checkbox" name="akkoord" required> <span>Ik ga akkoord dat mijn gegevens worden gebruikt om contact met mij op te nemen (<a href="/privacy">privacy</a>).</span></label>
      <button class="btn" type="submit" style="width:100%">Verstuur bericht</button>
      <div class="form-msg" role="status" aria-live="polite"></div>
    </form>
  </div>
</section>`;

const form = document.getElementById('afspraak');
const msg = form.querySelector('.form-msg');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'form-msg';
  if (form['bot-field'].value) return;
  if (!form.checkValidity()) {
    msg.className = 'form-msg err';
    msg.textContent = 'Vul je naam, e-mailadres en bericht in, en vink het akkoord aan.';
    form.querySelector(':invalid')?.focus();
    return;
  }
  const btn = form.querySelector('button');
  btn.disabled = true; btn.textContent = 'Versturen…';
  const fd = new FormData(form);
  const data = { naam: fd.get('naam'), email: fd.get('email'), telefoon: fd.get('telefoon'), voorkeur: fd.get('voorkeur'), bericht: fd.get('bericht') };
  const results = await Promise.allSettled([
    sendMessage({ name: data.naam, email: data.email, phone: data.telefoon, preference: data.voorkeur, message: data.bericht }),
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ 'form-name': 'contact', ...data }).toString() })
      .then((r) => { if (!r.ok) throw new Error(r.status); }),
  ]);
  if (results.some((r) => r.status === 'fulfilled')) {
    form.reset();
    msg.className = 'form-msg ok';
    msg.textContent = c.thankYou;
    btn.textContent = 'Verzonden ✓';
  } else {
    msg.className = 'form-msg err';
    msg.innerHTML = `Het versturen lukte helaas niet. Stuur me gerust een <a href="${waLink(c.whatsapp, c.whatsappText)}" target="_blank" rel="noopener">WhatsApp</a> of bel <a href="${tel(c.phone)}">${esc(c.phone)}</a>.`;
    btn.disabled = false; btn.textContent = 'Verstuur bericht';
  }
});

reveal();
editButton('/admin/#/pagina/contact');
