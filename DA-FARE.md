# Da fare – nuovo sito Evol Group

Aggiornato al 15/11/2026.

## Prima del passaggio del dominio
- [x] Reindirizzamenti dei vecchi indirizzi WordPress (public/_redirects, 37 indirizzi + regole generali) e pagina 404.
- [ ] **Email: correggere l'SPF** (oggi autorizza solo Register, non Google): `v=spf1 include:_spf.google.com ~all`.
- [ ] **Email: attivare la firma DKIM** in Google Workspace (admin.google.com → App → Gmail → Autentica email) e pubblicare il record TXT.
- [ ] **iubenda: scegliere il piano a pagamento** (Essentials). Il piano gratuito non permette altri servizi e copre poche visite al mese.
- [ ] **iubenda: aggiungere alla policy** Cloudflare (categoria "Ottimizzazione e distribuzione del traffico") e OpenStreetMap Widget ("Visualizzazione di contenuti da piattaforme esterne"). Il sito li usa già.
- [x] **Google Analytics 4**: proprietà "evolgroup.it" (pietro.torcia@evolgroup.it), ID G-ZPP99CYYXT, installato con Consent Mode v2.
- [ ] **Google Analytics: segnare "generate_lead" come evento chiave** (Amministrazione → Eventi), dopo il primo invio di un modulo.
- [ ] **Google Search Console**: verificare evolgroup.it con l'account dell'agenzia.
- [ ] **Invio di prova** dei moduli (contatti, valutazione, scheda immobile, newsletter) e controllo dell'arrivo a info@evolgroup.it.
- [ ] **Passaggio del dominio** evolgroup.it su Cloudflare Pages, mantenendo i record MX di Google Workspace.
- [ ] **Pages CMS**: collegare il pannello per blog e venduti/affittati.

## Quando si avvia la pubblicità
- [ ] **Pixel di Meta**: creare il Meta Business e il Pixel, poi inserire l'ID nel sito e aggiungere "Monitoraggio conversioni di Meta ads (pixel di Meta)" in iubenda. Da fare 2–4 settimane prima delle campagne.
- [ ] **Pagine di atterraggio** dedicate alle campagne (chi vende, chi compra, per zona).
- [ ] **Tracciamento della provenienza dei contatti** (UTM) nei moduli.

## Più avanti
- [ ] Aggiungere info@evolgroup.it come secondo utente su iubenda, Google Analytics e Cloudflare.
- [ ] Altri componenti del team in home (nome, cognome, ruolo).
- [ ] Sostituire la foto della home se ne arriva una vostra (almeno 1920 px).
- [ ] Modulo "Cerchi casa?" per raccogliere gli acquirenti.
- [ ] Aggiornare a mano i numeri della fascia di fiducia (recensioni Google, venduti) in `data/sito.json`.
