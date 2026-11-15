(function () {
  var anteprima = document.body.classList.contains('modalita-anteprima');

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

  // --- moduli: inviati a Web3Forms (email a info@ o a Vittorio); in anteprima non partono ---
  document.querySelectorAll('form[data-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var esito = f.querySelector('.form-esito');
      var chiave = f.dataset.chiave || window.EVOL_CHIAVE_NEWSLETTER || '';
      esito.hidden = false;
      if (anteprima || !chiave) { esito.textContent = 'Questa è un’anteprima: nel sito definitivo il messaggio arriverà alla vostra email.'; return; }
      esito.textContent = 'Invio in corso…';
      var dati = new FormData(f); dati.append('access_key', chiave); dati.append('pagina', location.href);
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: dati })
        .then(function (r) { return r.json(); })
        .then(function (j) { esito.textContent = j.success ? 'Grazie! Ti risponderemo al più presto.' : 'Invio non riuscito: scrivici a info@evolgroup.it.'; if (j.success) f.reset(); })
        .catch(function () { esito.textContent = 'Invio non riuscito: scrivici a info@evolgroup.it.'; });
    });
  });
})();
