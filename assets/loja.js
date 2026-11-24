(function () {
  const db = CR.db, $ = s => document.querySelector(s), E = CR.esc, R = CR.reais;
  const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600); };
  const membro = CR.membroLogado();
  const precoDe = p => membro ? CR.precoMembro(p) : p.preco;
  $('#avisoDemo').hidden = !db.config.lojaDemo;
  if (membro) { $('#linkMembro').textContent = 'Oi, ' + membro.nome.split(' ')[0]; $('#linkMembro').href = 'membro.html#carteira'; }

  /* ===== Sacola (por navegador) ===== */
  let sacola = [];
  try { sacola = JSON.parse(localStorage.getItem('cr_sacola') || '[]'); } catch (e) { }
  const guardar = () => { try { localStorage.setItem('cr_sacola', JSON.stringify(sacola)); } catch (e) { } contar(); };
  const contar = () => { $('#nSacola').textContent = sacola.reduce((s, i) => s + i.qt, 0); };
  sacola = sacola.filter(i => db.produtos.some(p => p.id === i.p));
  contar();

  /* ===== Drop em destaque ===== */
  const drop = db.produtos.find(p => p.status === 'drop' && p.drop);
  function desenharDrop() {
    if (!drop) return;
    const el = $('#drop'); el.hidden = false;
    const alvo = new Date(drop.drop), alvoMembro = new Date(alvo - 864e5);
    const aberto = CR.estadoDrop(drop, membro) === 'aberto';
    el.innerHTML = `<div class="wrap">
      <div>
        <span class="tag brasa">Drop · edição limitada</span>
        <h1 style="margin-top:16px">${E(drop.nome.replace('Camiseta ', ''))}<br><span>${CR.dataBR(drop.drop.slice(0, 10))} · ${drop.drop.slice(11, 13)}h</span></h1>
        <p>${E(drop.desc)} Membros logados compram 24 horas antes de abrir pra todo mundo.</p>
        <div class="relogio" id="relogio" aria-live="polite"></div>
        <div class="acoes">
          <button class="btn brasa" data-peca="${drop.id}">${aberto ? 'Garantir a minha' : 'Ver a peça'}</button>
          ${membro ? '' : '<a class="btn vazado" href="membro.html">Sou membro: entrar</a>'}
        </div>
      </div>
      <div class="foto"><img src="${drop.imgs[0]}" alt="${E(drop.nome)}"><span class="carimbo">${aberto ? 'aberto!' : 'em breve'}</span></div>
    </div>`;
    const relogio = () => {
      const fim = membro ? alvoMembro : alvo, t = Math.max(0, fim - new Date());
      const d = Math.floor(t / 864e5), h = Math.floor(t / 36e5) % 24, m = Math.floor(t / 6e4) % 60, s = Math.floor(t / 1e3) % 60;
      $('#relogio').innerHTML = t > 0
        ? [['dias', d], ['horas', h], ['min', m], ['seg', s]].map(([l, v]) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('') + `<span class="mono" style="align-self:center;font-size:12px;max-width:120px">${membro ? 'pra abrir pros membros' : 'pra abrir'}</span>`
        : '<div style="flex:none;padding:10px 16px"><b>no ar</b><span>corre que acaba</span></div>';
    };
    relogio(); setInterval(relogio, 1000);
  }
  desenharDrop();

  /* ===== Catálogo ===== */
  const cats = ['Tudo', ...new Set(db.produtos.map(p => p.cat))];
  let filtro = 'Tudo';
  $('#filtros').innerHTML = cats.map(c => `<button aria-pressed="${c === filtro}" data-cat="${E(c)}">${E(c)}</button>`).join('');
  $('#filtros').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; filtro = b.dataset.cat; [...$('#filtros').children].forEach(x => x.setAttribute('aria-pressed', x === b)); grade(); });
  function grade() {
    const ordem = { drop: 0, disponivel: 1, 'em-breve': 2, esgotado: 3 };
    const lista = db.produtos.filter(p => filtro === 'Tudo' || p.cat === filtro).sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9));
    $('#grade').innerHTML = lista.map(p => {
      const est = CR.estoque(p), esg = p.status === 'esgotado' || (p.status !== 'em-breve' && est === 0);
      const selos = [];
      if (p.status === 'drop') selos.push(`<span class="tag brasa">Drop ${CR.dataBR(p.drop.slice(0, 10))}</span>`);
      if (esg) selos.push('<span class="tag">Esgotado</span>');
      if (p.status === 'em-breve') selos.push('<span class="tag">Em breve</span>');
      if (p.limitada && !esg) selos.push('<span class="tag rosa">Edição limitada</span>');
      return `<button class="card-peca${esg ? ' esgotado' : ''}" data-peca="${p.id}">
        <div class="img"><img src="${p.imgs[0].replace('.jpg', '_t.jpg')}" alt="" loading="lazy">${p.imgs[1] ? `<img class="b" src="${p.imgs[1].replace('.jpg', '_t.jpg')}" alt="" loading="lazy">` : ''}<div class="selos">${selos.join('')}</div></div>
        <h3>${E(p.nome)}</h3>
        <div class="precos">${p.preco ? (membro ? `<s>${R(p.preco)}</s><em>${R(precoDe(p))} membro</em>` : `<span>${R(p.preco)}</span><em>${R(CR.precoMembro(p))} p/ membro</em>`) : 'preço a definir'}</div>
        ${!esg && p.limitada && est > 0 && est <= 10 ? `<span class="resta">Restam ${est}</span>` : ''}
      </button>`;
    }).join('');
  }
  grade();

  /* ===== Gavetas ===== */
  const veu = $('#veu');
  function abrirG(id) { fecharG(); const g = $(id); g.classList.add('on'); g.setAttribute('aria-hidden', 'false'); veu.classList.add('on'); document.body.style.overflow = 'hidden'; }
  function fecharG() { document.querySelectorAll('.gaveta.on').forEach(g => { g.classList.remove('on'); g.setAttribute('aria-hidden', 'true'); }); veu.classList.remove('on'); document.body.style.overflow = ''; }
  veu.addEventListener('click', fecharG);
  document.addEventListener('click', e => { if (e.target.closest('[data-fechar]')) fecharG(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharG(); });

  /* ===== Peça ===== */
  let sel = null;
  document.addEventListener('click', e => { const b = e.target.closest('[data-peca]'); if (b) abrirPeca(b.dataset.peca); });
  function abrirPeca(id) {
    const p = db.produtos.find(x => x.id === id);
    const tams = Object.keys(p.tamanhos || {});
    sel = { p: id, cor: p.cores[0] || '', tam: tams.find(t => p.tamanhos[t] > 0) || '', qt: 1 };
    pintarPeca(p); abrirG('#gPeca');
  }
  function pintarPeca(p) {
    const estado = CR.estadoDrop(p, membro), est = CR.estoque(p);
    const vendivel = (p.status === 'disponivel' || (p.status === 'drop' && estado === 'aberto')) && est > 0 && p.preco;
    $('#pecaCorpo').innerHTML = `
      <div class="galeria" id="galeria">${p.imgs.map(s => `<img src="${s}" alt="${E(p.nome)}">`).join('')}</div>
      ${p.imgs.length > 1 ? `<div class="pontos" id="pontos">${p.imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      <div class="ficha">
        <span class="tag">${E(p.cat)}</span>${p.limitada ? ' <span class="tag rosa">Edição limitada</span>' : ''}
        <h3 style="margin-top:10px">${E(p.nome)}</h3>
        <div class="precos">${p.preco ? (membro ? `<s>${R(p.preco)}</s> <em>${R(precoDe(p))}</em> <small>preço de membro</small>` : `${R(p.preco)} <small>· membro paga ${R(CR.precoMembro(p))}</small>`) : 'preço a definir'}</div>
        <p>${E(p.desc)}</p>
        ${p.cores.length > 1 ? `<div class="opcoes"><span>Cor</span><div class="lista">${p.cores.map(c => `<button data-cor="${E(c)}" aria-pressed="${c === sel.cor}">${E(c)}</button>`).join('')}</div></div>` : ''}
        ${Object.keys(p.tamanhos).length > 1 || !['Único', 'Única', 'Kit'].includes(Object.keys(p.tamanhos)[0]) ? `<div class="opcoes"><span>Tamanho</span><div class="lista">${Object.entries(p.tamanhos).map(([t, n]) => `<button data-tam="${E(t)}" aria-pressed="${t === sel.tam}" ${n > 0 ? '' : 'disabled'} title="${n > 0 ? n + ' em estoque' : 'esgotado'}">${E(t)}</button>`).join('')}</div></div>` : ''}
        ${vendivel ? `<div class="opcoes"><span>Quantidade</span><div class="qtd"><button data-q="-1" aria-label="Menos">−</button><span id="qt">${sel.qt}</span><button data-q="1" aria-label="Mais">+</button></div></div>` : ''}
        ${p.status === 'drop' && estado === 'fechado' ? `<div class="trava">Esse drop abre em ${CR.dataBR(p.drop.slice(0, 10), true)}, às ${p.drop.slice(11, 16)}. Membros compram 24h antes. ${membro ? '' : '<a href="membro.html">Entrar como membro</a>'}</div>` : ''}
      </div>`;
    $('#pecaPe').innerHTML = vendivel
      ? `<button class="btn brasa" id="addSacola" style="width:100%">Pôr na sacola · ${R(precoDe(p) * sel.qt)}</button>`
      : `<a class="btn" style="width:100%" href="index.html#loja">${p.status === 'esgotado' || est === 0 ? 'Esgotou · entrar na lista de espera' : 'Me avisa quando abrir'}</a>`;
    const gal = $('#galeria');
    if (gal && $('#pontos')) gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); [...$('#pontos').children].forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
  }
  $('#gPeca').addEventListener('click', e => {
    const p = db.produtos.find(x => x.id === sel.p);
    const c = e.target.closest('[data-cor]'), t = e.target.closest('[data-tam]'), q = e.target.closest('[data-q]');
    if (c) { sel.cor = c.dataset.cor; pintarPeca(p); }
    if (t) { sel.tam = t.dataset.tam; sel.qt = Math.min(sel.qt, p.tamanhos[sel.tam]); pintarPeca(p); }
    if (q) { sel.qt = Math.max(1, Math.min(p.tamanhos[sel.tam] || 1, sel.qt + +q.dataset.q)); pintarPeca(p); }
    if (e.target.closest('#addSacola')) {
      if (!sel.tam) return toast('Escolhe o tamanho.');
      const ja = sacola.find(i => i.p === sel.p && i.cor === sel.cor && i.tam === sel.tam);
      const max = p.tamanhos[sel.tam];
      if (ja) ja.qt = Math.min(max, ja.qt + sel.qt); else sacola.push({ ...sel });
      guardar(); toast('Foi pra sacola.'); abrirSacola();
    }
  });

  /* ===== Sacola e checkout ===== */
  let etapa = 'sacola', dados = { nome: membro?.nome || '', wpp: '', entrega: 'corre' }, pedidoAtual = null;
  const totais = () => {
    const bruto = sacola.reduce((s, i) => s + db.produtos.find(p => p.id === i.p).preco * i.qt, 0);
    const total = sacola.reduce((s, i) => s + precoDe(db.produtos.find(p => p.id === i.p)) * i.qt, 0);
    return { bruto, total: Math.round(total * 100) / 100, desconto: Math.round((bruto - total) * 100) / 100 };
  };
  function abrirSacola() { etapa = sacola.length ? 'sacola' : 'sacola'; pintarSacola(); abrirG('#gSacola'); }
  $('#abrirSacola').addEventListener('click', abrirSacola);
  const passos = n => `<div class="passos">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const proxCorre = () => CR.proximos()[0];

  function pintarSacola() {
    const corpo = $('#sacCorpo'), pe = $('#sacPe'), t = totais();
    if (etapa === 'sacola') {
      $('#sacTit').textContent = 'Sacola';
      if (!sacola.length) { corpo.innerHTML = `<div class="vazio-s"><img src="assets/mascote-corre.png" alt="">A sacola tá vazia. Bora escolher uma peça?</div>`; pe.innerHTML = `<button class="btn" data-fechar style="width:100%">Ver as peças</button>`; return; }
      corpo.innerHTML = passos(1) + sacola.map((i, k) => { const p = db.produtos.find(x => x.id === i.p); return `
        <div class="item-sacola"><img src="${p.imgs[0].replace('.jpg', '_t.jpg')}" alt="">
          <div><b>${E(p.nome)}</b><span class="sub">${[i.cor, i.tam].filter(Boolean).map(E).join(' · ')}</span>
            <div class="qtd" style="margin-top:6px;transform:scale(.85);transform-origin:left"><button data-iq="${k}" data-d="-1" aria-label="Menos">−</button><span>${i.qt}</span><button data-iq="${k}" data-d="1" aria-label="Mais">+</button></div></div>
          <div class="lado"><span class="mono">${R(precoDe(p) * i.qt)}</span><button data-rm="${k}">remover</button></div></div>`; }).join('') +
        (membro ? '' : `<p class="mono" style="font-size:12px;margin-top:14px">Membro paga ${db.config.descontoMembro}% menos. <a href="membro.html">Entrar</a></p>`);
      pe.innerHTML = `${t.desconto ? `<div class="linha-total desc"><span>Desconto de membro</span><span>− ${R(t.desconto)}</span></div>` : ''}
        <div class="linha-total grande"><span>Total</span><span>${R(t.total)}</span></div>
        <button class="btn brasa" id="irDados" style="width:100%">Continuar</button>`;
    }
    if (etapa === 'dados') {
      $('#sacTit').textContent = 'Seus dados';
      const pc = proxCorre();
      corpo.innerHTML = passos(2) + `
        <div class="campo"><label for="cNome">Nome</label><input id="cNome" value="${E(dados.nome)}" autocomplete="name" required></div>
        <div class="campo"><label for="cWpp">WhatsApp</label><input id="cWpp" value="${E(dados.wpp)}" inputmode="tel" autocomplete="tel" placeholder="(71) 9 0000-0000" required></div>
        <span class="mono" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;display:block;margin:6px 0 8px">Como você pega</span>
        <div class="escolha">
          ${Object.entries(CR.ENTREGA).map(([k, v]) => `<label><input type="radio" name="ent" value="${k}" ${dados.entrega === k ? 'checked' : ''}><span><b>${v}</b><small>${k === 'corre' ? (pc ? `${CR.dataBR(pc.data, true)} · ${E(pc.local)} · grátis` : 'no próximo encontro · grátis') : k === 'coord' ? 'a gente combina dia e lugar pelo WhatsApp · grátis' : 'frete combinado pelo WhatsApp, pago à parte'}</small></span></label>`).join('')}
        </div>`;
      pe.innerHTML = `<div class="linha-total grande"><span>Total</span><span>${R(t.total)}</span></div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:10px"><button class="btn vazado" id="voltar">Voltar</button><button class="btn brasa" id="irPix">Ir pro Pix</button></div>`;
    }
    if (etapa === 'pix') {
      $('#sacTit').textContent = 'Pagamento';
      const codigo = CR.pix(pedidoAtual.total, pedidoAtual.id);
      corpo.innerHTML = passos(3) + `<div class="pix-box">
        <p class="mono" style="font-size:13px">Pedido <b>${pedidoAtual.id}</b> · ${R(pedidoAtual.total)}</p>
        <div class="qr" id="qr"></div>
        <p style="font-size:15px;margin-bottom:8px">Abre o app do banco, escolhe Pix e lê o QR. Ou copia o código:</p>
        <textarea id="pixCod" readonly>${codigo}</textarea>
        <button class="btn vazado peq" id="copiarPix" style="margin-top:8px">Copiar código Pix</button>
        ${db.config.lojaDemo ? '<p class="mono" style="font-size:11px;margin-top:12px;color:var(--brasa)">DEMO: a chave Pix é de exemplo. Não pague.</p>' : ''}
      </div>`;
      pe.innerHTML = `<button class="btn brasa" id="jaPaguei" style="width:100%">Já paguei</button><button class="btn vazado peq" id="pagarDepois">Pago depois (o pedido fica reservado)</button>`;
      if (window.QRCode) new QRCode($('#qr'), { text: codigo, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
      else $('#qr').innerHTML = '<p class="mono" style="font-size:12px;padding-top:70px">QR indisponível. Usa o copia e cola.</p>';
    }
    if (etapa === 'ok') { pintarAcompanhar(pedidoAtual, true); }
  }

  $('#gSacola').addEventListener('click', e => {
    const iq = e.target.closest('[data-iq]'), rm = e.target.closest('[data-rm]');
    if (iq) { const i = sacola[+iq.dataset.iq], p = db.produtos.find(x => x.id === i.p); i.qt = Math.max(1, Math.min(p.tamanhos[i.tam] || 1, i.qt + +iq.dataset.d)); guardar(); pintarSacola(); }
    if (rm) { sacola.splice(+rm.dataset.rm, 1); guardar(); pintarSacola(); }
    if (e.target.closest('#irDados')) { etapa = 'dados'; pintarSacola(); }
    if (e.target.closest('#voltar')) { guardarDados(); etapa = 'sacola'; pintarSacola(); }
    if (e.target.closest('#irPix')) {
      guardarDados();
      if (dados.nome.length < 2 || dados.wpp.replace(/\D/g, '').length < 10) return toast('Preenche nome e WhatsApp com DDD.');
      // confere estoque e reserva
      for (const i of sacola) { const p = db.produtos.find(x => x.id === i.p); if ((p.tamanhos[i.tam] || 0) < i.qt) return toast(`Só restam ${p.tamanhos[i.tam] || 0} de ${p.nome} ${i.tam}.`); }
      const t = totais(), num = Math.max(1041, ...db.pedidos.map(x => +x.id.split('-')[1] || 0)) + 1;
      pedidoAtual = { id: 'CR-' + num, data: new Date().toISOString().slice(0, 16), nome: dados.nome, wpp: dados.wpp, itens: sacola.map(i => ({ ...i, preco: precoDe(db.produtos.find(p => p.id === i.p)) })), entrega: dados.entrega, membro: !!membro, membroId: membro?.id || null, desconto: t.desconto, total: t.total, status: 'novo' };
      sacola.forEach(i => { db.produtos.find(p => p.id === i.p).tamanhos[i.tam] -= i.qt; });
      db.pedidos.push(pedidoAtual); CR.salvar();
      try { const meus = JSON.parse(localStorage.getItem('cr_meus_pedidos') || '[]'); meus.push(pedidoAtual.id); localStorage.setItem('cr_meus_pedidos', JSON.stringify(meus)); } catch (err) { }
      sacola = []; guardar(); grade();
      etapa = 'pix'; pintarSacola();
    }
    if (e.target.closest('#copiarPix')) { const c = $('#pixCod').value; (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => toast('Código Pix copiado.'), () => { $('#pixCod').select(); toast('Seleciona e copia o código.'); }); }
    if (e.target.closest('#jaPaguei')) { pedidoAtual.avisouPagamento = true; CR.salvar(); etapa = 'ok'; pintarSacola(); }
    if (e.target.closest('#pagarDepois')) { etapa = 'ok'; pintarSacola(); }
  });
  function guardarDados() {
    const n = $('#cNome'); if (!n) return;
    dados.nome = n.value.trim(); dados.wpp = $('#cWpp').value.trim();
    dados.entrega = (document.querySelector('input[name=ent]:checked') || {}).value || 'corre';
  }

  /* ===== Acompanhar pedido ===== */
  function pintarAcompanhar(ped, recemFeito) {
    $('#sacTit').textContent = recemFeito ? 'Pedido feito!' : 'Seu pedido';
    const ordem = ['novo', 'pago', 'separado', 'entregue'], at = ordem.indexOf(ped.status);
    const nomes = { novo: ped.avisouPagamento ? 'Pagamento enviado · conferindo' : 'Aguardando pagamento', pago: 'Pagamento confirmado', separado: 'Separado pra retirada', entregue: 'Entregue' };
    const resumo = ped.itens.map(i => `${i.qt}x ${db.produtos.find(p => p.id === i.p)?.nome || 'peça'} ${[i.cor, i.tam].filter(Boolean).join(' ')}`).join(', ');
    const msg = `Oi! Fiz o pedido ${ped.id} na loja do Collective Runners: ${resumo}. Total ${R(ped.total)}. ${CR.ENTREGA[ped.entrega]}.${ped.avisouPagamento ? ' Já paguei no Pix.' : ''}`;
    const wppLoja = (db.config.whatsLoja || '').replace(/\D/g, '');
    $('#sacCorpo').innerHTML = `<div class="ok-pedido">
      ${recemFeito ? '<img src="assets/mascote-corre.png" alt="" style="width:120px;margin:0 auto 8px">' : ''}
      <div class="num">${ped.id}</div>
      <p class="mono" style="font-size:13px">${E(resumo)}<br>${R(ped.total)} · ${CR.ENTREGA[ped.entrega]}</p>
      ${ped.status === 'cancelado' ? '<p class="trava" style="margin-top:14px">Pedido cancelado. Fala com a coordenação.</p>' : `<ul class="linha-tempo">${ordem.map((s, k) => `<li class="${k <= at ? 'feito' : ''}">${nomes[s]}</li>`).join('')}</ul>`}
      <p style="font-size:14px">Guarda o número. Dá pra acompanhar por aqui a qualquer hora.</p></div>`;
    $('#sacPe').innerHTML = `<a class="btn brasa" style="width:100%" target="_blank" rel="noopener" href="${wppLoja ? `https://wa.me/${wppLoja}?text=${encodeURIComponent(msg)}` : db.config.whatsapp}">${wppLoja ? 'Mandar comprovante no WhatsApp' : 'Falar no grupo do coletivo'}</a>
      <button class="btn vazado peq" data-fechar>Continuar olhando</button>`;
  }
  $('#linkPedido').addEventListener('click', e => {
    e.preventDefault();
    let meus = []; try { meus = JSON.parse(localStorage.getItem('cr_meus_pedidos') || '[]'); } catch (err) { }
    const num = prompt('Número do pedido (ex.: CR-1044)', meus[meus.length - 1] || '');
    if (!num) return;
    const ped = db.pedidos.find(p => p.id.toUpperCase() === num.trim().toUpperCase());
    if (!ped) return toast('Pedido não encontrado neste aparelho.');
    pintarAcompanhar(ped, false); abrirG('#gSacola');
  });

  // links diretos: loja.html#peca=p1 / #pedido=CR-1044
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('peca') && db.produtos.some(p => p.id === h.get('peca'))) abrirPeca(h.get('peca'));
  if (h.get('pedido')) { const ped = db.pedidos.find(p => p.id === h.get('pedido')); if (ped) { pintarAcompanhar(ped, false); abrirG('#gSacola'); } }
})();
