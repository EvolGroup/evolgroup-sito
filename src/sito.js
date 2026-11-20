(function () {
  var anteprima = document.body.classList.contains('modalita-anteprima');
  function traccia(nome, dati) { try { if (window.gtag && !anteprima) window.gtag('event', nome, dati || {}); } catch (e) {} }
  // provenienza del visitatore (solo per questa visita, nessun dato personale): finisce nelle email dei moduli
  var provenienza = (function () {
    try { var salvata = sessionStorage.getItem('evol_provenienza'); if (salvata) return JSON.parse(salvata); } catch (e) {}
    var q = new URLSearchParams(location.search), ref = document.referrer, host = '';
    try { host = ref ? new URL(ref).hostname : ''; } catch (e) {}
    if (host === location.hostname) host = '';
    var p = { pagina_di_arrivo: location.pathname };
    if (q.get('gclid')) p.gclid = q.get('gclid');
    if (q.get('utm_source')) {
      p.fonte = [q.get('utm_source'), q.get('utm_medium')].filter(Boolean).join(' / ');
      if (q.get('utm_campaign')) p.campagna = q.get('utm_campaign');
      if (q.get('utm_content')) p.annuncio = q.get('utm_content');
    } else if (q.get('gclid') || q.get('gbraid') || q.get('wbraid')) p.fonte = 'Google Ads';
    else if (q.get('fbclid')) p.fonte = /instagram/.test(host) ? 'Instagram' : 'Facebook';
    else if (/google\./.test(host)) p.fonte = 'Google (ricerca)';
    else if (/bing\.|duckduckgo|yahoo|ecosia/.test(host)) p.fonte = 'Altri motori di ricerca (' + host + ')';
    else if (/facebook|fb\.com/.test(host)) p.fonte = 'Facebook';
    else if (/instagram/.test(host)) p.fonte = 'Instagram';
    else if (/immobiliare\.it|idealista|casa\.it|getrix/.test(host)) p.fonte = 'Portali (' + host + ')';
    else if (host) p.fonte = 'Link da ' + host;
    else p.fonte = 'Diretto (indirizzo digitato, preferiti, WhatsApp o email)';
    try { sessionStorage.setItem('evol_provenienza', JSON.stringify(p)); } catch (e) {}
    return p;
  })();
  // clic su WhatsApp, telefono ed email: contano come contatti
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/wa\.me|whatsapp/.test(h)) traccia('contatto_whatsapp', { pagina: location.pathname });
    else if (/^tel:/.test(h)) traccia('contatto_telefono', { pagina: location.pathname });
    else if (/^mailto:/.test(h)) traccia('contatto_email', { pagina: location.pathname });
  });

  // --- anteprima: una pagina alla volta, scelta dall'indirizzo (#immobili, #contatti...) ---
  function mostraVista() {
    if (!anteprima) return;
    var id = (location.hash || '#home').slice(1);
    var viste = document.querySelectorAll('.vista');
    var trovata = false;
    viste.forEach(function (v) { var ok = v.dataset.vista === id; v.hidden = !ok; if (ok) { trovata = true; document.title = v.dataset.titolo; } });
    if (!trovata) { viste[0].hidden = false; }
    document.body.classList.remove('menu-aperto');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', mostraVista);
  mostraVista();

  // --- pagina Immobili: vendita/affitto e filtri ---
  document.querySelectorAll('[data-elenco]').forEach(function (elenco) {
    var radice = elenco.closest('section');
    var campi = radice.querySelectorAll('[data-filtro]');
    var schede = radice.querySelectorAll('[data-contratto][role=tab]');
    var conteggio = radice.querySelector('.conteggio');
    var nessuno = radice.querySelector('.nessuno');
    var nessunoAffitto = radice.querySelector('.nessuno-affitto');
    var contratto = 'vendita';
    function num(v) { return v === '' || v == null ? null : +v; }
    function aggiorna() {
      var f = {}; campi.forEach(function (c) { f[c.dataset.filtro] = c.value; });
      var lmin = num(f.localiMin), lmax = num(f.localiMax), pmin = num(f.prezzoMin), pmax = num(f.prezzoMax);
      var tutte = Array.prototype.slice.call(elenco.children);
      var delContratto = 0, visibili = 0;
      tutte.forEach(function (c) {
        var d = c.dataset;
        var okContratto = d.contratto === contratto;
        if (okContratto) delContratto++;
        var ok = okContratto && (!f.tipologia || d.tipologia === f.tipologia) && (!f.comune || d.comune === f.comune)
          && (lmin === null || +d.locali >= lmin) && (lmax === null || +d.locali <= lmax)
          && (pmin === null || +d.prezzo >= pmin) && (pmax === null || +d.prezzo <= pmax);
        c.hidden = !ok; if (ok) visibili++;
      });
      var ord = { 'recenti': function (a, b) { return b.dataset.mod.localeCompare(a.dataset.mod); }, 'prezzo-su': function (a, b) { return a.dataset.prezzo - b.dataset.prezzo; }, 'prezzo-giu': function (a, b) { return b.dataset.prezzo - a.dataset.prezzo; }, 'mq': function (a, b) { return b.dataset.mq - a.dataset.mq; } }[f.ordina || 'recenti'];
      tutte.sort(ord).forEach(function (c) { elenco.appendChild(c); });
      conteggio.textContent = delContratto ? (visibili === 1 ? '1 immobile' : visibili + ' immobili') : '';
      nessunoAffitto.hidden = !(contratto === 'affitto' && delContratto === 0);
      nessuno.hidden = visibili > 0 || !nessunoAffitto.hidden;
    }
    schede.forEach(function (b) {
      b.addEventListener('click', function () {
        contratto = b.dataset.contratto;
        schede.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        aggiorna();
      });
    });
    campi.forEach(function (c) { c.addEventListener(c.tagName === 'SELECT' ? 'change' : 'input', aggiorna); });
    radice.querySelector('[data-azzera]').addEventListener('click', function () { campi.forEach(function (c) { c.value = c.dataset.filtro === 'ordina' ? 'recenti' : ''; }); aggiorna(); });
    aggiorna();
  });

  // --- mappe con pulsante "Centra" (Leaflet + OpenStreetMap) ---
  function avviaMappe(contenitore) {
    if (!window.L) return;
    (contenitore || document).querySelectorAll('[data-mappa]').forEach(function (el) {
      if (el.offsetParent === null) return; // pagina non visibile: la mappa parte quando la si apre
      if (el._mappa) { el._mappa.invalidateSize(); return; }
      var pos = [+el.dataset.lat, +el.dataset.lng];
      var m = L.map(el, { scrollWheelZoom: false }).setView(pos, 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
      L.marker(pos).addTo(m).bindPopup(el.dataset.etichetta);
      el._mappa = m;
      var btn = el.parentElement.querySelector('[data-centra]');
      if (btn) btn.addEventListener('click', function () { m.flyTo(pos, 16); });
    });
  }
  window.addEventListener('load', function () { avviaMappe(); });
  window.addEventListener('hashchange', function () { setTimeout(avviaMappe, 50); });

  // --- galleria a schermo intero ---
  document.querySelectorAll('[data-galleria]').forEach(function (g) {
    var lb = g.parentElement.querySelector('[data-lightbox]');
    var foto = JSON.parse(lb.dataset.foto); var i = 0; if (!foto.length) return;
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    function vai(n) { i = (n + foto.length) % foto.length; img.src = foto[i][0]; img.alt = foto[i][1]; cap.textContent = (foto[i][1] ? foto[i][1] + ' · ' : '') + (i + 1) + ' di ' + foto.length; }
    g.parentElement.querySelectorAll('[data-apri]').forEach(function (b) { b.addEventListener('click', function () { vai(+b.dataset.apri); lb.hidden = false; }); });
    lb.querySelector('.lb-chiudi').onclick = function () { lb.hidden = true; };
    lb.querySelector('.lb-prec').onclick = function () { vai(i - 1); };
    lb.querySelector('.lb-succ').onclick = function () { vai(i + 1); };
    document.addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') lb.hidden = true; if (e.key === 'ArrowLeft') vai(i - 1); if (e.key === 'ArrowRight') vai(i + 1); });
  });

  // --- filtro Tutti / Venduti / Affittati ---
  document.querySelectorAll('[data-filtro-venduti]').forEach(function (barra) {
    var tab = barra.querySelectorAll('[data-stato]');
    tab.forEach(function (b) {
      b.addEventListener('click', function () {
        tab.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        document.querySelectorAll('.card.venduto').forEach(function (c) { c.hidden = !!b.dataset.stato && c.dataset.stato !== b.dataset.stato; });
      });
    });
  });

  // --- foto dei venduti/affittati ---
  document.querySelectorAll('[data-lightbox-venduti]').forEach(function (lb) {
    var foto = [], i = 0, img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    function vai(n) { i = (n + foto.length) % foto.length; img.src = foto[i][0]; img.alt = foto[i][1]; cap.textContent = (i + 1) + ' di ' + foto.length; lb.querySelector('.lb-prec').hidden = lb.querySelector('.lb-succ').hidden = foto.length < 2; }
    document.querySelectorAll('[data-galleria-venduto]').forEach(function (b) { b.addEventListener('click', function () { foto = JSON.parse(b.dataset.galleriaVenduto); vai(0); lb.hidden = false; }); });
    lb.querySelector('.lb-chiudi').onclick = function () { lb.hidden = true; };
    lb.querySelector('.lb-prec').onclick = function () { vai(i - 1); };
    lb.querySelector('.lb-succ').onclick = function () { vai(i + 1); };
    document.addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') lb.hidden = true; if (e.key === 'ArrowLeft') vai(i - 1); if (e.key === 'ArrowRight') vai(i + 1); });
  });

  // --- moduli: inviati a Web3Forms (email a info@); in anteprima non partono ---
  document.querySelectorAll('form[data-form]').forEach(function (f) {
    var esitoBox = f.querySelector('.form-esito');
    if (esitoBox) { esitoBox.setAttribute('role', 'status'); esitoBox.setAttribute('aria-live', 'polite'); }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.dataset.inInvio === '1') return; // niente doppi invii con clic ripetuti
      if (f.checkValidity && !f.checkValidity()) { if (f.reportValidity) f.reportValidity(); return; }
      var esito = f.querySelector('.form-esito');
      var chiave = f.dataset.chiave || window.EVOL_CHIAVE_NEWSLETTER || '';
      esito.hidden = false;
      if (anteprima || !chiave) { esito.textContent = 'Questa è un’anteprima: nel sito definitivo il messaggio arriverà alla vostra email.'; return; }
      var pulsanti = f.querySelectorAll('button');
      var blocca = function (si) { f.dataset.inInvio = si ? '1' : ''; for (var k = 0; k < pulsanti.length; k++) pulsanti[k].disabled = si; f.setAttribute('aria-busy', si ? 'true' : 'false'); };
      blocca(true);
      esito.textContent = 'Invio in corso…';
      var dati = new FormData(f); dati.set('access_key', chiave); dati.append('pagina', location.href);
      if (provenienza) { dati.append('provenienza', provenienza.fonte || ''); if (provenienza.campagna) dati.append('campagna', provenienza.campagna); if (provenienza.annuncio) dati.append('annuncio', provenienza.annuncio); if (provenienza.gclid) dati.append('gclid', provenienza.gclid); dati.append('pagina_di_arrivo', provenienza.pagina_di_arrivo || ''); }
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: dati, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var nl = f.dataset.form === 'newsletter';
          if (j && j.success) {
            esito.textContent = nl ? 'Iscrizione completata, grazie!' : (f.dataset.successo || 'Grazie! Ti risponderemo al più presto.');
            traccia(nl ? 'iscrizione_newsletter' : 'generate_lead', { modulo: f.dataset.form, pagina: location.pathname });
            f.reset();
          } else esito.textContent = 'Invio non riuscito: la richiesta non è arrivata. Riprova tra poco oppure scrivici a info@evolgroup.it.';
          blocca(false);
        })
        .catch(function () { esito.textContent = 'Connessione non riuscita: la richiesta non è stata inviata. Controlla la connessione e riprova, oppure scrivici a info@evolgroup.it.'; blocca(false); });
    });
  });
})();
