# Da fare – nuovo sito Evol Group

Aggiornato al 16/11/2026.

## Prima del passaggio del dominio
- [x] Reindirizzamenti dei vecchi indirizzi WordPress (public/_redirects, 37 indirizzi + regole generali) e pagina 404.
- [x] **Email: correggere l'SPF** (oggi autorizza solo Register, non Google): `v=spf1 include:_spf.google.com ~all`.
- [x] **Email: firma DKIM attiva** (record su Cloudflare, autenticazione avviata in Google Admin).
- [ ] **iubenda: scegliere il piano a pagamento** (Essentials). Il piano gratuito non permette altri servizi e copre poche visite al mese.
- [ ] **iubenda: aggiungere alla policy** Cloudflare (categoria "Ottimizzazione e distribuzione del traffico") e OpenStreetMap Widget ("Visualizzazione di contenuti da piattaforme esterne"). Il sito li usa già.
- [x] **Google Analytics 4**: proprietà "evolgroup.it" (pietro.torcia@evolgroup.it), ID G-ZPP99CYYXT, installato con Consent Mode v2.
- [ ] **Google Analytics: segnare come eventi chiave** generate_lead, contatto_telefono, contatto_email (Amministrazione → Eventi → Eventi recenti → stellina). contatto_whatsapp già segnato (16/11).
- [x] **Google Search Console**: proprietà di dominio evolgroup.it verificata (pietro.torcia@evolgroup.it), sitemap inviata (85 pagine).
- [x] **Invio di prova** dei 4 moduli: arrivano tutti a info@evolgroup.it (16/11).
- [x] **Passaggio del dominio** evolgroup.it su Cloudflare Pages (16/11/2026). Eliminato il vecchio MX di verifica Google, che bloccava il registro .it.
- [x] **Reindirizzare www.evolgroup.it → evolgroup.it** (Cloudflare → Regole → Redirect Rule), così il consenso cookie e Google vedono un solo indirizzo.
- [x] **WordPress Business su Register: rinnovo automatico tolto** (16/11/2026). Resta pagato fino al 28/05/2027, poi si chiude da solo.
- [ ] **Dominio su Register**: rinnovo automatico attivo (scade il 05/04/2027, prelievo ~20 giorni prima). Verificare che il metodo di pagamento salvato sia valido.
- [x] **Pages CMS** collegato (app.pagescms.org → evolgroup-sito): blog e venduti/affittati.
- [ ] **Avviso annunci usciti da Getrix** (issue GitHub, email a pietro.torcia@evolgroup.it): Watch → Custom → Issues attivato il 16/11; verificare l'arrivo al primo avviso reale e chiudere l'avviso di prova.
- [x] **Venduti: in pagina solo gli ultimi 20** (per data); gli altri restano nell'archivio e perdono la galleria, tenendo la foto principale.

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
