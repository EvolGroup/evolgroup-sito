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
for (const v of dati.immobili) {
  if (!/^https?:/.test(v.foto || '')) continue;
  const nome = String(v.id).replace(/[^\w-]/g, '') + '.jpg';
  try {
    const r = await fetch(v.foto);
    if (!r.ok) { console.warn('foto non disponibile', v.id, r.status); continue; }
    fs.writeFileSync(path.join(cartella, nome), Buffer.from(await r.arrayBuffer()));
    v.foto = '/media/venduti/' + nome; copiate++;
  } catch (e) { console.warn('errore foto', v.id, e.message); }
}
if (copiate) fs.writeFileSync(FILE, JSON.stringify(dati, null, 1));
console.log('Foto dei venduti copiate:', copiate);
