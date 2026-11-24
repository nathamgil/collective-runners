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
    versao: 1,
    config: {
      whatsapp: 'https://chat.whatsapp.com/Gn3nKlCwszD1AELlvFB6Aq',
      strava: 'https://strava.app.link/lPLT9PJaHWb',
      instagram: 'https://www.instagram.com/collectiverunners/',
      tiktok: 'https://www.tiktok.com/@collectiverunners',
      ingressos: 'https://shotgun.live/pt-br/events/baile-collective',
      pinMaster: '2026',
      codigoMembro: 'CLLTV'
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
      { id: 'p1', nome: 'Camiseta MOMA & Collective', desc: 'Edição limitada da collab com a MOMA Cookie Lab.', preco: null, status: 'esgotado', estoque: 0, img: 'fotos/girls-moma/10_t.jpg' },
      { id: 'p2', nome: 'Camiseta CLLTV RNNRS', desc: 'A camisa do corre. Preta ou branca.', preco: null, status: 'em-breve', estoque: 0, img: 'fotos/after-baile-corre/03_t.jpg' },
      { id: 'p3', nome: 'Bandeira laranja do coletivo', desc: 'A mesma que puxa o pelotão.', preco: null, status: 'em-breve', estoque: 0, img: 'fotos/after-out/11_t.jpg' },
      { id: 'p4', nome: 'Boné CLLTV', desc: 'Peça em estudo pela coordenação.', preco: null, status: 'em-breve', estoque: 0, img: 'fotos/girls-moma/09_t.jpg' }
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

  window.CR = CR;
})();
