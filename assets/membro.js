(function () {
  const db = CR.db, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2400); };
  let eu = null;

  function iniciar() {
    const s = CR.sessao.get('membro');
    eu = s && db.membros.find(m => m.id === s.id);
    $('#telaEntrada').hidden = !!eu; $('#telaApp').hidden = !eu;
    if (eu) { $('#quemNome').textContent = eu.nome.split(' ')[0]; tudo(); abrir((location.hash || '#mural').slice(1)); }
  }

  $('#formEntrar').addEventListener('submit', e => {
    e.preventDefault();
    const nome = $('#eNome').value.trim(), email = $('#eEmail').value.trim().toLowerCase(), cod = $('#eCod').value.trim().toUpperCase();
    if (cod !== String(db.config.codigoMembro).toUpperCase()) { $('#eErro').textContent = 'Código não confere. Pede no grupo do coletivo.'; return; }
    let m = db.membros.find(x => x.email.toLowerCase() === email);
    if (!m) { m = { id: CR.id('u'), nome, email, desde: CR.hoje(), papel: 'membro', status: 'ativo', presencas: [] }; db.membros.push(m); CR.salvar(); }
    CR.sessao.set('membro', { id: m.id }); iniciar(); toast('Bem-vindo ao corre, ' + m.nome.split(' ')[0] + '!');
  });
  $('#sair').addEventListener('click', () => { CR.sessao.sair('membro'); location.hash = ''; iniciar(); });

  /* Abas */
  function abrir(aba) {
    if (!['mural', 'agenda', 'dossie', 'carteira'].includes(aba)) aba = 'mural';
    $$('.abas button').forEach(b => b.setAttribute('aria-selected', b.dataset.aba === aba));
    $$('[data-sec]').forEach(s => s.hidden = s.dataset.sec !== aba);
    history.replaceState(null, '', '#' + aba);
  }
  $$('.abas button').forEach(b => b.addEventListener('click', () => abrir(b.dataset.aba)));

  function tudo() { mural(); agenda(); albuns(); carteira(); }

  /* Mural */
  function mural() {
    const lista = [...db.comunicados].sort((a, b) => (b.fixo - a.fixo) || b.data.localeCompare(a.data));
    $('#nMural').textContent = lista.length;
    $('#mural').innerHTML = lista.map(m => {
      const r = db.reacoes[m.id] || {}, minha = r[eu.id];
      const cont = k => Object.values(r).filter(v => v === k).length;
      return `<article class="recado${m.fixo ? ' fixo' : ''}">
        <div class="meta"><span class="tag ${m.fixo ? 'brasa' : ''}">${CR.esc(m.tag)}</span>${m.publico ? '' : '<span class="tag rosa">Membros</span>'}<span>${CR.dataBR(m.data, true)}</span>${m.fixo ? '<span>· fixado</span>' : ''}</div>
        <h3>${CR.esc(m.titulo)}</h3><p>${CR.esc(m.texto)}</p>
        <div class="reagir">
          <button data-r="${m.id}" data-k="fogo" class="${minha === 'fogo' ? 'on' : ''}">❤️‍🔥 ${cont('fogo')}</button>
          <button data-r="${m.id}" data-k="dentro" class="${minha === 'dentro' ? 'on' : ''}">🏁 tô dentro ${cont('dentro')}</button>
        </div></article>`;
    }).join('');
  }
  $('#mural').addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    const r = db.reacoes[b.dataset.r] = db.reacoes[b.dataset.r] || {};
    r[eu.id] = r[eu.id] === b.dataset.k ? undefined : b.dataset.k; CR.salvar(); mural();
  });

  /* Agenda */
  function agenda() {
    const prox = CR.proximos(), pass = CR.passados();
    const card = (c, futuro) => {
      const conf = db.confirmacoes[c.id] || [], vou = conf.includes(eu.id), fui = eu.presencas.includes(c.id);
      return `<div class="corre${futuro ? '' : ' passado'}">
        <div class="dt"><b>${CR.dataBR(c.data).slice(0, 2)}</b><span>${CR.mesCurto(c.data)} · ${c.hora ? c.hora.replace(':00', 'h') : 'hora a conf.'}</span></div>
        <div><h3>${CR.esc(c.nome)}</h3><div class="onde">${CR.esc(c.local)}${c.km ? ' · ' + c.km + ' km' : ''}</div>
          <div class="onde">${CR.esc(c.obs || '')}</div>
          ${futuro ? `<div class="conf">${conf.length} ${conf.length === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}</div>` : ''}</div>
        <div class="acao">${futuro
          ? `<button class="btn ${vou ? '' : 'brasa'} peq" data-vou="${c.id}">${vou ? '✓ Confirmado' : 'Vou colar'}</button>`
          : `<button class="btn ${fui ? '' : 'vazado'} peq" data-fui="${c.id}">${fui ? '✓ Eu fui' : 'Eu fui'}</button>`}</div>
      </div>`;
    };
    $('#corres').innerHTML = (prox.length ? prox.map(c => card(c, true)).join('') : '<div class="vazio">Nenhum corre marcado ainda.</div>') +
      (pass.length ? `<h3 class="titulo" style="font-size:30px;margin:26px 0 4px">Já rolou</h3>` + pass.map(c => card(c, false)).join('') : '');
  }
  $('#corres').addEventListener('click', e => {
    const v = e.target.closest('[data-vou]'), f = e.target.closest('[data-fui]');
    if (v) { const l = db.confirmacoes[v.dataset.vou] = db.confirmacoes[v.dataset.vou] || []; const i = l.indexOf(eu.id); i < 0 ? l.push(eu.id) : l.splice(i, 1); CR.salvar(); agenda(); toast(i < 0 ? 'Fechou! Te vejo lá.' : 'Presença desmarcada.'); }
    if (f) { const i = eu.presencas.indexOf(f.dataset.fui); i < 0 ? eu.presencas.push(f.dataset.fui) : eu.presencas.splice(i, 1); CR.salvar(); agenda(); carteira(); }
  });

  /* Dossiê */
  function albuns() {
    $('#gradeFotos').hidden = true; $('#voltarAlbuns').hidden = true; $('#albuns').hidden = false;
    $('#dosTit').textContent = 'Dossiê'; $('#dosSub').textContent = 'Todos os rolos, inclusive os que só os membros veem.';
    $('#albuns').innerHTML = [...db.albuns].sort((a, b) => b.data.localeCompare(a.data)).map(a => `
      <button class="album" data-album="${a.id}"><div class="capa"><img src="${(a.fotos[a.capa || 0] || a.fotos[0] || {}).thumb || ''}" alt="" loading="lazy"></div>
      ${a.publico ? '' : '<span class="tag">Só membros</span>'}
      <div class="txt"><h3>${CR.esc(a.titulo)}</h3><span>${CR.dataBR(a.data, true)} · ${a.fotos.length} fotos</span></div></button>`).join('');
  }
  $('#albuns').addEventListener('click', e => {
    const b = e.target.closest('[data-album]'); if (!b) return;
    const a = db.albuns.find(x => x.id === b.dataset.album);
    $('#albuns').hidden = true; $('#voltarAlbuns').hidden = false; $('#gradeFotos').hidden = false;
    $('#dosTit').textContent = a.titulo; $('#dosSub').textContent = `${CR.dataBR(a.data, true)} · ${a.local}${a.credito ? ' · ' + a.credito : ''}`;
    $('#gradeFotos').innerHTML = a.fotos.map((f, i) => `<button data-f="${i}" aria-label="Foto ${i + 1}"><img src="${f.thumb}" alt="" loading="lazy"></button>`).join('');
    $('#gradeFotos').onclick = ev => { const x = ev.target.closest('[data-f]'); if (x) CR.lightbox(a.fotos.map(f => ({ src: f.src, legenda: a.titulo })), +x.dataset.f); };
  });
  $('#voltarAlbuns').addEventListener('click', albuns);

  /* Carteirinha */
  function carteira() {
    const n = String(db.membros.indexOf(eu) + 1).padStart(4, '0');
    const feitos = db.corres.filter(c => eu.presencas.includes(c.id));
    const km = feitos.reduce((s, c) => s + (c.km || 0), 0);
    // padrão visual tipo QR gerado do id (decorativo na demo)
    let h = 0; for (const ch of eu.id + eu.email) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const qr = Array.from({ length: 81 }, (_, i) => { const x = i % 9, y = (i / 9) | 0; const canto = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5); if (canto) return (x % 2 === 1 && (y % 2 === 1)) ? 'v' : ''; h = (h * 1103515245 + 12345) >>> 0; return (h >> 16) & 1 ? '' : 'v'; });
    $('#carteira').innerHTML = `
      <div class="topo-c"><span class="grafite">Collective<br>Runners</span><span class="num">CR-${n}</span></div>
      <div class="nome">${CR.esc(eu.nome)}</div>
      <div class="linha-c"><span>${eu.papel}<br>na crew desde ${CR.dataBR(eu.desde, true)}<br>#NinguémFicaPraTrás</span><div class="qr">${qr.map(c => `<i class="${c}"></i>`).join('')}</div></div>`;
    $('#stats').innerHTML = `<div><b>${feitos.length}</b><span>corres</span></div><div><b>${km}</b><span>km com a crew</span></div><div><b>${(db.confirmacoes[CR.proximos()[0]?.id] || []).includes(eu.id) ? '✓' : '—'}</b><span>no próximo</span></div>`;
    const tem = t => feitos.some(c => c.tipo === t);
    const selos = [['Primeiro corre', feitos.length >= 1], ['Corujão (noturno)', tem('Noturno')], ['CLLTV Girls', tem('Girls')], ['Cultura', tem('Cultural')], ['Pelotão firme (3+)', feitos.length >= 3], ['Puxador (10+)', feitos.length >= 10]];
    $('#selos').innerHTML = selos.map(([t, ok]) => `<span class="selo-c${ok ? '' : ' off'}">${ok ? '★ ' : ''}${t}</span>`).join('');
  }

  iniciar();
})();
