-- ═══════════════════════════════════════════════════════════════
--  Estacia Body & Mind Reset – Supabase database
--  Plak dit hele bestand in Supabase → SQL Editor → Run.
--  Je kunt het veilig opnieuw draaien (bestaande inhoud blijft staan).
-- ═══════════════════════════════════════════════════════════════

-- Instellingen & pagina-inhoud (één rij per onderdeel: site, theme, home, about, services, contact, privacy, seo)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Blog / nieuws
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text default '',
  content text default '',
  image_url text default '',
  image_alt text default '',
  image_title text default '',
  seo_title text default '',
  seo_description text default '',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (status, published_at desc);

-- Berichten via het contactformulier
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 50),
  preference text check (char_length(preference) <= 30),
  message text not null check (char_length(message) between 1 and 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Beveiliging (Row Level Security) ───────────────────────────
-- Iedereen mag lezen wat publiek is; alleen ingelogde beheerder(s) mogen wijzigen.
-- LET OP: zet in Supabase → Authentication → Sign In / Providers "Allow new users to sign up" UIT,
-- zodat alleen de accounts die jij aanmaakt kunnen inloggen.
alter table public.settings enable row level security;
alter table public.posts enable row level security;
alter table public.messages enable row level security;

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (true);
drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all to authenticated using (true) with check (true);

drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts for select using (status = 'published' and published_at <= now());
drop policy if exists "posts_admin_all" on public.posts;
create policy "posts_admin_all" on public.posts for all to authenticated using (true) with check (true);

drop policy if exists "messages_public_insert" on public.messages;
create policy "messages_public_insert" on public.messages for insert to anon, authenticated with check (read = false);
drop policy if exists "messages_admin_all" on public.messages;
create policy "messages_admin_all" on public.messages for all to authenticated using (true) with check (true);

-- ── Opslag voor foto's ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = true;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects for update to authenticated using (bucket_id = 'media');
drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ── Startinhoud ────────────────────────────────────────────────
insert into public.settings (key, value) values ('site', $q${"title":"Estacia","subtitle":"Body & Mind Reset","tagline":"Herstel. Verbind. Creëer vanuit je hart. Behoud je energie.","footerText":"Estacia is mijn zielennaam en staat voor wederopstanding: niet iemand anders worden, maar thuiskomen bij wie je altijd al was.","poweredBy":"Powered by The Pax Meridium"}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('theme', $q${"preset":"zonsopgang","custom":{}}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('home', $q${"heroEyebrow":"Intuïtieve coaching · Reiki","heroTitle":"Ben jij klaar voor jouw","heroScript":"wederopstanding?","heroText":"Intuïtieve coaching voor vrouwen die hun energie willen herstellen, meer willen leven vanuit het hart, met flow, inspiratie en diepgang.","heroImage":{"url":"/img/cindy-portret.webp","alt":"Cindy Onvlee van Estacia Body & Mind Reset, glimlachend in warm zonlicht","title":"Cindy – Estacia Body & Mind Reset"},"ctaPrimary":"Plan een kennismaking","ctaSecondary":"Lees mijn verhaal","introTitle":"Thuiskomen bij wie je altijd al was","introText":"<p>Ik ben Cindy, intuïtief coach, Reiki Master en in opleiding tot holistisch therapeut. Estacia is mijn zielennaam en staat voor <em>wederopstanding</em>: niet iemand anders worden, maar thuiskomen bij wie je altijd al was.</p><p>Samen kijken we naar wat jouw energie kost, wat er mag worden losgelaten en wat er al wél is. Zacht, eerlijk en met aandacht voor lichaam én geest.</p>","quote":"Het is goed zoals het is, in het hier en nu.","quoteSub":"Ik hoef nu niets op te lossen.","spiralTitle":"De Creatiespiraal","spiral":["Helderheid","Loslaten","Inspiratie","Creatie","Integratie"],"newsTitle":"Uit mijn hart"}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('about', $q${"title":"Over mij","script":"Hallo, ik ben Cindy","image":{"url":"/img/cindy-portret.webp","alt":"Portret van Cindy Onvlee","title":"Cindy Onvlee"},"content":"<p>Ik ben Cindy, intuïtief coach, Reiki Master en in opleiding tot holistisch therapeut.</p><p>Estacia is mijn zielennaam en staat voor wederopstanding: niet iemand anders worden, maar thuiskomen bij wie je altijd al was. 🤍</p><p>In de afgelopen jaren heb ik zelf een groot proces doorlopen. Ik weet hoe het voelt om altijd verantwoordelijkheid te dragen, om steeds te kijken naar wat er nog niet goed is. En ik weet ook hoeveel ruimte er ontstaat als je leert zien wat er al wél is.</p><h2>Waar ik je mee help</h2><ul><li>Je energie herstellen en behouden</li><li>Blokkades loslaten zodat je energie weer vrij stroomt</li><li>Leven en creëren vanuit je hart</li><li>Rust en vertrouwen in je lichaam en je hoofd</li></ul><p>Ben jij klaar voor jouw wederopstanding? Ik kijk ernaar uit je te ontmoeten.</p>"}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('services', $q${"title":"Aanbod","intro":"Elke sessie is persoonlijk en afgestemd op wat jij op dit moment nodig hebt.","items":[{"icon":"heart","title":"Intuïtieve coaching","text":"Coaching die raakt en helderheid geeft. We kijken naar wat er onder de oppervlakte speelt.","price":""},{"icon":"target","title":"Loslaten van blokkades","text":"Zodat jouw energie weer vrij kan stromen en je lichter verder kunt.","price":""},{"icon":"spiral","title":"Creëer vanuit je hart","text":"Vol vertrouwen en inspiratie je eigen pad vormgeven.","price":""},{"icon":"lotus","title":"Energie behouden","text":"Zodat jij licht en gecenterd blijft, ook na een volle dag.","price":""},{"icon":"hands","title":"Reiki behandeling","text":"Een diep ontspannende energetische behandeling voor lichaam en geest.","price":""}],"ctaText":"Twijfel je wat bij je past? Neem gerust contact op voor een vrijblijvend kennismakingsgesprek."}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('contact', $q${"title":"Contact","intro":"Wil je een afspraak maken of eerst kennismaken? Bel, app of stuur me een bericht. Ik reageer zo snel mogelijk.","phone":"+31 6 53546242","whatsapp":"31653546242","whatsappText":"Hallo Cindy, ik wil graag meer weten over ","email":"","address":"Nieuwekade 253\n3511 RW Utrecht","mapsUrl":"https://www.google.com/maps/search/?api=1&query=Nieuwekade+253+3511+RW+Utrecht","facebook":"https://www.facebook.com/EstaciaBodyMindReset","instagram":"","hours":"Op afspraak","formIntro":"Laat een bericht achter, dan neem ik contact met je op.","thankYou":"Dankjewel voor je bericht! Ik neem zo snel mogelijk contact met je op. Liefs, Cindy 🤍"}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('privacy', $q${"title":"Privacy","content":"<p>Estacia Body & Mind Reset gaat zorgvuldig om met je persoonsgegevens.</p><h2>Welke gegevens</h2><p>Als je het contactformulier invult, bewaar ik je naam, e-mailadres, telefoonnummer en je bericht. Deze gegevens gebruik ik alleen om contact met je op te nemen.</p><h2>Bewaartermijn</h2><p>Berichten worden niet langer bewaard dan nodig. Je kunt altijd vragen om je gegevens in te zien of te laten verwijderen.</p><h2>Cookies</h2><p>Deze website gebruikt geen tracking- of advertentiecookies.</p>"}$q$::jsonb) on conflict (key) do nothing;
insert into public.settings (key, value) values ('seo', $q${"siteUrl":"","image":"/img/cindy-portret.jpg","pages":{"home":{"title":"Estacia Body & Mind Reset – Intuïtieve coaching & Reiki in Utrecht","description":"Intuïtieve coaching en Reiki voor vrouwen die hun energie willen herstellen en willen leven vanuit het hart. Cindy Onvlee, Utrecht."},"over":{"title":"Over Cindy – Estacia Body & Mind Reset","description":"Maak kennis met Cindy: intuïtief coach, Reiki Master en holistisch therapeut in opleiding."},"aanbod":{"title":"Aanbod – Coaching, Reiki & energiewerk | Estacia","description":"Intuïtieve coaching, loslaten van blokkades, Reiki en energie behouden. Ontdek wat bij jou past."},"nieuws":{"title":"Blog & nieuws – Estacia Body & Mind Reset","description":"Persoonlijke verhalen en inzichten van Cindy over loslaten, dankbaarheid en thuiskomen bij jezelf."},"contact":{"title":"Contact – Estacia Body & Mind Reset","description":"Maak een afspraak of plan een kennismaking. Bel, app of stuur een bericht."},"privacy":{"title":"Privacy – Estacia Body & Mind Reset","description":"Hoe Estacia omgaat met jouw persoonsgegevens."}}}$q$::jsonb) on conflict (key) do nothing;
insert into public.posts (title, slug, excerpt, content, image_url, image_alt, image_title, seo_title, seo_description, tags, status, published_at) values ($q$Het is goed genoeg, hier en nu$q$, $q$het-is-goed-genoeg-hier-en-nu$q$, $q$Als je steeds kijkt naar wat er nog ontbreekt, zie je ook niet meer echt wat er al is.$q$, $q$<p>De afgelopen dagen merkte ik weer hoe snel mijn aandacht gaat naar wat er nog niet goed is.</p>
<p>Ik ben 20 kilo afgevallen, maar kijk naar dat buikje dat er nog zit. Ik ben in zes jaar tijd enorm veranderd, maar kijk naar wat er nog allemaal “moet” in mijn proces. Alsof het nooit genoeg is.</p>
<p>En toen besefte ik: als je steeds kijkt naar wat er nog ontbreekt, zie je ook niet meer echt wat er al is.</p>
<p>Dan is er weinig ruimte voor waardering. Voor tevredenheid. Voor dankbaarheid. Niet omdat je ondankbaar bént, maar omdat je aandacht steeds alweer bij de volgende stap zit.</p>
<p>Bij mij zit daar ook nog een ander thema onder: verantwoordelijkheid dragen. Alsof ik altijd iets moet oplossen, iets moet begrijpen, iets moet dragen.</p>
<p>Dus heb ik een ketting een intentie meegegeven: dankbaarheid. Iedere keer als ik hem vastpak, zeg ik:</p>
<blockquote><p>“Het is goed zoals het is, in het hier en nu. Ik hoef nu niets op te lossen.”</p></blockquote>
<p>Niet om stil te blijven staan. Wel om mezelf eraan te herinneren dat groei niet betekent dat wat er nú is tekortschiet. Soms mag ik ook gewoon zien wat er al veranderd is. Wat er al geheeld is. Wat er al wél is.</p>
<p><strong>En jij? Waar kijk jij vooral naar wat er nog ontbreekt, terwijl er misschien al zoveel is om te waarderen?</strong></p>
<p>Liefs Cindy</p>$q$, $q$/img/het-is-goed-zoals-het-is.webp$q$, $q$Cindy tussen roze bloemen met de tekst: Het is goed zoals het is, in het hier en nu$q$, $q$Het is goed zoals het is, in het hier en nu$q$, $q$Het is goed genoeg, hier en nu | Estacia$q$, $q$Over dankbaarheid, verantwoordelijkheid loslaten en zien wat er al wél is. Een persoonlijk verhaal van Cindy.$q$, array[$q$dankbaarheid$q$,$q$loslaten$q$,$q$zelfacceptatie$q$]::text[], 'published', '2026-10-14T09:00:00Z') on conflict (slug) do nothing;
insert into public.posts (title, slug, excerpt, content, image_url, image_alt, image_title, seo_title, seo_description, tags, status, published_at) values ($q$De verhalen in ons hoofd$q$, $q$de-verhalen-in-ons-hoofd$q$, $q$Niet de situatie zelf, maar het verhaal in ons hoofd roept de emotie op. Over een zesogige vogel in de gang.$q$, $q$<p>Mijn kind vertelde dat hij in het huis van zijn vader bang is voor een vogel die hij in de donkere gang ziet. Een zwarte vogel met rode ogen. En in zijn beleving zelfs zes ogen.</p>
<p>Voor hem voelde die vogel echt spannend. Ik wilde dat niet meteen wegzetten als fantasie. Ik geloof zelf dat kinderen soms veel gevoeliger zijn voor spirituele waarnemingen dan wij volwassenen. Of deze vogel nu uit zijn verbeelding komt, een spirituele waarneming is of misschien zelfs een spirit animal van hem, dat weet ik niet. Maar zijn angst was in ieder geval echt.</p>
<p>Dus gingen we samen eens kijken wat voor vogel het zou kunnen zijn. We zochten op wat hij beschreef en kwamen uit op de koningsdrongo. En juist die vogel staat voor waakzaamheid, moed en bescherming.</p>
<p>Toen konden we er ineens ook anders naar kijken. Misschien staat die vogel daar niet om hem bang te maken. Misschien houdt hij juist de wacht. En misschien heeft hij die zes ogen wel zodat hij extra goed kan zien of alles veilig is. Inmiddels hebben we samen besloten dat dit Ace zijn spirit animal is die over hem waakt. En dan zijn 6 ogen wel verdomd handig!</p>
<p>De vogel veranderde niet. Alleen het verhaal eromheen veranderde. En daarmee veranderde ook zijn gevoel. Zo erg zelfs dat hij de vogel nu welterusten gaat wensen als hij gaat slapen.</p>
<h2>En eigenlijk doen wij dit zelf ook de hele tijd</h2>
<p>Er gebeurt iets en voor we het weten hebben we er in ons hoofd al een heel verhaal van gemaakt. Iemand reageert anders dan normaal: die zal wel boos zijn. Iemand appt niet terug: zie je wel, ik ben niet belangrijk. Iets loopt anders dan verwacht: dit gaat vast mis.</p>
<p>En vervolgens voelen we spanning, verdriet, boosheid of angst. Niet alleen door wat er gebeurt, maar ook door het verhaal dat wij eraan hangen.</p>
<p>Misschien hoeven we dus niet altijd meteen ons eerste verhaal te geloven. Soms helpt het al om jezelf af te vragen: <em>is dit echt wat er aan de hand is, of is er ook nog een andere manier om ernaar te kijken?</em></p>
<p>Van bang zijn voor een zesogige vogel in de gang naar hem welterusten wensen voor het slapen.</p>
<p><strong>En jij? Welke verhalen maak jij nog in je hoofd?</strong></p>
<p>Liefs Cindy</p>$q$, $q$/img/de-verhalen-in-ons-hoofd.webp$q$, $q$Zwarte vogel met rode ogen voor een volle maan met de tekst: Niet de situatie zelf, maar het verhaal in ons hoofd, roept de emotie op$q$, $q$De verhalen in ons hoofd – de koningsdrongo$q$, $q$De verhalen in ons hoofd | Estacia Body & Mind Reset$q$, $q$Hoe een angstaanjagende zesogige vogel een beschermende spirit animal werd – en wat dat zegt over de verhalen die wij onszelf vertellen.$q$, array[$q$gedachten$q$,$q$emoties$q$,$q$spirit animal$q$,$q$kinderen$q$]::text[], 'published', '2026-10-07T09:00:00Z') on conflict (slug) do nothing;
