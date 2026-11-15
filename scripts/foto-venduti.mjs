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
if (copiate) fs.writeFileSync(FILE, JSON.stringify(dati, null, 1));
console.log('Foto dei venduti copiate:', copiate);
