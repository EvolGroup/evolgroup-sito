# Sito Evol Group

Sito statico generato da `src/build.mjs` (nessuna dipendenza esterna, Node 22).

| Cosa | Dove |
|---|---|
| Testi e recapiti dell'agenzia | `data/sito.json` |
| Immobili (aggiornati ogni ora da Getrix) | `data/immobili.json` ← `scripts/getrix.mjs` |
| Articoli del blog | `content/blog/*.md` (si modificano da Pages CMS) |
| Immagini | `public/media/` |
| Grafica | `src/stile.css` · comportamento: `src/sito.js` |

Comandi:
- `node src/build.mjs` → sito completo in `dist/`
- `node src/build.mjs --anteprima` → un solo file HTML di anteprima in `anteprima/`
- `GETRIX_CODICE=… node scripts/getrix.mjs` → aggiorna gli immobili

Pubblicazione: GitHub Actions (`.github/workflows/sito.yml`) costruisce e pubblica su Cloudflare Pages
a ogni modifica e ogni ora se Getrix cambia. Segreti richiesti nel repository:
`GETRIX_CODICE`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

Gli indirizzi delle pagine sono gli stessi del vecchio sito WordPress (`/property/<nome>/`, `/<articolo>/`, `/chi-siamo/` …).
