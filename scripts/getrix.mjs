// Scarica il flusso Getrix e aggiorna data/immobili.json.
// Gira ogni ora su GitHub Actions. Il codice del flusso arriva dal segreto GETRIX_CODICE.
// Uso locale: GETRIX_CODICE=xxxx node scripts/getrix.mjs   (oppure --file percorso.xml|.zip per provare offline)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'data/immobili.json');
const SLUGS = path.join(ROOT, 'data/slug-immobili.json'); // id Getrix -> indirizzo della pagina, per non cambiarlo mai

// ---------- lettura del flusso ----------
async function scarica() {
  const i = process.argv.indexOf('--file');
  if (i > 0) return fs.readFileSync(process.argv[i + 1]);
  const codice = process.env.GETRIX_CODICE;
  if (!codice) throw new Error('Manca GETRIX_CODICE');
  const r = await fetch(`https://feed.getrix.it/xml/${codice}.zip`);
  if (!r.ok) throw new Error('Getrix ha risposto ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

function estraiDalloZip(buf) {
  if (buf.readUInt32LE(0) !== 0x04034b50) return buf.toString('utf8'); // è già XML
  let e = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  let p = buf.readUInt32LE(e + 16);
  const n = buf.readUInt16LE(e + 10);
  for (let k = 0; k < n; k++) {
    const metodo = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const fnl = buf.readUInt16LE(p + 28), exl = buf.readUInt16LE(p + 30), cml = buf.readUInt16LE(p + 32), lho = buf.readUInt32LE(p + 42);
    const nome = buf.slice(p + 46, p + 46 + fnl).toString();
    if (/\.xml$/i.test(nome)) {
      const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
      const dati = buf.slice(start, start + csize);
      return (metodo === 0 ? dati : zlib.inflateRawSync(dati)).toString('utf8');
    }
    p += 46 + fnl + exl + cml;
  }
  throw new Error('Nessun file XML nello zip');
}

// ---------- mini lettore XML (sufficiente per il formato Getrix) ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodifica = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, c) =>
  c[0] === '#' ? String.fromCodePoint(c[1].toLowerCase() === 'x' ? parseInt(c.slice(2), 16) : +c.slice(1)) : (ENT[c] ?? m));
function leggiXml(xml) {
  const radice = { tag: '#', attr: {}, figli: [], testo: '' };
  const pila = [radice];
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    const cima = pila[pila.length - 1];
    if (m[1] !== undefined) cima.testo += m[1];
    else if (m[3]) {
      if (m[2]) { pila.pop(); continue; }
      const attr = {};
      (m[4] || '').replace(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g, (_, k, __, a, b) => { attr[k] = decodifica(a ?? b); });
      const nodo = { tag: m[3], attr, figli: [], testo: '' };
      cima.figli.push(nodo);
      if (!m[5]) pila.push(nodo);
    } else if (m[6]) cima.testo += decodifica(m[6]);
  }
  return radice;
}
const figlio = (n, tag) => n && n.figli.find((f) => f.tag === tag);
const testo = (n, tag) => { const f = figlio(n, tag); const t = f ? f.testo.trim() : ''; return t === '' ? undefined : t; };
const si = (v) => !!v && /^(true|1|si|sì|s)$/i.test(v);

// ---------- conversione nel formato usato dal sito ----------
function converti(i, mostraTutto) {
  const desc = (figlio(i, 'Descrizioni')?.figli || []);
  const it = desc.find((d) => (d.attr.Lingua || '').toUpperCase() === 'IT') || desc[0];
  const altre = Object.fromEntries(desc.filter((d) => d !== it && testo(d, 'Testo')).map((d) => [d.attr.Lingua.toLowerCase(), { titolo: testo(d, 'Titolo'), testo: testo(d, 'Testo') }]));
  const blocco = figlio(i, 'Residenziale') || figlio(i, 'Commerciale');
  const det = {};
  (blocco?.figli || []).forEach((c) => { if (c.testo.trim()) det[c.tag] = c.testo.trim(); });
  const foto = (figlio(i, 'Immagini')?.figli || []).map((im) => ({ url: testo(im, 'URL'), titolo: testo(im, 'Titolo') || '', pos: +(testo(im, 'Posizione') || 0) }))
    .filter((f) => f.url).sort((a, b) => a.pos - b.pos);
  const ad = (foto.map((f) => f.url.match(/media\/ad\/(\d+)\//)).find(Boolean) || [])[1];
  const plan = (foto.map((f) => f.url.match(/plan\/(\d+)\//)).find(Boolean) || [])[1];
  const pubInd = mostraTutto || si(testo(i, 'PubblicaIndirizzo'));
  const pubMappa = si(testo(i, 'PubblicaMappa'));
  return {
    id: i.attr.IDImmobile, rif: testo(i, 'Riferimento'), titolo: testo(it, 'Titolo'), testo: testo(it, 'Testo') || '',
    lingue: Object.keys(altre).length ? altre : undefined,
    contratto: testo(i, 'Contratto'), categoria: testo(i, 'Categoria'), tipologia: testo(i, 'Tipologia'),
    comune: testo(i, 'Comune'), zona: testo(i, 'Zona'), quartiere: testo(i, 'Quartiere'),
    strada: pubInd ? testo(i, 'Strada') : undefined, indirizzo: pubInd ? testo(i, 'Indirizzo') : undefined, civico: pubInd ? testo(i, 'Civico') : undefined,
    lat: pubMappa ? +testo(i, 'Latitudine') : undefined, lng: pubMappa ? +testo(i, 'Longitudine') : undefined,
    prezzo: +testo(i, 'Prezzo') || 0, riservata: si(testo(i, 'TrattativaRiservata')) || undefined,
    mq: +testo(i, 'MQSuperficie') || 0, locali: testo(i, 'NrLocali'), spese: testo(i, 'SpeseMensili'),
    tour: testo(i, 'URLVirtualTour'), mod: (testo(i, 'DataModifica') || testo(i, 'DataInserimento') || '').slice(0, 10),
    det,
    foto: { ad, plan, titoli: foto.filter((f) => /media\/ad\//.test(f.url)).map((f) => f.titolo) },
  };
}

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  const sito = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sito.json'), 'utf8'));
  const xml = estraiDalloZip(await scarica());
  const albero = leggiXml(xml);
  const getrix = figlio(albero, 'Getrix');
  if (!getrix) throw new Error('Formato del flusso non riconosciuto');
  const immobili = getrix.figli.filter((f) => f.tag === 'Immobile').map((i) => converti(i, sito.mostraCivico));
  // sicurezza: se il flusso arriva vuoto per un errore di Getrix, non svuotiamo il sito
  const precedenti = fs.existsSync(DEST) ? JSON.parse(fs.readFileSync(DEST, 'utf8')).immobili : [];
  if (immobili.length === 0 && precedenti.length > 2) throw new Error('Flusso vuoto: tengo gli immobili precedenti');

  const slugs = fs.existsSync(SLUGS) ? JSON.parse(fs.readFileSync(SLUGS, 'utf8')) : Object.fromEntries(precedenti.map((p) => [p.id, p.slug]));
  const usati = new Set(Object.values(slugs));
  for (const im of immobili) {
    if (!slugs[im.id]) {
      const nomi = { 1: 'monolocale', 2: 'bilocale', 3: 'trilocale', 4: 'quadrilocale', 5: 'pentalocale' };
      const tipo = im.tipologia === 'Appartamento' ? (nomi[+im.locali] || 'appartamento') : im.tipologia;
      const base = slugify([tipo, im.contratto === 'A' ? 'affitto' : '', im.strada, im.indirizzo, im.comune].filter(Boolean).join(' ')) || 'immobile-' + im.id;
      let s = base, n = 2; while (usati.has(s)) s = base + '-' + n++;
      slugs[im.id] = s; usati.add(s);
    }
    im.slug = slugs[im.id];
  }
  fs.writeFileSync(SLUGS, JSON.stringify(slugs, null, 1));
  fs.writeFileSync(DEST, JSON.stringify({ _fonte: 'Flusso Getrix, aggiornato il ' + new Date().toISOString(), immobili }, null, 1));
  console.log(`Getrix: ${immobili.length} immobili (${immobili.filter((i) => i.contratto === 'A').length} in affitto)`);
}
main().catch((e) => { console.error('ERRORE Getrix:', e.message); process.exit(1); });
