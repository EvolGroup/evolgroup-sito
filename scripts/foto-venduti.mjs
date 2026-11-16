// Copia nel sito le foto dei venduti/affittati (così restano anche se Getrix o immobiliare.it le cancellano).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data/venduti.json');
const dati = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const cartella = path.join(ROOT, 'public/media/venduti');
fs.mkdirSync(cartella, { recursive: true });
let copiate = 0;
async function copia(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  copiate++;
}
for (const v of dati.immobili) {
  const id = String(v.id).replace(/[^\w-]/g, '');
  try {
    if (/^https?:/.test(v.foto || '')) { await copia(v.foto, path.join(cartella, id + '.jpg')); v.foto = '/media/venduti/' + id + '.jpg'; }
    if (Array.isArray(v.galleria)) {
      for (let k = 0; k < v.galleria.length; k++) {
        if (!/^https?:/.test(v.galleria[k])) continue;
        await copia(v.galleria[k], path.join(cartella, id, (k + 1) + '.jpg'));
        v.galleria[k] = `/media/venduti/${id}/${k + 1}.jpg`;
      }
    }
  } catch (e) { console.warn('foto non disponibile per', v.id, e.message); }
}
// alleggerimento: la galleria completa resta solo per gli ultimi 20 confermati (quelli in pagina) e per i "da confermare";
// agli altri resta la foto principale. Stesso numero di src/build.mjs (MAX_VENDUTI).
const MAX_VENDUTI = 20;
const confermati = dati.immobili.filter((v) => v.stato === 'venduto' || v.stato === 'affittato').sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
const inPagina = new Set(confermati.slice(0, MAX_VENDUTI));
const unMeseFa = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
let alleggeriti = 0;
for (const v of dati.immobili) {
  if (!Array.isArray(v.galleria) || !v.galleria.length || v.stato === 'da confermare' || inPagina.has(v)) continue;
  if (v.stato === 'nascondi' && String(v.data || '') >= unMeseFa) continue; // appena nascosto: aspetto un mese, nel caso ci ripensi
  fs.rmSync(path.join(cartella, String(v.id).replace(/[^\w-]/g, '')), { recursive: true, force: true });
  v.galleria = [];
  alleggeriti++;
}
if (alleggeriti) console.log('Gallerie alleggerite (fuori dagli ultimi ' + MAX_VENDUTI + '):', alleggeriti);
if (copiate || alleggeriti) fs.writeFileSync(FILE, JSON.stringify(dati, null, 1));
console.log('Foto dei venduti copiate:', copiate);
