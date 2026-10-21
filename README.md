# Estacia Body & Mind Reset – website

Statische website (HTML/CSS/JS, geen build-stap) op **Netlify**, met **Supabase** voor inhoud, login, foto's en contactberichten.
Cindy beheert alles zelf via `/admin`.

```
public/                 ← wordt door Netlify gepubliceerd
  index.html, over-mij.html, aanbod.html, nieuws.html, artikel.html, contact.html, privacy.html, 404.html
  admin/                ← beheeromgeving (login via Supabase)
  js/config.js          ← ⚙️ Supabase URL + publishable key + credit websitebouwer (NIET via admin aanpasbaar)
  js/defaults.js        ← startinhoud (ook terugval als de database niet bereikbaar is)
  js/themes.js          ← de 6 kleurstijlen
  vendor/               ← supabase-js, Quill (editor), DOMPurify – lokaal, geen CDN nodig
netlify/edge-functions/ ← SEO/Open Graph in de HTML (voor Google, Facebook, WhatsApp) + sitemap.xml/robots.txt
supabase/schema.sql     ← tabellen, beveiliging, foto-opslag en startinhoud
```

## Opleveren in 5 stappen

### 1. Supabase
1. Maak een nieuw project aan op [supabase.com](https://supabase.com). Kies regio **EU (Frankfurt)** vanwege de AVG.
2. Ga naar **SQL Editor** → plak de inhoud van `supabase/schema.sql` → **Run**.
   Dit maakt de tabellen, de beveiliging, de foto-bucket `media` en de startinhoud (incl. de 2 Facebook-verhalen).
3. Ga naar **Authentication → Sign In / Providers** en zet **Allow new users to sign up** op **UIT**.
4. Ga naar **Authentication → Users → Add user** en maak Cindy aan (e-mail + tijdelijk wachtwoord, *Auto Confirm* aan).
5. Ga naar **Authentication → URL Configuration**:
   - Site URL: `https://www.haar-domein.nl`
   - Redirect URLs: `https://www.haar-domein.nl/admin/` (en eventueel `https://*.netlify.app/admin/` voor testen)
6. Kopieer bij **Project Settings → API Keys** de **Publishable key** (`sb_publishable_…`) naar `SUPABASE_KEY` in `public/js/config.js`, en de *Project URL* (Project Settings → Data API) naar `SUPABASE_URL`.
   De oude *anon* key (tab "Legacy API Keys") werkt ook. **Nooit** de *Secret key* gebruiken.

### 2. GitHub
Zet deze map in een (privé) repository en push naar `main`.

### 3. Netlify
1. **Add new site → Import from GitHub** → kies de repo. Build-instellingen komen uit `netlify.toml` (publish = `public`, geen build command).
2. **Forms**: zet *Form detection* aan. Bij **Forms → Notifications** een e-mailmelding naar Cindy instellen.
   Berichten komen daarnaast altijd binnen in de admin bij **Berichten**.
3. **Domain management**: voeg Cindy's eigen domein toe (HTTPS gaat automatisch).

### 4. Eerste keer inloggen
Ga naar `https://haar-domein.nl/admin/`, log in, en vul bij **Instellingen → Webadres van de site** het domein in (voor sitemap en deel-links).
Vul bij **Pagina's → Contact** nog haar e-mailadres en eventueel Instagram in.

### 5. Overdracht
Geef Cindy haar login + `HANDLEIDING.md` (dezelfde uitleg staat ook in de admin onder **Hulp**).
Laat haar meteen een eigen wachtwoord kiezen via **Instellingen → Wachtwoord wijzigen**.

## Wat Cindy zelf kan
- Blog/nieuws: schrijven met opmaak, foto's (automatisch verkleind naar webp), tags, concept/gepland publiceren.
- SEO per verhaal en per pagina: URL-slug, SEO-titel, meta-omschrijving, alt-tekst + titel van foto's, met Google- en Facebook-voorbeeld.
- Delen naar Facebook, WhatsApp en Instagram (telefoon: deelmenu met foto; computer: tekst kopiëren + foto downloaden). Bezoekers hebben dezelfde knoppen onder elk verhaal.
- Alle pagina's (Home, Over mij, Aanbod, Contact, Privacy) en contactgegevens aanpassen.
- 6 kleurstijlen (Gouden Zonsopgang, Lavendel Avond, Rozentuin, Aarde & Honing, Maanlicht, Zonnebloem) + losse kleuren.
- Bewerken vanaf de website zelf: ingelogd ziet ze onderaan een werkbalk (**+ Nieuw verhaal**, **Bewerk deze pagina/dit verhaal**, kleuren, volledig beheer). Die opent een zijpaneel óp de site (de admin in `?embed=1`-modus); na opslaan ververst de pagina. Inloggen kan via de link **Inloggen** in de footer.
- Na opslaan gaat ze direct naar de pagina zelf.

## Credit websitebouwer
Eigen donkere strook onder de footer op elke pagina: *"Ook zo'n website? Neem contact op met de websitebeheerder"* + groene WhatsApp-knop **Jobe United Solutions · 06-17039432** (opent WhatsApp met vooraf ingevulde tekst).
Aanpassen kan alleen in `public/js/config.js` (`DEVELOPER`), dus niet via de admin.

## Lokaal bekijken
Zonder Supabase-sleutels draait de site in **demo-modus** met de startinhoud, ook de admin (opslaan is dan uitgeschakeld):
```
npx netlify-cli dev     # inclusief edge functions en /nieuws/* rewrite
```
