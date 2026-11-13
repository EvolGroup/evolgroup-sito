// Trasferimento UNA TANTUM dal sito WordPress attuale:
//  - tutti gli articoli del blog -> content/blog/<slug>.md (stesso indirizzo di oggi: evolgroup.it/<slug>/)
//  - le immagini degli articoli e quelle usate dalle pagine -> public/media/...
// Uso: node scripts/migra-wordpress.mjs   (serve internet; si lancia una volta da GitHub Actions)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WP = 'https://evolgroup.it';
const UPLOADS = WP + '/wp-content/uploads/';
const MEDIA = path.join(ROOT, 'public/media');

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'EvolGroup-migrazione' } });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return { dati: await r.json(), pagine: +r.headers.get('X-WP-TotalPages') || 1 };
}
const scaricati = new Set();
async function scaricaMedia(percorsoUploads) {
  const rel = percorsoUploads.split('?')[0];
  if (scaricati.has(rel)) return;
  scaricati.add(rel);
  const dest = path.join(MEDIA, rel);
  if (fs.existsSync(dest)) return;
  const r = await fetch(UPLOADS + rel);
  if (!r.ok) { console.warn('  immagine non trovata:', rel); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}
const yaml = (v) => JSON.stringify(v ?? ''); // stringhe tra virgolette: YAML valido
const pulisci = (html) => html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s(class|style|id|data-[\w-]+|srcset|sizes|decoding|loading|fetchpriority)="[^"]*"/g, '')
  .replace(/https?:\/\/(www\.)?evolgroup\.it\/wp-content\/uploads\//g, '/media/')
  .replace(/https?:\/\/(www\.)?evolgroup\.it\//g, '/')
  .replace(/<p>\s*(&nbsp;)?\s*<\/p>/g, '')
  .replace(/\n{3,}/g, '\n\n').trim();

async function articoli() {
  const cartella = path.join(ROOT, 'content/blog');
  fs.mkdirSync(cartella, { recursive: true });
  let pagina = 1, totali = 1, n = 0;
  do {
    const { dati, pagine } = await json(`${WP}/wp-json/wp/v2/posts?per_page=50&page=${pagina}&_embed=wp:featuredmedia,wp:term`);
    totali = pagine;
    for (const p of dati) {
      const imm = p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
      const categorie = (p._embedded?.['wp:term']?.[0] || []).map((t) => t.name).filter((c) => c !== 'Senza categoria');
      const corpo = p.content.rendered;
      for (const m of corpo.matchAll(/evolgroup\.it\/wp-content\/uploads\/([^"'\s)]+\.(?:jpe?g|png|webp|gif))/gi)) await scaricaMedia(m[1]);
      if (imm.includes('/uploads/')) await scaricaMedia(imm.split('/uploads/')[1]);
      const testo = (s) => s.replace(/<[^>]+>/g, '').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&#8220;|&#8221;/g, '"').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
      const fm = [
        '---',
        `titolo: ${yaml(testo(p.title.rendered))}`,
        `data: ${p.date.slice(0, 10)}`,
        `immagine: ${yaml(imm.includes('/uploads/') ? '/media/' + imm.split('/uploads/')[1] : '')}`,
        `estratto: ${yaml(testo(p.excerpt.rendered).slice(0, 220))}`,
        `categorie: ${yaml(categorie.join(', '))}`,
        `autore: ${yaml('Pietro Torcia')}`,
        '---',
      ].join('\n');
      fs.writeFileSync(path.join(cartella, p.slug + '.md'), fm + '\n' + pulisci(corpo) + '\n');
      n++;
    }
    pagina++;
  } while (pagina <= totali);
  console.log('Articoli trasferiti:', n);
}

async function immaginiPagine() {
  const testi = ['data/sito.json', 'src/build.mjs'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const percorsi = [...new Set(testi.match(/\b20\d\d\/\d\d\/[\w.-]+\.(?:jpe?g|png|webp|gif)/gi) || [])];
  for (const p of percorsi) await scaricaMedia(p);
  console.log('Immagini delle pagine copiate:', percorsi.length);
}

await immaginiPagine();
await articoli();
// da ora le immagini del sito vengono servite dal nuovo sito, non più da WordPress
const sitoFile = path.join(ROOT, 'data/sito.json');
const sito = JSON.parse(fs.readFileSync(sitoFile, 'utf8'));
sito.uploads = '/media/';
fs.writeFileSync(sitoFile, JSON.stringify(sito, null, 2));
console.log('Fatto. Controlla content/blog e public/media, poi pubblica.');
