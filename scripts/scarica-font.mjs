// Scarica i caratteri del sito da Google Fonts e li salva in public/fonti/, così il sito non contatta
// i server di Google per i font (nessun dato del visitatore a terzi senza consenso).
// Si esegue una volta (o quando si cambiano i font) dal workflow "Scarica i font": node scripts/scarica-font.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_CSS = 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=Source+Serif+4:wght@600&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SOTTOINSIEMI = ['latin', 'latin-ext']; // italiano e caratteri europei

const css = await (await fetch(URL_CSS, { headers: { 'User-Agent': UA } })).text();
const blocchi = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g)];
if (!blocchi.length) throw new Error('Nessun @font-face trovato nella risposta di Google Fonts');
const dir = path.join(ROOT, 'public/fonti');
fs.mkdirSync(dir, { recursive: true });
let out = '/* Font ospitati sul sito (generato da scripts/scarica-font.mjs, non modificare a mano) */\n';
const fatti = new Map();
for (const [, sotto, blocco] of blocchi) {
  if (!SOTTOINSIEMI.includes(sotto)) continue;
  const fam = blocco.match(/font-family:\s*'([^']+)'/)[1];
  const peso = blocco.match(/font-weight:\s*(\d+)/)[1];
  const url = blocco.match(/url\((https:[^)]+\.woff2)\)/)[1];
  let nome = fatti.get(url);
  if (!nome) {
    nome = `${fam.toLowerCase().replace(/\s+/g, '-')}-${sotto}-${fatti.size + 1}.woff2`;
    const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    fs.writeFileSync(path.join(dir, nome), buf);
    fatti.set(url, nome);
    console.log('scaricato', nome, buf.length, 'byte', '(peso', peso + ')');
  }
  out += blocco.replace(url, '/fonti/' + nome).replace(/\s+/g, ' ') + '\n';
}
fs.writeFileSync(path.join(ROOT, 'src/font.css'), out);
console.log('scritto src/font.css con', fatti.size, 'file');
