// Crea public/_redirects: ogni indirizzo del vecchio sito WordPress che non esiste nel nuovo
// viene reindirizzato (301) alla pagina nuova più adatta, così Google e i link già condivisi non finiscono su un errore.
// Va lanciato una volta, PRIMA del passaggio del dominio, mentre il vecchio sito è ancora online.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VECCHIO = 'https://evolgroup.it';

async function testo(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

// 1) tutti gli indirizzi del vecchio sito, dalle sitemap di Yoast
const indice = locs(await testo(VECCHIO + '/sitemap_index.xml'));
const vecchi = new Set();
for (const s of indice) for (const u of locs(await testo(s))) vecchi.add(new URL(u).pathname);
console.log('Indirizzi nel vecchio sito:', vecchi.size);

// 2) le pagine del nuovo sito
execSync('node src/build.mjs', { cwd: ROOT, stdio: 'inherit' });
const esiste = (p) => fs.existsSync(path.join(ROOT, 'dist', p, p.endsWith('/') ? 'index.html' : '')) || fs.existsSync(path.join(ROOT, 'dist', p));

// 3) dove mandare ciò che non esiste più
function destinazione(p) {
  if (/^\/property\//.test(p)) return '/immobili/';
  if (/^\/(property_type|property_status|property_city|property_area|property_state|property_feature|property_label)\//.test(p)) return '/immobili/';
  if (/^\/(agent|agency|houzez_agent|agent_category)\//.test(p)) return '/chi-siamo/';
  if (/^\/(category|tag|author)\//.test(p) || /^\/blog\/page\//.test(p)) return '/blog/';
  if (/vendere/.test(p)) return '/vendere-casa/';
  if (/contatt/.test(p)) return '/contatti/';
  return '/';
}
const righe = [];
for (const p of [...vecchi].sort()) {
  if (p === '/' || esiste(p)) continue;
  righe.push(`${p} ${destinazione(p)} 301`);
}
// regole generali per indirizzi non presenti nelle sitemap (pagine 2, 3… degli archivi, feed, ecc.)
const generali = [
  '/property_type/* /immobili/ 301', '/property_status/* /immobili/ 301', '/property_city/* /immobili/ 301', '/property_area/* /immobili/ 301',
  '/agent/* /chi-siamo/ 301', '/houzez_agent/* /chi-siamo/ 301', '/agent_category/* /chi-siamo/ 301',
  '/category/* /blog/ 301', '/tag/* /blog/ 301', '/author/* /blog/ 301', '/blog/page/* /blog/ 301',
  '/feed/ /blog/ 301', '/comments/feed/ /blog/ 301', '/wp-admin/* / 301', '/wp-login.php / 301',
  '/user-dashboard/ / 301', '/compare-properties/ /immobili/ 301', '/search-result-page/ /immobili/ 301',
];
const file = path.join(ROOT, 'public/_redirects');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, ['# Reindirizzamenti dal vecchio sito WordPress (generato da scripts/redirect-vecchio-sito.mjs)', ...righe, '', '# Regole generali', ...generali, ''].join('\n'));
console.log('Reindirizzamenti specifici:', righe.length);
console.log(righe.join('\n'));
