(function () {
  const db = CR.db, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const toast = (t) => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600); };

  /* Links reais da config */
  const c = db.config;
  ['ctaWpp1', 'ctaWpp2'].forEach(id => $('#' + id).href = c.whatsapp);
  $('#ctaStrava').href = c.strava; $('#ctaInsta').href = c.instagram; $('#ctaTiktok').href = c.tiktok; $('#linkInsta').href = c.instagram;

  /* Menu e topo */
  const menu = $('#menu'), mb = $('#menuBtn');
  mb.addEventListener('click', () => { const on = menu.classList.toggle('on'); mb.setAttribute('aria-expanded', on); mb.textContent = on ? 'Fechar' : 'Menu'; });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('on'); mb.textContent = 'Menu'; }));
  const topo = $('#topo'), cena = $('.cena');

  /* ====== CENA ====== */
  const NS = 'http://www.w3.org/2000/svg';
  const trilha = $('#trilha'), feito = $('#feito'), g = $('#pelotao'), halo = $('#halo'), rota = $('#rota');
  const L = trilha.getTotalLength();
  feito.style.strokeDasharray = L; feito.style.strokeDashoffset = L;
  const N = 16, corredores = [];
  for (let i = 0; i < N; i++) {
    const el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', i === N - 1 ? 11 : 8 + (i % 3));
    el.setAttribute('class', 'corredor' + (i === N - 1 ? ' atrasado' : ''));
    g.appendChild(el);
    corredores.push({ el, gap: i * 0.0105 + (i % 4) * 0.003, lado: ((i * 37) % 7 - 3) * 4.2 });
  }
  const frases = $$('.frase'), km = $('#km'), ritmo = $('#ritmo'), bg = $('.cena-bg'), chegada = $('#chegada'), rolar = $('#rolar');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lider(p) {           // posição do primeiro corredor (0..1 da rota)
    if (p < .07) return 0;
    if (p < .45) return lerp(0, .56, ease((p - .07) / .38));
    if (p < .60) return .56;     // o pelotão espera
    if (p < .85) return lerp(.56, 1, ease((p - .60) / .25));
    return 1;
  }
  function atraso(p) {          // quanto o último fica para trás
    if (p < .12) return 0;
    if (p < .42) return lerp(0, .25, ease((p - .12) / .30));
    if (p < .58) return lerp(.25, 0, ease((p - .42) / .16));
    return 0;
  }
  function ponto(s) { return trilha.getPointAtLength(clamp(s) * L); }
  function normal(s) { const a = ponto(s - .004), b = ponto(s + .004); const dx = b.x - a.x, dy = b.y - a.y, m = Math.hypot(dx, dy) || 1; return { x: -dy / m, y: dx / m }; }

  function render(p) {
    const s0 = lider(p), at = atraso(p), junto = p > .58;
    const t = performance.now() / 1000;
    corredores.forEach((r, i) => {
      let s = s0 - r.gap * (p > .86 ? lerp(1, .25, clamp((p - .86) / .1)) : 1);
      if (i === N - 1) s = s0 - r.gap - at;
      s = clamp(s, 0, 1);
      const pt = ponto(s), n = normal(s), bal = Math.sin(t * 6 + i) * (s0 > 0 && s0 < 1 && !(p > .45 && p < .6) ? 1.6 : .4);
      r.el.setAttribute('cx', pt.x + n.x * r.lado + bal);
      r.el.setAttribute('cy', pt.y + n.y * r.lado);
      if (i === N - 1) {
        const hp = ponto(s);
        halo.setAttribute('cx', hp.x); halo.setAttribute('cy', hp.y);
        halo.style.opacity = (p > .36 && p < .58) ? (.5 + .5 * Math.sin(t * 5)) : 0;
      }
    });
    rota.classList.toggle('juntos', junto);
    feito.style.strokeDashoffset = L * (1 - s0);
    km.textContent = (s0 * 4).toFixed(2);
    ritmo.textContent = p < .07 ? 'concentração · 19h' : p < .45 ? 'ritmo confortável' : p < .6 ? 'pelotão esperando' : p < .86 ? 'todo mundo junto' : 'chegada · baile';
    bg.style.opacity = lerp(.42, .12, clamp(p / .3));
    bg.style.transform = `scale(${lerp(1, 1.15, clamp(p / .5))})`;
    // revelação da foto da chegada a partir do Pelourinho
    const fim = ponto(1), box = rota.getBoundingClientRect(), vb = 1000;
    const cx = box.left + fim.x / vb * box.width, cy = box.top + fim.y / vb * box.height;
    const raio = clamp((p - .82) / .12) * Math.hypot(innerWidth, innerHeight) * 1.1;
    chegada.style.clipPath = `circle(${raio}px at ${cx}px ${cy}px)`;
    frases.forEach(f => {
      const de = +f.dataset.de, ate = +f.dataset.ate, entra = de === 0 ? 1 : clamp((p - de) / .03), sai = 1 - clamp((p - ate + .03) / .03);
      const o = Math.min(entra, sai);
      f.style.opacity = o; f.style.transform = `translateY(${(1 - o) * 24}px)`;
      f.classList.toggle('on', o > .5);
    });
    rolar.style.opacity = p < .04 ? .8 : 0;
  }

  let alvo = 0, atual = 0, rodando = false;
  function progresso() {
    const r = cena.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  }
  function loop() {
    atual += (alvo - atual) * .16;
    render(atual);
    if (Math.abs(alvo - atual) > .0005 || (atual > .07 && atual < .9)) requestAnimationFrame(loop); else rodando = false;
  }
  function aoRolar() {
    alvo = progresso();
    topo.classList.toggle('claro', cena.getBoundingClientRect().bottom < 70);
    if (reduz) { atual = alvo; render(atual); return; }
    if (!rodando) { rodando = true; requestAnimationFrame(loop); }
  }
  addEventListener('scroll', aoRolar, { passive: true });
  addEventListener('resize', aoRolar);
  aoRolar(); render(progresso());

  /* ====== AGENDA ====== */
  function linha(cr, proximo) {
    const dias = Math.ceil((new Date(cr.data + 'T' + (cr.hora || '12:00')) - new Date()) / 864e5);
    const quando = dias <= 0 ? 'é hoje' : dias === 1 ? 'é amanhã' : `faltam ${dias} dias`;
    return `<div class="linha-corre${proximo ? ' proximo' : ''}">
      <span class="dia">${CR.mesCurto(cr.data)} ${CR.dataBR(cr.data)}</span>
      <div><div class="nome">${CR.esc(cr.tipo === 'Cultural' ? 'Encontro cultural ' : 'Encontro ')}<b>${CR.esc(cr.nome)}</b></div>
      <div class="onde">Local: ${CR.esc(cr.local)}${cr.hora ? ' · ' + cr.hora.replace(':00', 'h') : ''}${cr.km ? ' · ' + cr.km + ' km' : ''}</div></div>
      ${proximo ? `<div class="extra"><span class="contagem">${quando}</span>
        <a class="btn brasa peq" href="membro.html#agenda">Vou colar</a>
        <button class="btn vazado peq" style="border-color:#fff;color:#fff" data-ics="${cr.id}">Pôr na agenda</button></div>` : ''}
      ${!proximo && cr.album ? `<div class="extra"><a class="btn vazado peq" href="#rolo-${cr.album}">Ver fotos</a></div>` : ''}
    </div>`;
  }
  function agenda() {
    const prox = CR.proximos(), pass = CR.passados();
    $('#folha').innerHTML = (prox.length ? prox.map((cr, i) => linha(cr, i === 0)).join('') : '<p class="mono" style="padding:18px 0">O próximo corre sai em breve. Fica de olho no Instagram.</p>') +
      (pass.length ? `<details class="ja-rolou"><summary>Já rolou (${pass.length})</summary>${pass.map(cr => linha(cr, false)).join('')}</details>` : '');
    if (prox[0]) $('#proxHist').textContent = prox[0].local.split(',')[0].split('→').pop().trim();
  }
  agenda();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ics]'); if (!b) return;
    const cr = db.corres.find(x => x.id === b.dataset.ics);
    const d = cr.data.replace(/-/g, ''), h = (cr.hora || '07:00').replace(':', '') + '00';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART;TZID=America/Bahia:${d}T${h}`, `DURATION:PT2H`, `SUMMARY:Collective Runners · ${cr.nome}`, `LOCATION:${cr.local}`, `DESCRIPTION:${cr.obs || ''} Encontro 100% gratuito.`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'collective-runners.ics'; a.click();
  });

  /* ====== DOSSIÊ ====== */
  $('#rolos').innerHTML = db.albuns.map(al => `
    <div class="rolo${al.publico ? '' : ' trancado'}" id="rolo-${al.id}">
      <div class="rolo-cab"><h3>${CR.esc(al.titulo)}</h3><span>${CR.dataBR(al.data, true)} · ${CR.esc(al.local)} · ${al.fotos.length} fotos${al.credito ? ' · ' + CR.esc(al.credito) : ''}</span></div>
      <div class="filme">${al.fotos.map((f, i) => `<button data-al="${al.id}" data-i="${i}" aria-label="Foto ${i + 1} de ${CR.esc(al.titulo)}"><img src="${f.thumb}" alt="" loading="lazy"><span>${String(i + 1).padStart(2, '0')}A</span></button>`).join('')}</div>
      ${al.publico ? '' : '<div class="cadeado"><b>Só para membros</b>Rolo com fotos de crianças: fica no arquivo da área do membro. <a href="membro.html#dossie">Entrar</a></div>'}
    </div>`).join('');
  $('#rolos').addEventListener('click', e => {
    const b = e.target.closest('button[data-al]'); if (!b) return;
    const al = db.albuns.find(a => a.id === b.dataset.al);
    CR.lightbox(al.fotos.map(f => ({ src: f.src, legenda: al.titulo })), +b.dataset.i);
  });

  /* ====== LOJA ====== */
  const rot = { 'esgotado': ['Esgotado', ''], 'em-breve': ['Em breve', ''], 'disponivel': ['Disponível', 'brasa'] };
  $('#vitrine').innerHTML = db.produtos.map(p => `
    <article class="peca">
      <div class="foto"><img src="${p.img}" alt="" loading="lazy"><span class="tag ${rot[p.status]?.[1] || ''}">${rot[p.status]?.[0] || p.status}</span></div>
      <div class="corpo"><h3>${CR.esc(p.nome)}</h3><p>${CR.esc(p.desc)}</p>
      <span class="preco">${p.preco ? 'R$ ' + Number(p.preco).toFixed(2).replace('.', ',') : 'preço a definir'}</span>
      <button class="btn ${p.status === 'disponivel' ? 'brasa' : 'vazado'} peq" data-peca="${p.id}">${p.status === 'disponivel' ? 'Quero essa' : 'Me avisa'}</button></div>
    </article>`).join('');
  const modal = $('#modalEspera'); let pecaSel = null;
  $('#vitrine').addEventListener('click', e => {
    const b = e.target.closest('[data-peca]'); if (!b) return;
    pecaSel = db.produtos.find(p => p.id === b.dataset.peca);
    $('#mePeca').textContent = pecaSel.status === 'disponivel' ? `Reserva de “${pecaSel.nome}”. A coordenação chama no WhatsApp pra combinar retirada e pagamento.` : `Você entra na lista de espera de “${pecaSel.nome}” e fica sabendo antes de todo mundo.`;
    modal.classList.add('on'); $('#meNome').focus();
  });
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('fechar')) modal.classList.remove('on'); });
  $('#formEspera').addEventListener('submit', e => {
    e.preventDefault();
    db.listaEspera.push({ id: CR.id('e'), peca: pecaSel.id, nome: $('#meNome').value.trim(), wpp: $('#meWpp').value.trim(), tam: $('#meTam').value, data: CR.hoje(), tipo: pecaSel.status === 'disponivel' ? 'reserva' : 'espera' });
    CR.salvar(); modal.classList.remove('on'); e.target.reset(); toast('Fechou! Você tá na lista.');
  });

  /* ====== CUPONS ====== */
  $('#tickets').innerHTML = db.parceiros.map(p => `
    <div class="ticket"><div class="esq"><b>${CR.esc(p.nome)}</b><a href="${p.link}" target="_blank" rel="noopener">ir pra loja ↗</a></div>
    <div class="dir"><div><span class="pct">${CR.esc(p.desconto)}</span><br><button data-cupom="${CR.esc(p.cupom)}">${CR.esc(p.cupom)} ⧉</button></div></div></div>`).join('');
  $('#tickets').addEventListener('click', e => {
    const b = e.target.closest('[data-cupom]'); if (!b) return;
    (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.cupom) : Promise.reject()).then(() => toast('Cupom copiado: ' + b.dataset.cupom), () => toast('Cupom: ' + b.dataset.cupom));
  });
  $('#apoios').innerHTML = db.apoios.map(a => `<span>${CR.esc(a)}</span>`).join('');

  /* Revelação suave */
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('vis'); io.unobserve(en.target); } }), { threshold: .15 });
  $$('.sobe').forEach(el => io.observe(el));
})();
