(function () {
  let db = CR.db;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], E = CR.esc;
  const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2400); };
  const salvar = (msg) => { CR.salvar(); tudo(); if (msg) toast(msg); };

  function iniciar() {
    const ok = CR.sessao.get('master') === true;
    $('#telaEntrada').hidden = ok; $('#telaApp').hidden = !ok;
    if (ok) { tudo(); abrir((location.hash || '#geral').slice(1)); }
  }
  $('#formPin').addEventListener('submit', e => {
    e.preventDefault();
    if ($('#pin').value.trim() !== String(db.config.pinMaster)) { $('#pErro').textContent = 'PIN errado.'; return; }
    CR.sessao.set('master', true); iniciar();
  });
  $('#sair').addEventListener('click', () => { CR.sessao.sair('master'); iniciar(); });

  const ABAS = ['geral', 'comunicados', 'agenda', 'dossie', 'membros', 'loja', 'parceiros', 'config'];
  function abrir(a) {
    if (!ABAS.includes(a)) a = 'geral';
    $$('.abas button').forEach(b => b.setAttribute('aria-selected', b.dataset.aba === a));
    $$('[data-sec]').forEach(s => s.hidden = s.dataset.sec !== a);
    history.replaceState(null, '', '#' + a);
  }
  $$('.abas button').forEach(b => b.addEventListener('click', () => abrir(b.dataset.aba)));
  document.addEventListener('click', e => { const g = e.target.closest('[data-ir]'); if (g) abrir(g.dataset.ir); });

  function tudo() { geral(); comunicados(); corres(); albuns(); membros(); loja(); parceiros(); config(); }

  /* Visão geral */
  function geral() {
    const prox = CR.proximos()[0], pend = db.membros.filter(m => m.status === 'pendente');
    const ativos = db.membros.filter(m => m.status === 'ativo').length;
    const conf = prox ? (db.confirmacoes[prox.id] || []).length : 0;
    $('#nPend').textContent = pend.length || ''; $('#nPend').hidden = !pend.length;
    $('#kpis').innerHTML = `
      <div class="kpi forte"><b>${conf}</b><span>confirmados no próximo</span></div>
      <div class="kpi"><b>${ativos}</b><span>membros ativos</span></div>
      <div class="kpi"><b>${db.albuns.reduce((s, a) => s + a.fotos.length, 0)}</b><span>fotos no dossiê</span></div>
      <div class="kpi"><b>${db.listaEspera.length}</b><span>na lista da loja</span></div>`;
    $('#geralProx').innerHTML = prox ? `<p class="titulo" style="font-size:34px">${E(prox.nome)}</p>
      <p class="mono" style="margin:8px 0 14px">${CR.dataBR(prox.data, true)}${prox.hora ? ' · ' + prox.hora : ' · hora a definir'}<br>${E(prox.local)}</p>
      <p class="mono" style="font-size:13px">${(db.confirmacoes[prox.id] || []).map(id => E(db.membros.find(m => m.id === id)?.nome || '?')).join(', ') || 'Ninguém confirmou ainda.'}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn peq" data-ir="agenda">Editar agenda</button><button class="btn vazado peq" data-ir="comunicados">Avisar no mural</button></div>`
      : '<div class="vazio">Nenhum corre marcado. <button class="btn peq" data-ir="agenda">Marcar corre</button></div>';
    const itens = [];
    if (pend.length) itens.push(`<li><span>${pend.length} membro(s) esperando aprovação</span><button class="btn peq" data-ir="membros">Ver</button></li>`);
    if (prox && !prox.hora) itens.push(`<li><span>Horário do “${E(prox.nome)}” a definir</span><button class="btn peq" data-ir="agenda">Definir</button></li>`);
    const semAlbum = CR.passados().filter(c => !c.album);
    if (semAlbum.length) itens.push(`<li><span>${semAlbum.length} corre(s) passado(s) sem álbum</span><button class="btn peq" data-ir="dossie">Subir fotos</button></li>`);
    if (db.listaEspera.length) itens.push(`<li><span>${db.listaEspera.length} pessoa(s) na lista da loja</span><button class="btn peq" data-ir="loja">Ver</button></li>`);
    $('#geralPend').innerHTML = itens.join('') || '<li><span>Tudo em dia. ❤️‍🔥</span></li>';
  }

  /* Comunicados */
  function comunicados() {
    const l = [...db.comunicados].sort((a, b) => (b.fixo - a.fixo) || b.data.localeCompare(a.data));
    $('#listaCom').innerHTML = l.map(m => `<div class="caixa-p" style="padding:16px">
      <div class="mono" style="font-size:12px;margin-bottom:6px">${CR.dataBR(m.data, true)} · ${E(m.tag)} · ${m.publico ? 'público' : 'só membros'}${m.fixo ? ' · 📌 fixado' : ''}</div>
      <b class="titulo" style="font-size:24px">${E(m.titulo)}</b><p style="font-size:15px;margin:6px 0 10px">${E(m.texto)}</p>
      <div class="acoes" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn peq" data-com-ed="${m.id}">Editar</button><button class="btn vazado peq" data-com-fix="${m.id}">${m.fixo ? 'Desafixar' : 'Fixar'}</button><button class="btn vazado peq" data-com-del="${m.id}">Apagar</button></div></div>`).join('') || '<div class="vazio">Nenhum comunicado.</div>';
  }
  function limparCom() { $('#formCom').reset(); $('#comId').value = ''; $('#comData').value = CR.hoje(); $('#comPub').checked = true; $('#comTit').textContent = 'Novo comunicado'; }
  $('#comLimpar').addEventListener('click', limparCom);
  $('#formCom').addEventListener('submit', e => {
    e.preventDefault();
    const id = $('#comId').value, d = { titulo: $('#comTitulo').value.trim(), texto: $('#comTexto').value.trim(), tag: $('#comTag').value, data: $('#comData').value, publico: $('#comPub').checked, fixo: $('#comFixo').checked };
    if (d.fixo) db.comunicados.forEach(m => m.fixo = false);
    if (id) Object.assign(db.comunicados.find(m => m.id === id), d); else db.comunicados.push({ id: CR.id('m'), ...d });
    limparCom(); salvar(id ? 'Comunicado atualizado.' : 'Publicado no mural' + (d.publico ? ' e no site.' : '.'));
  });
  $('#listaCom').addEventListener('click', e => {
    const ed = e.target.closest('[data-com-ed]'), fx = e.target.closest('[data-com-fix]'), dl = e.target.closest('[data-com-del]');
    if (ed) { const m = db.comunicados.find(x => x.id === ed.dataset.comEd); $('#comId').value = m.id; $('#comTitulo').value = m.titulo; $('#comTexto').value = m.texto; $('#comTag').value = m.tag; $('#comData').value = m.data; $('#comPub').checked = m.publico; $('#comFixo').checked = m.fixo; $('#comTit').textContent = 'Editando'; $('#comTitulo').focus(); }
    if (fx) { const m = db.comunicados.find(x => x.id === fx.dataset.comFix); const v = !m.fixo; db.comunicados.forEach(x => x.fixo = false); m.fixo = v; salvar(); }
    if (dl && confirm('Apagar este comunicado?')) { db.comunicados = db.comunicados.filter(x => x.id !== dl.dataset.comDel); salvar('Apagado.'); }
  });

  /* Agenda */
  function corres() {
    $('#corAlbum').innerHTML = '<option value="">— sem álbum —</option>' + db.albuns.map(a => `<option value="${a.id}">${E(a.titulo)}</option>`).join('');
    const l = [...db.corres].sort((a, b) => b.data.localeCompare(a.data));
    $('#tabCorres').innerHTML = `<thead><tr><th>Data</th><th>Corre</th><th>Confirmados</th><th>Foram</th><th></th></tr></thead><tbody>${l.map(c => {
      const conf = (db.confirmacoes[c.id] || []).length, foram = db.membros.filter(m => m.presencas.includes(c.id)).length;
      return `<tr><td class="mono">${CR.dataBR(c.data)}<span class="sub">${c.hora || 'hora a def.'}</span></td><td><b>${E(c.nome)}</b><span class="sub">${E(c.tipo)} · ${E(c.local)}</span></td><td class="mono">${conf}</td><td class="mono">${foram}</td>
      <td><div class="acoes"><button class="btn peq" data-cor-ed="${c.id}">Editar</button><button class="btn vazado peq" data-cor-del="${c.id}">Apagar</button></div></td></tr>`;
    }).join('')}</tbody>`;
  }
  function limparCor() { $('#formCorre').reset(); $('#corId').value = ''; $('#corTit').textContent = 'Novo corre'; }
  $('#corLimpar').addEventListener('click', limparCor);
  $('#formCorre').addEventListener('submit', e => {
    e.preventDefault();
    const id = $('#corId').value, d = { nome: $('#corNome').value.trim(), tipo: $('#corTipo').value, data: $('#corData').value, hora: $('#corHora').value, local: $('#corLocal').value.trim(), km: $('#corKm').value ? +$('#corKm').value : null, album: $('#corAlbum').value, obs: $('#corObs').value.trim() };
    if (id) Object.assign(db.corres.find(c => c.id === id), d); else db.corres.push({ id: CR.id('c'), ...d });
    limparCor(); salvar('Corre salvo. Já está no cartaz do site.');
  });
  $('#tabCorres').addEventListener('click', e => {
    const ed = e.target.closest('[data-cor-ed]'), dl = e.target.closest('[data-cor-del]');
    if (ed) { const c = db.corres.find(x => x.id === ed.dataset.corEd); $('#corId').value = c.id; $('#corNome').value = c.nome; $('#corTipo').value = c.tipo; $('#corData').value = c.data; $('#corHora').value = c.hora || ''; $('#corLocal').value = c.local; $('#corKm').value = c.km ?? ''; $('#corAlbum').value = c.album || ''; $('#corObs').value = c.obs || ''; $('#corTit').textContent = 'Editando: ' + c.nome; $('#formCorre').scrollIntoView({ behavior: 'smooth' }); }
    if (dl && confirm('Apagar este corre?')) { db.corres = db.corres.filter(x => x.id !== dl.dataset.corDel); salvar('Corre apagado.'); }
  });

  /* Dossiê */
  function albuns() {
    $('#listaAlbuns').innerHTML = [...db.albuns].sort((a, b) => b.data.localeCompare(a.data)).map(a => `
      <div class="caixa-p">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:start">
          <div><b class="titulo" style="font-size:28px">${E(a.titulo)}</b><div class="mono" style="font-size:12px">${CR.dataBR(a.data, true)} · ${E(a.local || '')} · ${a.fotos.length} fotos${a.credito ? ' · ' + E(a.credito) : ''}</div></div>
          <div class="acoes" style="display:flex;gap:6px;flex-wrap:wrap">
            <label class="btn peq" style="cursor:pointer">+ Fotos<input type="file" accept="image/*" multiple hidden data-al-up="${a.id}"></label>
            <button class="btn vazado peq" data-al-pub="${a.id}">${a.publico ? 'Público ✓' : 'Só membros'}</button>
            <button class="btn vazado peq" data-al-del="${a.id}">Apagar</button>
          </div>
        </div>
        <div class="fotos-admin">${a.fotos.map((f, i) => `<div><img src="${f.thumb}" alt="" loading="lazy"><button class="capa-b" data-al-capa="${a.id}" data-i="${i}" title="Usar como capa">${(a.capa || 0) === i ? '★ capa' : 'capa'}</button><button data-al-rm="${a.id}" data-i="${i}" aria-label="Remover foto">×</button></div>`).join('')}</div>
      </div>`).join('');
  }
  $('#formAlbum').addEventListener('submit', e => {
    e.preventDefault();
    db.albuns.push({ id: CR.id('a'), titulo: $('#alTitulo').value.trim(), data: $('#alData').value, local: $('#alLocal').value.trim(), credito: $('#alCredito').value.trim(), publico: $('#alPub').checked, fotos: [] });
    e.target.reset(); $('#alPub').checked = true; salvar('Álbum criado. Agora sobe as fotos.');
  });
  function reduzir(arq, max) {
    return new Promise((ok, erro) => {
      const img = new Image(); img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', .72)); URL.revokeObjectURL(img.src);
      }; img.onerror = erro; img.src = URL.createObjectURL(arq);
    });
  }
  $('#listaAlbuns').addEventListener('change', async e => {
    const inp = e.target.closest('[data-al-up]'); if (!inp) return;
    const a = db.albuns.find(x => x.id === inp.dataset.alUp);
    for (const arq of inp.files) { const src = await reduzir(arq, 1200); a.fotos.push({ src, thumb: src }); }
    try { salvar(inp.files.length + ' foto(s) no álbum.'); } catch (err) { toast('Memória da demo cheia. Na versão final as fotos vão pro servidor.'); }
  });
  $('#listaAlbuns').addEventListener('click', e => {
    const pub = e.target.closest('[data-al-pub]'), del = e.target.closest('[data-al-del]'), rm = e.target.closest('[data-al-rm]'), capa = e.target.closest('[data-al-capa]');
    if (pub) { const a = db.albuns.find(x => x.id === pub.dataset.alPub); a.publico = !a.publico; salvar(a.publico ? 'Álbum público no site.' : 'Álbum só para membros.'); }
    if (del && confirm('Apagar o álbum inteiro?')) { db.albuns = db.albuns.filter(x => x.id !== del.dataset.alDel); salvar('Álbum apagado.'); }
    if (rm) { const a = db.albuns.find(x => x.id === rm.dataset.alRm); a.fotos.splice(+rm.dataset.i, 1); if ((a.capa || 0) >= a.fotos.length) a.capa = 0; salvar(); }
    if (capa) { const a = db.albuns.find(x => x.id === capa.dataset.alCapa); a.capa = +capa.dataset.i; a.fotos.unshift(...a.fotos.splice(a.capa, 1)); a.capa = 0; salvar('Capa trocada.'); }
  });

  /* Membros */
  function membros() {
    $('#tabMembros').innerHTML = `<thead><tr><th>Nome</th><th>Desde</th><th>Corres</th><th>Papel</th><th>Status</th><th></th></tr></thead><tbody>${db.membros.map(m => `
      <tr><td><b>${E(m.nome)}</b><span class="sub">${E(m.email)}</span></td><td class="mono">${CR.dataBR(m.desde, true)}</td><td class="mono">${m.presencas.length}</td>
      <td><select data-m-papel="${m.id}" style="border:2px solid var(--tinta);padding:6px">${['membro', 'puxador', 'fotógrafo', 'coordenação'].map(p => `<option${p === m.papel ? ' selected' : ''}>${p}</option>`).join('')}</select></td>
      <td><span class="tag ${m.status === 'ativo' ? '' : m.status === 'pendente' ? 'brasa' : 'rosa'}">${m.status}</span></td>
      <td><div class="acoes">${m.status !== 'ativo' ? `<button class="btn peq" data-m-ok="${m.id}">Aprovar</button>` : `<button class="btn vazado peq" data-m-bl="${m.id}">Bloquear</button>`}</div></td></tr>`).join('')}</tbody>`;
  }
  $('#tabMembros').addEventListener('click', e => {
    const ok = e.target.closest('[data-m-ok]'), bl = e.target.closest('[data-m-bl]');
    if (ok) { db.membros.find(m => m.id === ok.dataset.mOk).status = 'ativo'; salvar('Membro aprovado.'); }
    if (bl && confirm('Bloquear este membro?')) { db.membros.find(m => m.id === bl.dataset.mBl).status = 'bloqueado'; salvar('Membro bloqueado.'); }
  });
  $('#tabMembros').addEventListener('change', e => { const s = e.target.closest('[data-m-papel]'); if (s) { db.membros.find(m => m.id === s.dataset.mPapel).papel = s.value; salvar('Papel atualizado.'); } });

  /* Loja */
  const ST = { 'em-breve': 'Em breve', 'disponivel': 'Disponível', 'esgotado': 'Esgotado' };
  function loja() {
    $('#tabProd').innerHTML = `<thead><tr><th>Peça</th><th>Status</th><th>Preço</th><th>Estoque</th><th>Interessados</th><th></th></tr></thead><tbody>${db.produtos.map(p => `
      <tr><td style="display:flex;gap:10px;align-items:center"><img src="${p.img}" alt="" style="width:44px;height:54px;object-fit:cover"><div><b>${E(p.nome)}</b><span class="sub">${E(p.desc)}</span></div></td>
      <td>${ST[p.status]}</td><td class="mono">${p.preco ? 'R$ ' + Number(p.preco).toFixed(2).replace('.', ',') : 'a definir'}</td><td class="mono">${p.estoque}</td>
      <td class="mono">${db.listaEspera.filter(x => x.peca === p.id).length}</td>
      <td><div class="acoes"><button class="btn peq" data-p-ed="${p.id}">Editar</button><button class="btn vazado peq" data-p-del="${p.id}">Apagar</button></div></td></tr>`).join('')}</tbody>`;
    $('#tabEspera').innerHTML = db.listaEspera.length ? `<thead><tr><th>Data</th><th>Nome</th><th>WhatsApp</th><th>Peça</th><th>Tam.</th><th>Tipo</th><th></th></tr></thead><tbody>${db.listaEspera.map(x => `
      <tr><td class="mono">${CR.dataBR(x.data)}</td><td>${E(x.nome)}</td><td class="mono">${E(x.wpp)}</td><td>${E(db.produtos.find(p => p.id === x.peca)?.nome || '—')}</td><td>${E(x.tam)}</td><td>${x.tipo}</td>
      <td><a class="btn peq" target="_blank" rel="noopener" href="https://wa.me/55${x.wpp.replace(/\D/g, '').replace(/^55/, '')}?text=${encodeURIComponent('Oi ' + x.nome.split(' ')[0] + '! Aqui é do Collective Runners, sobre a ' + (db.produtos.find(p => p.id === x.peca)?.nome || 'peça') + ' ❤️‍🔥')}">WhatsApp</a></td></tr>`).join('')}</tbody>`
      : '<tbody><tr><td class="mono">Ninguém na lista ainda. O botão “Me avisa” do site alimenta esta tabela.</td></tr></tbody>';
  }
  function limparProd() { $('#formProd').reset(); $('#prodId').value = ''; $('#prodTit').textContent = 'Nova peça'; }
  $('#prodLimpar').addEventListener('click', limparProd);
  $('#formProd').addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('#prodId').value, arq = $('#prodImg').files[0];
    const d = { nome: $('#prodNome').value.trim(), status: $('#prodStatus').value, preco: $('#prodPreco').value ? +$('#prodPreco').value : null, estoque: +$('#prodEstoque').value || 0, desc: $('#prodDesc').value.trim() };
    if (arq) d.img = await reduzir(arq, 700);
    if (id) Object.assign(db.produtos.find(p => p.id === id), d); else db.produtos.push({ id: CR.id('p'), img: d.img || 'fotos/after-baile-corre/03_t.jpg', ...d });
    limparProd(); salvar('Peça salva. Já está na vitrine do site.');
  });
  $('#tabProd').addEventListener('click', e => {
    const ed = e.target.closest('[data-p-ed]'), dl = e.target.closest('[data-p-del]');
    if (ed) { const p = db.produtos.find(x => x.id === ed.dataset.pEd); $('#prodId').value = p.id; $('#prodNome').value = p.nome; $('#prodStatus').value = p.status; $('#prodPreco').value = p.preco ?? ''; $('#prodEstoque').value = p.estoque; $('#prodDesc').value = p.desc; $('#prodTit').textContent = 'Editando: ' + p.nome; $('#formProd').scrollIntoView({ behavior: 'smooth' }); }
    if (dl && confirm('Apagar esta peça?')) { db.produtos = db.produtos.filter(x => x.id !== dl.dataset.pDel); salvar('Peça apagada.'); }
  });

  /* Parceiros */
  function parceiros() {
    $('#tabParc').innerHTML = `<thead><tr><th>Parceiro</th><th>Cupom</th><th>Desconto</th><th></th></tr></thead><tbody>${db.parceiros.map((p, i) => `
      <tr><td><b>${E(p.nome)}</b><span class="sub">${E(p.link.slice(0, 50))}</span></td><td class="mono">${E(p.cupom)}</td><td class="mono">${E(p.desconto)}</td><td><button class="btn vazado peq" data-pa-del="${i}">Remover</button></td></tr>`).join('')}</tbody>`;
  }
  $('#formParc').addEventListener('submit', e => {
    e.preventDefault();
    db.parceiros.push({ nome: $('#paNome').value.trim(), cupom: $('#paCupom').value.trim().toUpperCase(), desconto: $('#paDesc').value.trim(), link: $('#paLink').value.trim() });
    e.target.reset(); salvar('Cupom no ar.');
  });
  $('#tabParc').addEventListener('click', e => { const d = e.target.closest('[data-pa-del]'); if (d && confirm('Remover cupom?')) { db.parceiros.splice(+d.dataset.paDel, 1); salvar('Removido.'); } });

  /* Config */
  function config() {
    const c = db.config;
    $('#cfWpp').value = c.whatsapp; $('#cfStrava').value = c.strava; $('#cfInsta').value = c.instagram; $('#cfTiktok').value = c.tiktok; $('#cfCod').value = c.codigoMembro; $('#cfPin').value = c.pinMaster;
  }
  $('#formCfg').addEventListener('submit', e => {
    e.preventDefault();
    Object.assign(db.config, { whatsapp: $('#cfWpp').value.trim(), strava: $('#cfStrava').value.trim(), instagram: $('#cfInsta').value.trim(), tiktok: $('#cfTiktok').value.trim(), codigoMembro: $('#cfCod').value.trim(), pinMaster: $('#cfPin').value.trim() });
    salvar('Config salva.');
  });
  $('#resetar').addEventListener('click', () => { if (confirm('Voltar tudo para os dados originais da demo?')) { CR.resetar(); db = CR.db; tudo(); toast('Demo restaurada.'); } });

  limparCom();
  iniciar();
})();
