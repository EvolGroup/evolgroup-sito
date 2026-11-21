# Da fare – nuovo sito Evol Group

Aggiornato al 21/11/2026.

## Prima del passaggio del dominio
- [x] Reindirizzamenti dei vecchi indirizzi WordPress (public/_redirects, 37 indirizzi + regole generali) e pagina 404.
- [x] **Email: correggere l'SPF** (oggi autorizza solo Register, non Google): `v=spf1 include:_spf.google.com ~all`.
- [x] **Email: firma DKIM attiva** (record su Cloudflare, autenticazione avviata in Google Admin).
- [x] **iubenda Essentials** attivo dal 16/11/2026 (annuale, fino a 25.000 pagine viste/mese).
- [x] **iubenda: policy completata** con Cloudflare, OpenStreetMap Widget, unpkg, Google Tag Manager, WhatsApp (oltre a GA4, Google Fonts, moduli, newsletter). Scansione: 86%.
- [x] **Google Analytics 4**: proprietà "evolgroup.it" (pietro.torcia@evolgroup.it), ID G-ZPP99CYYXT, installato con Consent Mode v2.
- [x] **Google Analytics: eventi chiave** generate_lead, contatto_whatsapp, contatto_telefono, contatto_email (17/11).
- [x] **Google Search Console**: proprietà di dominio evolgroup.it verificata (pietro.torcia@evolgroup.it), sitemap inviata (85 pagine).
- [x] **Invio di prova** dei 4 moduli: arrivano tutti a info@evolgroup.it (16/11).
- [x] **Passaggio del dominio** evolgroup.it su Cloudflare Pages (16/11/2026). Eliminato il vecchio MX di verifica Google, che bloccava il registro .it.
- [x] **Reindirizzare www.evolgroup.it → evolgroup.it** (Cloudflare → Regole → Redirect Rule), così il consenso cookie e Google vedono un solo indirizzo.
- [x] **WordPress Business su Register: rinnovo automatico tolto** (16/11/2026). Resta pagato fino al 28/05/2027, poi si chiude da solo.
- [ ] **Dominio su Register**: rinnovo automatico attivo (scade il 05/04/2027, prelievo ~20 giorni prima). Verificare che il metodo di pagamento salvato sia valido.
- [x] **Pages CMS** collegato (app.pagescms.org → evolgroup-sito): blog e venduti/affittati.
- [ ] **Avviso annunci usciti da Getrix** (issue GitHub, email a info@evolgroup.it): Watch → Custom → Issues attivato il 16/11; verificare l'arrivo al primo avviso reale e chiudere l'avviso di prova.
- [x] **Venduti: in pagina solo gli ultimi 20** (per data); gli altri restano nell'archivio e perdono la galleria, tenendo la foto principale.

## Quando si avvia la pubblicità
- [ ] **Pixel di Meta**: creare il Meta Business e il Pixel, poi inserire l'ID nel sito e aggiungere "Monitoraggio conversioni di Meta ads (pixel di Meta)" in iubenda. Da fare 2–4 settimane prima delle campagne.
- [ ] **Pagine di atterraggio** dedicate alle campagne (chi vende, chi compra, per zona).
- [x] **Provenienza dei contatti** nei moduli (UTM, gclid/fbclid, motori di ricerca, portali, diretto): arriva nell'email come "provenienza", "campagna", "annuncio", "pagina_di_arrivo".
- [x] **Anteprime social/WhatsApp** (Open Graph completo: prezzo, locali, m², indirizzo e foto) e **dati strutturati** schema.org (agenzia, immobili, articoli).
- [x] **Home: 3 anteprime** di immobili invece di 6.

## Google Ads e consenso (20–21/11/2026)
- [x] **GA4: evento `lead_valutazione`** (solo richieste di valutazione, da `generate_lead` con modulo = valutazione), segnato come evento chiave.
- [x] **Google Ads (291-879-3391) collegato a GA4**; `lead_valutazione` importata come unica conversione **principale**, conteggio "Una" (obiettivo "Richiesta preventivo"). Le 3 conversioni automatiche restano **secondarie**.
- [x] **Registrazione chiamate Google Ads disattivata** (monitoraggio chiamate invariato).
- [x] **iubenda**: aggiunto "Monitoraggio conversioni di Google Ads" (finalità Marketing); modulo di contatto con nome, telefono, città, varie tipologie di dati; nome del sito "Evol Group"; tolto Google Fonts. Consent Mode v2 in modalità **base**; richiesta di nuovo consenso all'aggiornamento della cookie policy attiva.
- [x] **gclid** salvato e inviato nelle email solo con consenso pubblicitario; identificativi di clic tolti dall'indirizzo della pagina.
- [x] **Font ospitati sul sito** (niente Google Fonts) e **tag Google bloccato nell'HTML** finché non c'è il consenso alle statistiche.
- [ ] **Campagna sulla Rete di ricerca**: da preparare in bozza solo dopo le decisioni su budget, zone, parole chiave e testi. Non pubblicare senza approvazione.
- [ ] Controllare in Google Ads → Obiettivi → Diagnostica lo stato di Consent Mode dopo i primi giorni di traffico.

## Più avanti
- [ ] Aggiungere info@evolgroup.it come secondo utente su iubenda, Google Analytics e Cloudflare.
- [ ] Altri componenti del team in home (nome, cognome, ruolo).
- [ ] Sostituire la foto della home se ne arriva una vostra (almeno 1920 px).
- [ ] Modulo "Cerchi casa?" per raccogliere gli acquirenti.
- [ ] Aggiornare a mano i numeri della fascia di fiducia (recensioni Google, venduti) in `data/sito.json`.
