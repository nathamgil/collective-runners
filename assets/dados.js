/* Collective Runners — base de dados da demo.
   Tudo fica no localStorage do navegador (chave cr_db_v1). O site, a área do
   membro e o painel master leem e gravam aqui, então o que o painel publica
   aparece no site na hora (no mesmo navegador). Para produção, trocar por Supabase. */
(function () {
  const CHAVE = 'cr_db_v1';
  const hoje = () => new Date().toISOString().slice(0, 10);

  const fotos = (pasta, n) => Array.from({ length: n }, (_, i) => {
    const k = String(i + 1).padStart(2, '0');
    return { src: `fotos/${pasta}/${k}.jpg`, thumb: `fotos/${pasta}/${k}_t.jpg` };
  });

  const SEMENTE = {
    versao: 2,
    config: {
      whatsapp: 'https://chat.whatsapp.com/Gn3nKlCwszD1AELlvFB6Aq',
      strava: 'https://strava.app.link/lPLT9PJaHWb',
      instagram: 'https://www.instagram.com/collectiverunners/',
      tiktok: 'https://www.tiktok.com/@collectiverunners',
      ingressos: 'https://shotgun.live/pt-br/events/baile-collective',
      pinMaster: '2026',
      codigoMembro: 'CLLTV',
      pixChave: 'demo@collectiverunners.com.br',
      pixNome: 'COLLECTIVE RUNNERS',
      pixCidade: 'SALVADOR',
      whatsLoja: '',
      lojaDemo: true,
      descontoMembro: 10
    },
    corres: [
      { id: 'c1', data: '2026-10-24', hora: '19:00', nome: 'After Night Rnnrs', tipo: 'Noturno', local: 'Campo Grande → Pça. Cultural do Reggae, Pelourinho', km: 4, obs: 'Camisa branca ou preta. Dj set de @djakani na chegada.', album: 'after-out' },
      { id: 'c2', data: '2026-11-15', hora: '06:00', nome: 'CLLTV Girls x MOMA Cookies', tipo: 'Girls', local: 'Praça Ana Lúcia Magalhães, Pituba', km: 4, obs: 'Corre feminino. Camiseta exclusiva MOMA & Collective no combo.', album: 'girls-moma' },
      { id: 'c3', data: '2026-11-21', hora: '19:00', nome: 'After Night Rnnrs — Edição Baile', tipo: 'Noturno', local: 'Praça do Campo Grande → Casa Cultural do Reggae', km: 4, obs: 'Som no percurso todo. Ingresso do baile pela Shotgun; o corre é gratuito.', album: 'after-baile-corre' },
      { id: 'c4', data: '2026-11-28', hora: '', nome: 'CLLTV x Fechados com a Verdade', tipo: 'Cultural', local: 'Farol da Barra', km: null, obs: 'Encontro cultural. Horário a confirmar no Instagram.', album: '' }
    ],
    comunicados: [
      { id: 'm1', data: '2026-11-24', titulo: 'Dia 28 tem encontro cultural no Farol', texto: 'CLLTV x Fechados com a Verdade, no Farol da Barra. Encontro 100% gratuito. O horário sai no Instagram e aqui no mural.', tag: 'Agenda', fixo: true, publico: true },
      { id: 'm2', data: '2026-11-22', titulo: 'Fotos do After Baile no ar', texto: 'O dossiê do After Night — Edição Baile já está no site: o corre do Campo Grande ao Pelourinho e a noite na Casa Cultural do Reggae.', tag: 'Dossiê', fixo: false, publico: true },
      { id: 'm3', data: '2026-11-17', titulo: 'Nosso corre é 100% gratuito', texto: 'Pra colar no After você garante o ingresso na Shotgun. O corre em si é de graça, sempre. Ninguém fica pra trás.', tag: 'Aviso', fixo: false, publico: true },
      { id: 'm4', data: '2026-11-16', titulo: 'Membros: confirmem presença no app', texto: 'Quem confirma o corre aqui na área do membro ajuda a coordenação a organizar puxadores e fechamento do pelotão.', tag: 'Membros', fixo: false, publico: false }
    ],
    albuns: [
      { id: 'after-baile-corre', titulo: 'After Night Rnnrs — Edição Baile', data: '2026-11-21', local: 'Campo Grande → Pelourinho', credito: '', publico: true, fotos: fotos('after-baile-corre', 12) },
      { id: 'after-baile-festa', titulo: 'Baile Collective', data: '2026-11-21', local: 'Casa Cultural do Reggae', credito: '', publico: true, fotos: fotos('after-baile-festa', 10) },
      { id: 'girls-moma', titulo: 'CLLTV Girls x MOMA Cookie Lab', data: '2026-11-15', local: 'Pituba', credito: '@nascimenttokau', publico: true, fotos: fotos('girls-moma', 12) },
      { id: 'after-out', titulo: 'After Night Rnnrs — 1ª edição', data: '2026-10-24', local: 'Campo Grande → Pelourinho', credito: '', publico: true, fotos: fotos('after-out', 12) },
      { id: 'outubro-rosa', titulo: 'Outubro Rosa — Girls Runners', data: '2026-10-19', local: 'Parque da Cidade', credito: '@nascimenttokau', publico: true, fotos: fotos('outubro-rosa', 12) },
      { id: 'kids', titulo: 'Kids Runners — 2ª edição', data: '2026-10-13', local: 'Salvador', credito: 'corealização @doca1ssa', publico: false, fotos: fotos('kids', 12) }
    ],
    produtos: [
      { id: 'p1', nome: 'Camiseta CLLTV RNNRS', cat: 'Camisetas', desc: 'A camisa do corre, com a marca nas costas. Preta ou branca, que é o dress code dos encontros.', preco: 89.9, status: 'disponivel', drop: '', limitada: false,
        cores: ['Preta', 'Branca'], tamanhos: { PP: 4, P: 10, M: 14, G: 12, GG: 6 }, imgs: ['fotos/loja/camiseta-costas.jpg', 'fotos/loja/camiseta-uv.jpg', 'fotos/loja/camiseta-corre.jpg'] },
      { id: 'p2', nome: 'Camiseta MOMA & Collective', cat: 'Collabs', desc: 'Edição limitada da collab com a MOMA Cookie Lab, do corre das meninas de 15/11.', preco: 99.9, status: 'esgotado', drop: '', limitada: true,
        cores: ['Branca'], tamanhos: { P: 0, M: 0, G: 0 }, imgs: ['fotos/loja/moma-costas.jpg', 'fotos/loja/moma-frente.jpg'] },
      { id: 'p3', nome: 'Boné CLLTV', cat: 'Acessórios', desc: 'Pra correr no sol de Salvador sem perder o estilo.', preco: 69.9, status: 'disponivel', drop: '', limitada: false,
        cores: ['Branco'], tamanhos: { 'Único': 15 }, imgs: ['fotos/loja/bone.jpg'] },
      { id: 'p4', nome: 'Kit de adesivos', cat: 'Acessórios', desc: 'Os adesivos do coletivo pra garrafa, notebook e capacete.', preco: 15, status: 'disponivel', drop: '', limitada: false,
        cores: [], tamanhos: { 'Kit': 40 }, imgs: ['fotos/loja/adesivos.jpg'] },
      { id: 'p5', nome: 'Bandeira do coletivo', cat: 'Acessórios', desc: 'A bandeira laranja que puxa o pelotão. Pra levar pra prova, pro baile e pra parede.', preco: 120, status: 'disponivel', drop: '', limitada: true,
        cores: ['Laranja'], tamanhos: { 'Única': 5 }, imgs: ['fotos/loja/bandeira.jpg'] },
      { id: 'p6', nome: 'Camiseta After Night', cat: 'Camisetas', desc: 'Drop do After Night Rnnrs, pra quem corre de noite. Membros compram antes.', preco: 99.9, status: 'drop', drop: '2026-12-05T19:00', limitada: true,
        cores: ['Preta'], tamanhos: { P: 8, M: 12, G: 10, GG: 4 }, imgs: ['fotos/loja/after-night.jpg'] }
    ],
    pedidos: [
      { id: 'CR-1042', data: '2026-11-22T10:14', nome: 'Pedido Demo', wpp: '(71) 90000-0001', itens: [{ p: 'p1', cor: 'Preta', tam: 'M', qt: 1, preco: 89.9 }, { p: 'p4', cor: '', tam: 'Kit', qt: 2, preco: 15 }], entrega: 'corre', membro: true, desconto: 12, total: 107.9, status: 'pago' },
      { id: 'CR-1043', data: '2026-11-23T18:40', nome: 'Outro Pedido Demo', wpp: '(71) 90000-0002', itens: [{ p: 'p3', cor: 'Branco', tam: 'Único', qt: 1, preco: 69.9 }], entrega: 'corre', membro: false, desconto: 0, total: 69.9, status: 'novo' }
    ],
    parceiros: [
      { nome: 'Zerezes', cupom: 'ZS-CRUNNERS', desconto: '10%', link: 'https://zerezes.com.br/' },
      { nome: 'Zeca Smash Burguer', cupom: 'CLLTV', desconto: '10%', link: 'https://salvadorprime.zecasmashburger.com.br/zeca_smash_burger__salvador_prime' },
      { nome: 'Dendezeiro · ESTL Sports', cupom: 'ESTL.SPORTS', desconto: '20%', link: 'https://dendezeiro.com.br/collections/estl-sports' }
    ],
    apoios: ['MOMA Cookie Lab', 'Casa Cultural do Reggae', 'Parque da Cidade', 'New Balance', 'Sallve', 'Zerezes', 'Dendezeiro', 'Zeca Smash Burguer', 'Doca1ssa'],
    membros: [
      { id: 'u1', nome: 'Membro Demo', email: 'demo@clltv.run', desde: '2025-11-01', papel: 'membro', status: 'ativo', presencas: ['c1', 'c3'] },
      { id: 'u2', nome: 'Puxador Demo', email: 'puxador@clltv.run', desde: '2025-11-01', papel: 'puxador', status: 'ativo', presencas: ['c1', 'c2', 'c3'] },
      { id: 'u3', nome: 'Novo Integrante', email: 'novo@clltv.run', desde: '2026-11-20', papel: 'membro', status: 'pendente', presencas: [] }
    ],
    confirmacoes: { c4: ['u1', 'u2'] },
    listaEspera: [],
    reacoes: {}
  };

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) { const db = JSON.parse(bruto); if (db.versao === SEMENTE.versao) return db; }
    } catch (e) { /* sem storage: usa a semente */ }
    return JSON.parse(JSON.stringify(SEMENTE));
  }

  let db = carregar();
  const CR = {
    get db() { return db; },
    salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) { console.warn('não salvou', e); } },
    resetar() { db = JSON.parse(JSON.stringify(SEMENTE)); CR.salvar(); },
    hoje,
    id: (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    dataBR(iso, longo) {
      if (!iso) return '';
      const [a, m, d] = iso.split('-').map(Number);
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return longo ? `${d} de ${meses[m - 1]} de ${a}` : `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    },
    mesCurto(iso) { return ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'][Number(iso.slice(5, 7)) - 1]; },
    proximos() { return db.corres.filter(c => c.data >= hoje()).sort((a, b) => a.data.localeCompare(b.data)); },
    passados() { return db.corres.filter(c => c.data < hoje()).sort((a, b) => b.data.localeCompare(a.data)); },
    esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    sessao: {
      get(k) { try { return JSON.parse(localStorage.getItem('cr_sessao_' + k)); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem('cr_sessao_' + k, JSON.stringify(v)); } catch (e) { } },
      sair(k) { try { localStorage.removeItem('cr_sessao_' + k); } catch (e) { } }
    }
  };

  /* Lightbox compartilhado */
  CR.lightbox = function (lista, inicio) {
    let i = inicio || 0;
    let el = document.getElementById('lb');
    if (!el) {
      el = document.createElement('div'); el.id = 'lb'; el.className = 'lb';
      el.innerHTML = '<button class="lb-x" aria-label="Fechar">×</button><button class="lb-p" aria-label="Anterior">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-n" aria-label="Próxima">›</button>';
      document.body.appendChild(el);
      el.addEventListener('click', e => { if (e.target === el || e.target.classList.contains('lb-x')) fechar(); });
      document.addEventListener('keydown', e => {
        if (!el.classList.contains('on')) return;
        if (e.key === 'Escape') fechar(); if (e.key === 'ArrowRight') el._n(); if (e.key === 'ArrowLeft') el._p();
      });
      let x0 = null;
      el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) (dx < 0 ? el._n : el._p)(); x0 = null; });
    }
    const img = el.querySelector('img'), cap = el.querySelector('figcaption');
    const mostrar = () => { img.src = lista[i].src; cap.textContent = `${i + 1} / ${lista.length}${lista[i].legenda ? ' · ' + lista[i].legenda : ''}`; };
    el._n = () => { i = (i + 1) % lista.length; mostrar(); };
    el._p = () => { i = (i - 1 + lista.length) % lista.length; mostrar(); };
    el.querySelector('.lb-n').onclick = el._n; el.querySelector('.lb-p').onclick = el._p;
    function fechar() { el.classList.remove('on'); document.body.style.overflow = ''; }
    mostrar(); el.classList.add('on'); document.body.style.overflow = 'hidden';
  };

  /* ===== Loja ===== */
  CR.reais = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
  CR.estoque = p => Object.values(p.tamanhos || {}).reduce((s, n) => s + (+n || 0), 0);
  CR.membroLogado = () => { const s = CR.sessao.get('membro'); return s && db.membros.find(m => m.id === s.id && m.status === 'ativo') || null; };
  CR.precoMembro = p => Math.round(p.preco * (100 - (db.config.descontoMembro || 0))) / 100;
  // drop: aberto pra membro 24h antes, pra todo mundo na hora marcada
  CR.estadoDrop = (p, membro) => {
    if (p.status !== 'drop' || !p.drop) return 'aberto';
    const t = new Date(p.drop) - new Date();
    if (t <= 0) return 'aberto';
    if (membro && t <= 864e5) return 'aberto';
    return 'fechado';
  };
  // Pix copia-e-cola (BR Code estático, padrão EMV do Banco Central)
  CR.pix = (valor, txid) => {
    const c = db.config, f = (id, v) => id + String(v.length).padStart(2, '0') + v;
    const limpa = (s, n) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().slice(0, n);
    const conta = f('00', 'br.gov.bcb.pix') + f('01', c.pixChave);
    let p = f('00', '01') + f('26', conta) + f('52', '0000') + f('53', '986') + f('54', Number(valor).toFixed(2)) + f('58', 'BR') + f('59', limpa(c.pixNome, 25)) + f('60', limpa(c.pixCidade, 15)) + f('62', f('05', (txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25))) + '6304';
    let crc = 0xFFFF;
    for (let i = 0; i < p.length; i++) { crc ^= p.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }
    return p + crc.toString(16).toUpperCase().padStart(4, '0');
  };
  CR.STATUS_PEDIDO = { novo: 'Aguardando pagamento', pago: 'Pago', separado: 'Separado', entregue: 'Entregue', cancelado: 'Cancelado' };
  CR.ENTREGA = { corre: 'Retirar no próximo corre', coord: 'Retirar com a coordenação', salvador: 'Entrega em Salvador (a combinar)' };

  window.CR = CR;
})();
