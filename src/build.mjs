// Generatore del sito Evol Group — nessuna dipendenza esterna.
// Uso: node src/build.mjs            -> sito completo in dist/ (per la pubblicazione)
//      node src/build.mjs --anteprima -> un unico file HTML in anteprima/ da aprire nel browser
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITO = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sito.json'), 'utf8'));
const { immobili: IMMOBILI } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/immobili.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(ROOT, 'src/stile.css'), 'utf8');

// ---------- articoli del blog (content/blog/*.md, scritti anche dal pannello Pages CMS) ----------
function leggiArticoli() {
  const dir = path.join(ROOT, 'content/blog');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const fm = {};
    (m ? m[1] : '').split(/\r?\n/).forEach((r) => { const k = r.match(/^([\w-]+):\s*(.*)$/); if (k) { let v = k[2].trim(); if (/^".*"$/.test(v)) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } } else if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/''/g, "'"); fm[k[1]] = v; } });
    if (fm.bozza === 'true') return null;
    return { slug: f.replace(/\.md$/, ''), titolo: fm.titolo || f, data: String(fm.data || '').slice(0, 10), immagine: fm.immagine || '', estratto: fm.estratto || '', categorie: fm.categorie || '', autore: fm.autore || '', corpo: m ? m[2] : txt };
  }).filter(Boolean).sort((a, b) => b.data.localeCompare(a.data));
}
// Markdown essenziale -> HTML (se l'articolo è già in HTML resta com'è)
function markdown(md) {
  if (/<(p|h[1-6]|ul|ol|div|figure|img)\b/i.test(md)) return md;
  const inline = (t) => esc(t).replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|\W)[*_]([^*_]+)[*_](?=\W|$)/g, '$1<em>$2</em>');
  return md.split(/\n{2,}/).map((b) => {
    b = b.trim(); if (!b) return '';
    const h = b.match(/^(#{1,4})\s+(.*)$/); if (h) { const l = Math.max(2, h[1].length); return `<h${l}>${inline(h[2])}</h${l}>`; }
    if (/^[-*]\s/.test(b)) return '<ul>' + b.split(/\n/).map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('') + '</ul>';
    if (/^\d+\.\s/.test(b)) return '<ol>' + b.split(/\n/).map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('') + '</ol>';
    if (/^>\s?/.test(b)) return `<blockquote>${inline(b.replace(/^>\s?/gm, ''))}</blockquote>`;
    return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
const ARTICOLI = leggiArticoli();
const ANTEPRIMA = process.argv.includes('--anteprima');

// ---------- utilità ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const up = (p) => (/^(https?:)?\//.test(p) ? p : SITO.uploads + p);
const euro = (n) => '€ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const prezzoIm = (im) => im.riservata ? 'Trattativa riservata' : euro(im.prezzo) + (im.contratto === 'A' ? ' / mese' : '');
const tel = (t) => t.replace(/[^+\d]/g, '');
const capitalizza = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
// Titolo uniforme: tipologia + numero di locali (+ "con box"), invece del titolo libero di Getrix.
const NOMI_LOCALI = { 1: 'Monolocale', 2: 'Bilocale', 3: 'Trilocale', 4: 'Quadrilocale', 5: 'Pentalocale' };
const haBox = (im) => im.det && im.det.BoxAuto && im.det.BoxAuto !== '255';
function titoloUniforme(im) {
  let t;
  if (im.tipologia === 'Appartamento') t = NOMI_LOCALI[+im.locali] || (+im.locali > 5 ? 'Plurilocale' : 'Appartamento');
  else t = capitalizza((im.tipologia || 'Immobile').toLowerCase());
  return t + (im.tipologia === 'Appartamento' && haBox(im) ? ' con box' : '');
}
const titoloLeggibile = (t) => t; // non più usato per i titoli degli annunci
const dataIt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

const foto = (im, n, misura = 'l') => im.foto && im.foto.ad && im.foto.titoli.length ? `https://res.getrix.it/media/ad/${im.foto.ad}/${n}/${misura}.jpg` : up(SITO.hero);
const planimetria = (im) => im.foto.plan ? `https://mediaserver.getrix.it/plan/${im.foto.plan}/print.jpg` : null;

// Le pagine hanno gli stessi indirizzi del sito attuale.
const PAGINE = []; // { id, url, titolo, descrizione, corpo, classe }
function link(url) {
  if (ANTEPRIMA) {
    const p = PAGINE.find((x) => x.url === url);
    return '#' + (p ? p.id : 'home');
  }
  return '/' + url;
}

// ---------- decodifica dei codici Getrix ----------
function caratteristiche(im) {
  const d = im.det || {};
  const righe = [];
  const add = (k, v) => v !== undefined && v !== null && v !== '' && righe.push([k, v]);
  add('Riferimento', im.rif);
  add('Tipologia', im.tipologia);
  add('Superficie', im.mq ? im.mq + ' m²' : null);
  if (+im.locali > 0) add('Locali', im.locali);
  if (+d.NrCamereLetto) add('Camere da letto', d.NrCamereLetto);
  if (+d.NrBagni || +d.NrServiziIgiene) add('Bagni', d.NrBagni || d.NrServiziIgiene);
  if (d.Piano) add('Piano', d.Piano);
  if (d.PianiEdificio) add('Piani dell’edificio', d.PianiEdificio);
  add('Cucina', { 1: 'Abitabile', 6: 'A vista' }[d.Cucina]);
  add('Riscaldamento', { 1: 'Autonomo', 2: 'Centralizzato' }[d.Riscaldamento]);
  add('Stato', { 2: 'Buono / abitabile', 6: 'Ristrutturato' }[d.StatoManutenzione]);
  if (+d.AnnoCostruzione) add('Anno di costruzione', d.AnnoCostruzione);
  add('Spese condominiali', +im.spese ? euro(+im.spese) + ' / mese' : null);
  if (d.ClasseEnergetica) add('Classe energetica', d.ClasseEnergetica + (+d.IPE ? ` (${String(+d.IPE).replace('.', ',')} kWh/m² anno)` : ''));
  else if (d.InAttesaClasseEnergetica === 'true') add('Classe energetica', 'In attesa di certificazione');
  const dotazioni = [];
  if (+d.NrAscensori) dotazioni.push('Ascensore');
  if (+d.NrBalconi) dotazioni.push(+d.NrBalconi > 1 ? d.NrBalconi + ' balconi' : 'Balcone');
  if (+d.NrTerrazzi) dotazioni.push('Terrazzo');
  if (d.Cantina === '1') dotazioni.push('Cantina');
  if (d.Mansarda === '1') dotazioni.push('Solaio');
  if (d.Portineria === 'true') dotazioni.push('Portineria');
  if (d.GiardinoCondominiale === 'true') dotazioni.push('Giardino condominiale');
  if (d.FibraOttica === 'true' || d.CablaggioRete === 'true') dotazioni.push('Fibra ottica');
  if (d.PortaBlindata === 'true') dotazioni.push('Porta blindata');
  if (d.VideoCitofono === 'true') dotazioni.push('Videocitofono');
  if (d.CancelloElettrico === 'true') dotazioni.push('Cancello elettrico');
  if (d.EsposizioneInterna === 'true' && d.EsposizioneEsterna === 'true') dotazioni.push('Doppia esposizione');
  return { righe, dotazioni };
}
const indirizzo = (im) => [im.strada && im.indirizzo ? capitalizza(im.strada) + ' ' + im.indirizzo + (SITO.mostraCivico && im.civico ? ' ' + im.civico : '') : null, im.comune].filter(Boolean).join(', ');

// ---------- componenti ----------
const ICONE = {
  mq: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM3 14h2v5h5v2H3v-7zm16 0h2v7h-7v-2h5v-5z"/></svg>',
  letto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6h-2v-2H5v2H3zm2-4h14v-2a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2zm2-7V5h10v2H7z"/></svg>',
  bagno: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v2a6 6 0 0 1-5 5.9V22h-2v-2H11v2H9v-2.1A6 6 0 0 1 4 14v-2zm2 2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4H6zM7 4a3 3 0 0 1 3 3H8a1 1 0 0 0-2 0v4H4V7a3 3 0 0 1 3-3z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5z"/></svg>',
  tour: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5 0 9 2.2 9 5 0 2.3-2.8 4.3-6.7 4.8l1.4 1.4-1.4 1.4L10.6 14l3.7-3.6 1.4 1.4-1 1c2.9-.5 4.3-1.8 4.3-2.8 0-1.4-2.9-3-7-3s-7 1.6-7 3c0 .9 1.2 2 3.5 2.6l-.5 2C5 14 3 12.2 3 10c0-2.8 4-5 9-5z"/></svg>',
};

function scheda(im) {
  const d = im.det || {};
  const href = link('property/' + im.slug + '/');
  const voci = [
    im.mq ? `<span>${ICONE.mq}${im.mq} m²</span>` : '',
    +d.NrCamereLetto ? `<span>${ICONE.letto}${d.NrCamereLetto}</span>` : '',
    +d.NrBagni ? `<span>${ICONE.bagno}${d.NrBagni}</span>` : '',
  ].join('');
  return `<article class="card" data-contratto="${im.contratto === 'A' ? 'affitto' : 'vendita'}" data-tipologia="${esc(im.tipologia)}" data-comune="${esc(im.comune)}" data-prezzo="${im.prezzo}" data-locali="${+im.locali || 0}" data-mq="${im.mq}" data-mod="${im.mod}">
  <a href="${href}" class="card-img"><img src="${foto(im, 1, 's')}" alt="${esc(titoloUniforme(im) + ', ' + indirizzo(im))}" loading="lazy"><span class="badge">${im.contratto === 'A' ? 'Affitto' : 'Vendita'}</span></a>
  <div class="card-body">
    <p class="card-prezzo">${prezzoIm(im)}${haBox(im) && im.tipologia === 'Appartamento' ? '<small>box escluso dal prezzo</small>' : ''}</p>
    <h3><a href="${href}">${esc(titoloUniforme(im))}</a></h3>
    <p class="card-luogo">${ICONE.pin}${esc(indirizzo(im))}</p>
    <div class="card-voci">${voci}<span class="card-tipo">${esc(im.tipologia)}</span></div>
  </div>
</article>`;
}

function intestazione(attiva, trasparente) {
  const voci = [['', 'Home'], ['chi-siamo/', 'Chi siamo'], ['servizi/', 'Servizi'], ['immobili/', 'Immobili'], ['blog/', 'Blog'], ['contatti/', 'Contatti']];
  return `<header class="site-header${trasparente ? ' trasparente' : ''}">
  <div class="topbar"><div class="wrap">Contattaci: <a href="mailto:${SITO.email}">${SITO.email}</a> · <a href="tel:${tel(SITO.telefoni[0])}">${SITO.telefoni[0]}</a> · <a href="tel:${tel(SITO.cellulare)}">${SITO.cellulare}</a></div></div>
  <div class="wrap nav-wrap">
    <a href="${link('')}" class="logo"><img src="${up(SITO.logoChiaro)}" alt="${SITO.nome}" width="180" height="56"></a>
    <button class="menu-btn" aria-label="Apri il menu" onclick="document.body.classList.toggle('menu-aperto')"><span></span><span></span><span></span></button>
    <nav class="menu">${voci.map(([u, t]) => `<a href="${link(u)}"${u === attiva ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  </div>
</header>`;
}

const WA = (testo) => `https://wa.me/${tel(SITO.cellulare).replace('+', '')}?text=${encodeURIComponent(testo)}`;
function piede(testoWa = 'Buongiorno, vi contatto dal sito evolgroup.it') {
  return `<a class="whatsapp" href="${WA(testoWa)}" target="_blank" rel="noopener" aria-label="Scrivici su WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg><span>WhatsApp</span></a>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div><img src="${up(SITO.logoColori)}" alt="${SITO.nome}" class="footer-logo" width="200" height="62">
      <p>${esc(SITO.sottotitolo)}</p></div>
    <div><h4>Pagine utili</h4>${[['', 'Home'], ['chi-siamo/', 'Chi siamo'], ['servizi/', 'Servizi'], ['immobili/', 'Immobili'], ['blog/', 'Blog'], ['contatti/', 'Contatti']].map(([u, t]) => `<a href="${link(u)}">${t}</a>`).join('')}</div>
    <div><h4>Contatti</h4><p>${esc(SITO.indirizzo)}</p><p><a href="mailto:${SITO.email}">${SITO.email}</a></p><p>Tel. <a href="tel:${tel(SITO.telefoni[0])}">${SITO.telefoni[0]}</a></p><p>Cell. <a href="tel:${tel(SITO.cellulare)}">${SITO.cellulare}</a></p>
      <p><a href="${SITO.privacy}" rel="noopener">Privacy policy</a> · <a href="${SITO.cookie}" rel="noopener">Cookie policy</a></p></div>
    <div><h4>Newsletter</h4><p>Iscriviti alla newsletter per rimanere aggiornato sui nuovi articoli.</p>
      <form class="newsletter" data-form="newsletter" data-chiave="${esc((SITO.chiaviModuli || {}).generale || '')}"><input type="hidden" name="subject" value="Nuova iscrizione alla newsletter dal sito"><input type="email" name="email" placeholder="La tua email" required aria-label="Email"><button class="btn">Iscriviti</button>
      <label class="check"><input type="checkbox" required><span>Accetto la <a href="${SITO.privacy}">privacy policy</a></span></label><p class="form-esito" hidden></p></form></div>
  </div>
  <div class="wrap copyright">© ${new Date().getFullYear()} ${SITO.ragioneSociale} · P. IVA ${SITO.piva} · ${esc(SITO.indirizzo)}</div>
</footer>`;
}

function moduloContatto({ oggetto = '', destinatario = 'generale', titolo = 'Scrivici' } = {}) {
  const chiave = (SITO.chiaviModuli || {})[destinatario] || (SITO.chiaviModuli || {}).generale || '';
  return `<form class="contatto" data-form="contatto" data-chiave="${esc(chiave)}" data-destinatario="${destinatario}">
  <input type="hidden" name="subject" value="Nuovo messaggio dal sito evolgroup.it"><input type="checkbox" name="botcheck" class="trappola" tabindex="-1" autocomplete="off">
  <h3>${titolo}</h3>
  <div class="campi2"><label>Nome e cognome<input name="nome" required autocomplete="name"></label>
  <label>Telefono<input name="telefono" type="tel" autocomplete="tel"></label></div>
  <label>Email<input name="email" type="email" required autocomplete="email"></label>
  <label>Messaggio<textarea name="messaggio" rows="4" required>${esc(oggetto)}</textarea></label>
  <label class="check"><input type="checkbox" required><span>Ho letto la <a href="${SITO.privacy}">privacy policy</a> e acconsento al trattamento dei dati.</span></label>
  <button class="btn">Invia la richiesta</button>
  <p class="form-esito" hidden></p>
</form>`;
}

// ---------- pagine ----------
function paginaHome() {
  const vendita = IMMOBILI.filter((i) => i.contratto !== 'A');
  const recenti = [...vendita].sort((a, b) => b.mod.localeCompare(a.mod)).slice(0, 6);
  const F = SITO.fiducia || {};
  const stelle = '<span class="stelle" aria-hidden="true">★★★★★</span>';
  const chiave = (SITO.chiaviModuli || {}).vendere || (SITO.chiaviModuli || {}).generale || '';
  return `<section class="hero" style="background-image:linear-gradient(90deg,rgba(10,20,30,.78) 0%,rgba(10,20,30,.55) 45%,rgba(10,20,30,.15) 100%),url('${up(SITO.hero)}')">
  <div class="wrap hero-testo"><h1>${esc(SITO.slogan)}</h1><p>${esc(SITO.sottotitolo)}</p>
  <div class="azioni"><a class="btn" href="${link('immobili/')}">Gli immobili</a><a class="btn btn-chiaro" href="#valutazione">Valuta la tua casa</a></div></div>
</section>
<section class="fascia"><div class="wrap">
  <div class="titolo-sezione"><div><p class="occhiello">Gli immobili</p><h2>In vendita ora</h2></div><a class="link-freccia" href="${link('immobili/')}">Vedi tutti (${IMMOBILI.length}) →</a></div>
  <div class="griglia">${recenti.map(scheda).join('')}</div>
</div></section>
<section class="fiducia"><div class="wrap fiducia-griglia">
  ${F.googleVoto ? `<a class="fiducia-voce" href="${F.googleUrl}" target="_blank" rel="noopener"><strong>${F.googleVoto} ${stelle}</strong><span>${F.googleRecensioni} recensioni su Google</span><em>Leggi le recensioni →</em></a>` : ''}
  ${F.vendutiAffittati ? `<div class="fiducia-voce"><strong>${F.vendutiAffittati}</strong><span>immobili venduti o affittati</span></div>` : ''}
  <div class="fiducia-voce"><strong>${IMMOBILI.length}</strong><span>immobili disponibili oggi</span></div>
  ${F.fimaa ? `<div class="fiducia-voce"><strong>FIMAA</strong><span>agenzia associata alla Federazione Italiana Mediatori Agenti d’Affari</span></div>` : ''}
</div></section>
<section class="valutazione" id="valutazione"><div class="wrap valutazione-griglia">
  <div><p class="occhiello">Vendere casa</p><h2>Quanto vale la tua casa?</h2>
    <p>Richiedi una valutazione gratuita e senza impegno: analizziamo il mercato della tua zona, gli immobili venduti e quelli in vendita, e ti ricontattiamo con una stima realistica.</p>
    <ul class="vantaggi"><li>Valutazione gratuita e senza impegno</li><li>Sopralluogo e analisi di mercato</li><li>Ti seguiamo fino al rogito</li></ul></div>
  <form class="contatto mini-valutazione" data-form="valutazione" data-chiave="${esc(chiave)}">
    <input type="hidden" name="subject" value="Richiesta di valutazione dal sito evolgroup.it"><input type="checkbox" name="botcheck" class="trappola" tabindex="-1" autocomplete="off">
    <label>Indirizzo dell’immobile<input name="indirizzo" required placeholder="Via, numero civico, città" autocomplete="street-address"></label>
    <div class="campi2"><label>Tipologia<select name="tipologia"><option>Appartamento</option><option>Villa / casa indipendente</option><option>Negozio / ufficio</option><option>Box</option><option>Altro</option></select></label>
    <label>Superficie (m²)<input name="superficie" type="number" min="1" inputmode="numeric" placeholder="es. 80"></label></div>
    <div class="campi2"><label>Nome<input name="nome" required autocomplete="name"></label>
    <label>Telefono<input name="telefono" type="tel" required autocomplete="tel"></label></div>
    <label class="check"><input type="checkbox" required><span>Ho letto la <a href="${SITO.privacy}">privacy policy</a> e acconsento a essere ricontattato.</span></label>
    <button class="btn">Richiedi la valutazione gratuita</button>
    <p class="form-esito" hidden></p>
  </form>
</div></section>
<section class="wrap chi-siamo-home">
  <div><p class="occhiello">Chi siamo</p><h2>Tre consulenti, una visione</h2><p>${esc(SITO.chiSiamo)}</p><a class="link-freccia" href="${link('chi-siamo/')}">Scopri di più →</a></div>
  <div class="team">${SITO.team.map((t) => `<figure><img src="${up(t.foto)}" alt="${esc(t.nome)}" loading="lazy"><figcaption>${esc(t.nome)}</figcaption></figure>`).join('')}</div>
</section>
<section class="fascia"><div class="wrap">
  <div class="titolo-sezione"><div><p class="occhiello">Il blog</p><h2>Il blog di Pietro Torcia</h2></div><a class="link-freccia" href="${link('blog/')}">Tutti gli articoli →</a></div>
  <div class="griglia blog">${anteprimeBlog().slice(0, 3).map(cardArticolo).join('')}</div>
</div></section>`;
}

function paginaImmobili() {
  const tipologie = [...new Set(IMMOBILI.map((i) => i.tipologia))].sort();
  const comuni = [...new Set(IMMOBILI.map((i) => i.comune))].sort();
  const opt = (arr) => arr.map((v) => `<option>${esc(v)}</option>`).join('');
  return `<section class="pagina-titolo"><div class="wrap"><h1>Immobili</h1><p>I nostri annunci di immobili in vendita o in affitto.</p></div></section>
<section class="wrap">
  <div class="schede-contratto" role="tablist">
    <button role="tab" data-contratto="vendita" aria-selected="true">In vendita <span>${IMMOBILI.filter((i) => i.contratto !== 'A').length}</span></button>
    <button role="tab" data-contratto="affitto" aria-selected="false">In affitto <span>${IMMOBILI.filter((i) => i.contratto === 'A').length}</span></button>
  </div>
  <form class="filtri" onsubmit="return false">
    <label>Tipologia<select data-filtro="tipologia"><option value="">Tutte</option>${opt(tipologie)}</select></label>
    <label>Comune<select data-filtro="comune"><option value="">Tutti</option>${opt(comuni)}</select></label>
    <fieldset><legend>Locali</legend><div class="minmax"><input type="number" min="1" step="1" inputmode="numeric" placeholder="Min" aria-label="Locali minimo" data-filtro="localiMin"><input type="number" min="1" step="1" inputmode="numeric" placeholder="Max" aria-label="Locali massimo" data-filtro="localiMax"></div></fieldset>
    <fieldset><legend>Prezzo (€)</legend><div class="minmax"><input type="number" min="0" step="10000" inputmode="numeric" placeholder="Min" aria-label="Prezzo minimo" data-filtro="prezzoMin"><input type="number" min="0" step="10000" inputmode="numeric" placeholder="Max" aria-label="Prezzo massimo" data-filtro="prezzoMax"></div></fieldset>
    <label>Ordina per<select data-filtro="ordina"><option value="recenti">Più recenti</option><option value="prezzo-su">Prezzo crescente</option><option value="prezzo-giu">Prezzo decrescente</option><option value="mq">Superficie</option></select></label>
    <button type="button" class="azzera" data-azzera>Azzera filtri</button>
  </form>
  <p class="conteggio" aria-live="polite"></p>
  <div class="griglia" data-elenco>${[...IMMOBILI].sort((a, b) => b.mod.localeCompare(a.mod)).map(scheda).join('')}</div>
  <p class="nessuno" hidden>Nessun immobile corrisponde ai filtri scelti.</p>
  <p class="nessuno-affitto" hidden>Al momento non abbiamo immobili in affitto. <a href="${link('contatti/')}">Scrivici</a> e ti avvisiamo appena ne arriva uno adatto a te.</p>
</section>`;
}

function paginaImmobile(im) {
  const { righe, dotazioni } = caratteristiche(im);
  const tit = titoloUniforme(im);
  const n = Math.max(im.foto.titoli.length, 1);
  const plan = planimetria(im);
  const paragrafi = im.testo.split(/(?<=[.!?])\s+(?=[A-ZÈÀ])/).reduce((acc, f, i) => { const k = Math.floor(i / 3); (acc[k] ||= []).push(f); return acc; }, []).map((p) => `<p>${esc(p.join(' '))}</p>`).join('');
  return `<section class="wrap immobile">
  <nav class="briciole"><a href="${link('')}">Home</a> › <a href="${link('immobili/')}">Immobili</a> › <span>${esc(tit)}</span></nav>
  <div class="immobile-testa"><div><h1>${esc(tit)}</h1><p class="card-luogo">${ICONE.pin}${esc(indirizzo(im))} · zona ${esc(im.zona)}</p></div>
    <div class="prezzo-box"><span class="badge">${im.contratto === 'A' ? 'Affitto' : 'Vendita'}</span><p class="prezzo">${prezzoIm(im)}</p>${haBox(im) && im.tipologia === 'Appartamento' ? '<p class="nota-box">Box escluso dal prezzo: dettagli nella descrizione</p>' : ''}</div></div>
  <div class="galleria" data-galleria data-n="${n}">
    <button class="galleria-principale" data-apri="0"><img src="${foto(im, 1)}" alt="${esc(im.foto.titoli[0])}"></button>
    <div class="galleria-mini">${im.foto.titoli.slice(1, 5).map((t, i) => `<button data-apri="${i + 1}"><img src="${foto(im, i + 2, 's')}" alt="${esc(t)}" loading="lazy">${i === 3 && n > 5 ? `<span>+${n - 5} foto</span>` : ''}</button>`).join('')}</div>
  </div>
  <div class="immobile-corpo">
    <div>
      <div class="cifre">${righe.filter(([k]) => ['Superficie', 'Locali', 'Camere da letto', 'Bagni', 'Piano'].includes(k)).map(([k, v]) => `<div><strong>${esc(v)}</strong><span>${k}</span></div>`).join('')}</div>
      ${im.tour ? `<a class="btn btn-tour" href="${im.tour}" target="_blank" rel="noopener">${ICONE.tour} Visita virtuale a 360°</a>` : ''}
      <h2>Descrizione</h2>${paragrafi}
      <h2>Caratteristiche</h2><dl class="caratteristiche">${righe.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${dotazioni.length ? `<h2>Dotazioni</h2><ul class="dotazioni">${dotazioni.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${plan ? `<h2>Planimetria</h2><button type="button" class="planimetria-btn" data-apri="${im.foto.titoli.length}" aria-label="Ingrandisci la planimetria"><img class="planimetria" src="${plan.replace('http://', 'https://')}" alt="Planimetria" loading="lazy"><span>Clicca per ingrandire</span></button>` : ''}
      ${im.lat ? `<h2>Posizione</h2><div class="mappa-box"><div class="mappa" data-mappa data-lat="${im.lat}" data-lng="${im.lng}" data-etichetta="${esc(tit + ' · ' + indirizzo(im))}"></div><button type="button" class="btn btn-centra" data-centra>${ICONE.pin} Centra sull’immobile</button></div>` : ''}
    </div>
    <aside class="laterale">${moduloContatto({ titolo: 'Ti interessa questo immobile?', oggetto: `Buongiorno, vorrei ricevere informazioni sull’immobile rif. ${im.rif} (${tit}, ${indirizzo(im)}).` })}
      <p class="nota">Oppure chiamaci: <a href="tel:${tel(SITO.telefoni[0])}">${SITO.telefoni[0]}</a> · <a href="tel:${tel(SITO.cellulare)}">${SITO.cellulare}</a></p></aside>
  </div>
  <div class="lightbox" hidden data-lightbox data-foto='${esc(JSON.stringify(im.foto.titoli.map((t, i) => [foto(im, i + 1, 'xxl'), t]).concat(plan ? [[plan.replace('http://', 'https://'), 'Planimetria']] : [])))}'>
    <button class="lb-chiudi" aria-label="Chiudi">×</button><button class="lb-prec" aria-label="Foto precedente">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure><button class="lb-succ" aria-label="Foto successiva">›</button></div>
</section>`;
}

function paginaContatti() {
  return `<section class="pagina-titolo"><div class="wrap"><h1>Contatti</h1></div></section>
<section class="wrap contatti">
  <div><h2>Contatti diretti</h2>
    <p><strong>Email</strong><br><a href="mailto:${SITO.email}">${SITO.email}</a></p>
    <p><strong>Telefono</strong><br><a href="tel:${tel(SITO.telefoni[0])}">${SITO.telefoni[0]}</a></p>
    <p><strong>Cellulare</strong><br><a href="tel:${tel(SITO.cellulare)}">${SITO.cellulare}</a></p>
    <p><strong>Dove siamo</strong><br>${esc(SITO.indirizzo)}</p>
    <div class="mappa-box"><div class="mappa" data-mappa data-lat="45.4765" data-lng="9.2195" data-etichetta="Evol Group · ${esc(SITO.indirizzo)}"></div><button type="button" class="btn btn-centra" data-centra>${ICONE.pin} Centra sull’agenzia</button></div></div>
  <div>${moduloContatto({ titolo: 'Scrivici' })}</div>
</section>`;
}

// ---------- blog ----------
function anteprimeBlog() {
  if (ARTICOLI.length) return ARTICOLI.map((a) => ({ href: link(a.slug + '/'), img: a.immagine, data: a.data, titolo: a.titolo, estratto: a.estratto }));
  return SITO.blog.map((b) => ({ href: `${SITO.dominio}/${b.slug}/`, img: b.img, data: b.data, titolo: b.titolo, estratto: b.estratto }));
}
const cardArticolo = (b) => `<article class="post"><a href="${b.href}">${b.img ? `<img src="${up(b.img)}" alt="" loading="lazy">` : '<span class="post-vuoto"></span>'}</a><p class="data">${b.data ? dataIt(b.data) : ''}</p><h3><a href="${b.href}">${esc(b.titolo)}</a></h3><p>${esc(b.estratto)}</p></article>`;
function paginaBlog() {
  const elenco = anteprimeBlog();
  return `<section class="pagina-titolo"><div class="wrap"><h1>Il blog di Pietro Torcia</h1><p>Aggiornamenti sul mercato immobiliare e preziosi approfondimenti sulle tendenze del settore secondo Pietro Torcia.</p></div></section>
<section class="wrap"><div class="griglia blog">${elenco.map(cardArticolo).join('')}</div>
${ARTICOLI.length ? '' : '<p class="nota">Nell’anteprima compaiono solo gli ultimi articoli: tutti i 61 articoli vengono trasferiti automaticamente al passaggio.</p>'}</section>`;
}
function paginaArticolo(a) {
  const altri = ARTICOLI.filter((x) => x !== a).slice(0, 3).map((x) => ({ href: link(x.slug + '/'), img: x.immagine, data: x.data, titolo: x.titolo, estratto: x.estratto }));
  return `<article class="wrap articolo"><nav class="briciole"><a href="${link('')}">Home</a> › <a href="${link('blog/')}">Blog</a></nav>
  <p class="data">${dataIt(a.data)}${a.autore ? ' · ' + esc(a.autore) : ''}</p><h1>${esc(a.titolo)}</h1>
  ${a.immagine ? `<img class="articolo-copertina" src="${up(a.immagine)}" alt="">` : ''}
  <div class="articolo-testo">${markdown(a.corpo)}</div>
  <div class="articolo-cta"><p><strong>Hai domande su questo argomento?</strong> Contattaci per maggiori informazioni.</p><a class="btn" href="${link('contatti/')}">Contattaci</a></div></article>
${altri.length ? `<section class="fascia"><div class="wrap"><h2>Leggi anche</h2><div class="griglia blog">${altri.map(cardArticolo).join('')}</div></div></section>` : ''}`;
}

// ---------- pagine istituzionali (testi del sito attuale) ----------
const sezione = (titolo, testi, img, inverti) => `<section class="wrap blocco${inverti ? ' inverti' : ''}"><div><h2>${titolo}</h2>${testi.map((t) => `<p>${esc(t)}</p>`).join('')}</div>${img ? `<img src="${up(img)}" alt="" loading="lazy">` : '<div></div>'}</section>`;
const fasciaContatti = () => `<section class="fascia"><div class="wrap contatti"><div><h2>Contattaci</h2><p>Hai domande o desideri ulteriori informazioni? Siamo qui per aiutarti!</p>
  <p>Puoi contattarci per qualsiasi esigenza immobiliare, dalla ricerca della tua nuova casa alla vendita del tuo immobile, o per ricevere una consulenza personalizzata.</p>
  <p><strong>Email</strong><br><a href="mailto:${SITO.email}">${SITO.email}</a></p><p><strong>Telefono</strong><br><a href="tel:${tel(SITO.telefoni[0])}">${SITO.telefoni[0]}</a> · <a href="tel:${tel(SITO.cellulare)}">${SITO.cellulare}</a></p></div>
  <div>${moduloContatto({ titolo: 'Scrivici' })}</div></div></section>`;

function paginaChiSiamo() {
  return `<section class="pagina-titolo"><div class="wrap"><h1>Chi siamo</h1><p>Professionalità, rispetto e fiducia.</p></div></section>
${sezione('L’agenzia', [SITO.chiSiamo], '2026/02/team-evol.jpg')}
<section class="fascia"><div class="wrap due-colonne">
  <div><p class="occhiello">La mission</p><p class="grande">Essere il partner di fiducia per acquirenti e venditori, offrendo supporto personalizzato e soluzioni innovative per raggiungere i loro obiettivi immobiliari con successo e serenità.</p></div>
  <div><p class="occhiello">La vision</p><p class="grande">Creare un ambiente dinamico e stimolante per gli agenti immobiliari, fornendo strumenti avanzati e formazione continua, per eccellere nel settore e rivoluzionare l’esperienza immobiliare con costi contenuti.</p></div>
</div></section>
<section class="wrap"><p class="occhiello">I professionisti</p><h2>Il team</h2><div class="team team-grande">${SITO.team.map((t) => `<figure><img src="${up(t.foto)}" alt="${esc(t.nome)}" loading="lazy"><figcaption>${esc(t.nome)}</figcaption></figure>`).join('')}</div>
<p><a class="link-freccia" href="${link('agente-immobiliare-vittorio-maviglia/')}">Conosci Vittorio Maviglia →</a></p></section>
<section class="cta"><div class="wrap"><h2>Affidandoti a noi potrai semplificare la ricerca del tuo immobile</h2><a class="btn" href="${link('servizi/')}">Scopri i servizi</a></div></section>
${fasciaContatti()}`;
}

function paginaServizi() {
  return `<section class="pagina-titolo"><div class="wrap"><h1>Servizi</h1><p>Dalla valutazione al rogito, con un team di professionisti al tuo fianco.</p></div></section>
${sezione('Intermediazione immobiliare', ['Il mercato immobiliare è in continuo cambiamento, cercare di anticiparlo può essere determinante.', 'È nostro compito rimanere costantemente aggiornati per poter preparare le giuste strategie a seconda degli obiettivi che vuoi raggiungere. La fiducia reciproca è alla base di un rapporto solido e continuativo.'], '2026/02/IMG_0883-copia-2.jpg')}
${sezione('Consulenza immobiliare', ['Che tu voglia acquistare o vendere il tuo immobile, determinare il giusto prezzo di mercato ci permetterà di concludere un buon affare.', 'Sopralluogo all’interno dell’immobile, analisi dell’andamento di mercato, confronto con gli immobili in vendita e venduti, conoscenza della zona e relativi piani di sviluppo sono le principali attività che metteremo in pratica per raggiungere i tuoi obiettivi.'], '2026/02/property-finding-milano-e1772117408409.jpg', true)}
${sezione('Team di professionisti', ['L’unione fa la forza! Ora più che mai avere un team di professionisti è indispensabile per concludere un’operazione immobiliare in totale serenità.', 'Mettiamo a disposizione uno studio tecnico per la verifica di conformità ed eventuali studi di fattibilità, studio notarile per il controllo, la gestione e il recupero dei documenti, studio legale per garantire che tutte le operazioni immobiliari siano svolte in conformità con le leggi e i regolamenti vigenti, un team di fotografi di interni per esaltare le caratteristiche di spazi abitativi e commerciali.'], '2026/02/team-evol.jpg')}
${sezione('Consulenza finanziaria', ['In un contesto sempre più incerto essere supportati da un consulente dedicato è fondamentale: il nostro obiettivo è garantire una valutazione reddituale chiara con tempistiche di erogazione più rapide. La collaborazione con più istituti di credito ci ha permesso negli anni di ottenere vantaggi esclusivi.'], '2026/02/consulenza-finanziaria-milano.jpg', true)}
${sezione('Property finding', ['L’esperienza pluriennale e la ricerca capillare soprattutto nella città di Milano ci hanno permesso di ampliare la nostra rete di contatti utili per poter soddisfare nel minor tempo possibile le richieste di chi ha necessità di acquistare un immobile.', 'Affidandoti a noi potrai semplificare la ricerca del tuo immobile.'], '2026/02/property-finding-case-milano.jpg')}
${fasciaContatti()}`;
}

function paginaVendereCasa() {
  return `<section class="pagina-titolo"><div class="wrap"><h1>Vendere casa</h1><p>Valutiamo il tuo immobile gratuitamente e ti seguiamo fino al rogito.</p></div></section>
<section class="wrap contatti"><div><h2>Come lavoriamo</h2>
  <p>Sopralluogo all’interno dell’immobile, analisi dell’andamento di mercato, confronto con gli immobili in vendita e venduti, conoscenza della zona e relativi piani di sviluppo: così determiniamo il giusto prezzo di mercato.</p>
  <p>Con il nostro studio tecnico, notarile e legale verifichiamo conformità e documenti, e i nostri fotografi valorizzano il tuo immobile negli annunci.</p>
  <p><strong>Preferisci parlarne a voce?</strong><br><a href="tel:${tel(SITO.cellulare)}">${SITO.cellulare}</a> (anche WhatsApp)</p></div>
  <div>${moduloContatto({ titolo: 'Richiedi una valutazione', destinatario: 'vendere', oggetto: 'Vorrei una valutazione del mio immobile in via ' })}</div></section>`;
}

function paginaVittorio() {
  return `<section class="wrap blocco"><div><p class="occhiello">Agente immobiliare Milano</p><h1>Vittorio Maviglia</h1>
  <p class="grande">Il mio unico obiettivo: diventare il tuo punto di riferimento se devi vendere o acquistare casa.</p>
  <p>Negli ultimi anni ho aiutato un’infinità di persone professionalmente, ma la cosa che mi viene maggiormente riconosciuta è l’assistenza dal punto di vista umano.</p>
  <p>Come sempre parlano i fatti e io posso tranquillamente dire che ogni persona che ho assistito dal punto di vista immobiliare ha sempre avuto un’esperienza positiva: sono sempre riuscito a soddisfare le esigenze del cliente attraverso i miei consigli e le mie indicazioni, a 360° nel vero senso della parola!</p>
  <a class="btn" href="#contatta-vittorio">Contattami</a></div><img src="${up('2024/05/FotoVitto2-1-684x1024.png')}" alt="Vittorio Maviglia" class="ritratto"></section>
${sezione('Benvenuto nel mio universo immobiliare', ['Nato e cresciuto in un piccolo borgo della Calabria, nel punto più stretto d’Italia, ho iniziato a lavorare non appena terminati gli studi. Mai stato dipendente ma sempre votato alla gestione libera dell’attività lavorativa.', 'Il vero salto di qualità è avvenuto però non appena arrivato a Milano, una città che mi ha accolto e mi ha realizzato dal punto di vista lavorativo.', 'Gli innumerevoli viaggi effettuati nel corso dei miei 40 anni di vita mi hanno permesso di allargare gli orizzonti e di crescere con una mentalità molto aperta, dote che riporto in maniera del tutto marcata anche nel lavoro che faccio con grandissima passione.', 'Da quando ho fondato la mia società immobiliare Evol Group tutto però è diventato meraviglioso. Gestire il cliente ed il personale seguendo i miei principi e la mia forte etica non ha assolutamente prezzo.'], '2024/07/FotoVitto3-763x1024.png', true)}
<section class="fascia"><div class="wrap"><h2>Come posso aiutarti</h2><div class="tre-box">
  <div><h3>Comprare casa</h3><p>Stai cercando casa? Contattami e troveremo la soluzione migliore per le tue esigenze.</p><a class="link-freccia" href="${link('immobili/')}">Vedi gli immobili →</a></div>
  <div><h3>Vendere casa</h3><p>Stai pensando di vendere casa? Richiedi una valutazione del tuo immobile.</p><a class="link-freccia" href="${link('vendere-casa/')}">Richiedi una valutazione →</a></div>
  <div><h3>Consulenza</h3><p>Hai un problema da risolvere o hai bisogno di informazioni? Contattami, vedrò come posso aiutarti.</p><a class="link-freccia" href="#contatta-vittorio">Contattami →</a></div></div></div></section>
<section class="wrap contatti" id="contatta-vittorio"><div><h2>Un professionista al tuo fianco</h2><p>Se hai necessità di avere un professionista serio ed affermato con uno staff numeroso e preparato al suo fianco sei nel posto giusto.</p><p>In tanti lo dicono ma solo io posso garantirti la competenza e la moralità senza compromessi. Provare per credere.</p></div>
<div>${moduloContatto({ titolo: 'Scrivi a Vittorio', destinatario: 'vendere' })}</div></section>`;
}

function paginaInArrivo(titolo, url) {
  return `<section class="pagina-titolo"><div class="wrap"><h1>${titolo}</h1></div></section>
<section class="wrap in-arrivo"><p>Questa pagina verrà trasferita nella prossima fase con gli stessi contenuti di oggi.</p>
<p><a class="btn" href="${SITO.dominio}/${url}">Vedi la versione attuale</a></p></section>`;
}

// ---------- elenco pagine ----------
PAGINE.push({ id: 'home', url: '', titolo: `${SITO.nome} – Agenzia immobiliare a Milano`, descrizione: SITO.sottotitolo, attiva: '', trasparente: true, corpo: paginaHome });
PAGINE.push({ id: 'immobili', url: 'immobili/', titolo: `Immobili in vendita a Milano – ${SITO.nome}`, descrizione: 'Appartamenti, negozi e box in vendita a Milano e Sesto San Giovanni.', attiva: 'immobili/', corpo: paginaImmobili });
for (const im of IMMOBILI) PAGINE.push({ wa: `Buongiorno, vorrei informazioni sull’immobile rif. ${im.rif} (${titoloUniforme(im)}, ${indirizzo(im)})`, id: 'p-' + im.slug, url: 'property/' + im.slug + '/', titolo: `${titoloUniforme(im)} in ${im.contratto === 'A' ? 'affitto' : 'vendita'} – ${indirizzo(im)} – ${SITO.nome}`, descrizione: im.testo.slice(0, 155), attiva: 'immobili/', immagine: foto(im, 1, 'l'), corpo: () => paginaImmobile(im) });
PAGINE.push({ id: 'contatti', url: 'contatti/', titolo: `Contatti – ${SITO.nome}`, descrizione: `${SITO.indirizzo} · ${SITO.email}`, attiva: 'contatti/', corpo: paginaContatti });
PAGINE.push({ id: 'chi-siamo', url: 'chi-siamo/', titolo: `Chi siamo – ${SITO.nome}`, descrizione: SITO.chiSiamo.slice(0, 155), attiva: 'chi-siamo/', corpo: paginaChiSiamo });
PAGINE.push({ id: 'servizi', url: 'servizi/', titolo: `Servizi – ${SITO.nome}`, descrizione: 'Intermediazione e consulenza immobiliare, consulenza finanziaria e property finding a Milano.', attiva: 'servizi/', corpo: paginaServizi });
PAGINE.push({ id: 'vendere-casa', url: 'vendere-casa/', titolo: `Vendere casa a Milano – ${SITO.nome}`, descrizione: 'Richiedi una valutazione gratuita del tuo immobile a Milano.', attiva: '', corpo: paginaVendereCasa });
PAGINE.push({ id: 'vittorio-maviglia', url: 'agente-immobiliare-vittorio-maviglia/', titolo: `Vittorio Maviglia, agente immobiliare a Milano – ${SITO.nome}`, descrizione: 'Il mio unico obiettivo: diventare il tuo punto di riferimento se devi vendere o acquistare casa.', attiva: 'chi-siamo/', corpo: paginaVittorio });
PAGINE.push({ id: 'blog', url: 'blog/', titolo: `Blog – ${SITO.nome}`, descrizione: 'Il blog di Pietro Torcia sul mercato immobiliare di Milano.', attiva: 'blog/', corpo: paginaBlog });
for (const a of ARTICOLI) PAGINE.push({ id: 'b-' + a.slug, url: a.slug + '/', titolo: `${a.titolo} – ${SITO.nome}`, descrizione: a.estratto.slice(0, 155), immagine: a.immagine ? (a.immagine.startsWith('/') ? SITO.dominio + a.immagine : up(a.immagine)) : null, attiva: 'blog/', corpo: () => paginaArticolo(a) });

// ---------- script del browser (filtri, galleria, moduli, anteprima) ----------
const JS = fs.readFileSync(path.join(ROOT, 'src/sito.js'), 'utf8');

function documento({ titolo, descrizione, immagine, url }, corpoHtml) {
  const canonical = SITO.dominio + '/' + url;
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titolo)}</title><meta name="description" content="${esc(descrizione)}">
<link rel="canonical" href="${canonical}"><link rel="icon" href="${up(SITO.favicon)}">
<meta property="og:title" content="${esc(titolo)}"><meta property="og:description" content="${esc(descrizione)}"><meta property="og:url" content="${canonical}">${immagine ? `<meta property="og:image" content="${immagine}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=Source+Serif+4:wght@600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin defer></script>
<style>${CSS}</style></head>
<body>${corpoHtml}<script>${JS}</script></body></html>`;
}

if (ANTEPRIMA) {
  const sezioni = PAGINE.map((p) => `<div class="vista" data-vista="${p.id}" data-titolo="${esc(p.titolo)}" hidden>${intestazione(p.attiva, p.trasparente)}<main>${p.corpo()}</main>${piede(p.wa)}</div>`).join('\n');
  const banner = `<div class="banner-anteprima">Anteprima del nuovo sito Evol Group · i moduli non inviano ancora messaggi</div>`;
  const out = path.join(ROOT, 'anteprima/evolgroup-anteprima.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, documento(PAGINE[0], banner + sezioni).replace('<body>', '<body class="modalita-anteprima">'));
  console.log('Anteprima scritta in', path.relative(ROOT, out), `(${PAGINE.length} pagine)`);
} else {
  const dist = path.join(ROOT, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  for (const p of PAGINE) {
    const file = path.join(dist, p.url, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, documento(p, `${intestazione(p.attiva, p.trasparente)}<main>${p.corpo()}</main>${piede(p.wa)}`));
  }
  const pub = path.join(ROOT, 'public');
  if (fs.existsSync(pub)) fs.cpSync(pub, dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGINE.map((p) => `  <url><loc>${SITO.dominio}/${p.url}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITO.dominio}/sitemap.xml\n`);
  console.log('Sito scritto in dist/ —', PAGINE.length, 'pagine');
}
